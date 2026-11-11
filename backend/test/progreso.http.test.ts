import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { Types } from "mongoose";
import { Partida } from "../src/modelos/Partida.model";
import { Videojuego } from "../src/modelos/Videojuego.model";
import {
  clienteHttp, copiar, doblarColeccion, INEXISTENTE, JUEGO, META,
  OTRA_META, OTRO_JUEGO, preparar, registroMeta, type Registro,
} from "./soporte-metas";

// E2-T10: app, servicios y dominio reales; solo las colecciones son dobles.
// No arranca index.ts ni conecta una base. No acredita índices o persistencia real.
const AHORA = "2026-11-04T12:00:00-05:00";
const RUTA = `/api/videojuegos/${JUEGO}/progreso-semanal`;
let siguienteId = 100;

function sesion(fecha: string, minutos = 60, avance = 40, cambios: Registro = {}): Registro {
  return {
    _id: new Types.ObjectId((siguienteId++).toString(16).padStart(24, "0")),
    videojuego: new Types.ObjectId(JUEGO), fecha: new Date(fecha),
    duracionMinutos: minutos, porcentajeAvance: avance,
    createdAt: new Date("2026-11-01T10:00:00Z"),
    updatedAt: new Date("2026-11-01T10:00:00Z"), ...cambios,
  };
}

function metaConHitos(cambios: Registro = {}) {
  return registroMeta({ hitos: [
    { descripcion: "Cuarto", porcentajeObjetivo: 25 },
    { descripcion: "Mitad", porcentajeObjetivo: 50 },
    { descripcion: "Final", porcentajeObjetivo: 100 },
  ], ...cambios });
}

function escenario(t: TestContext, partidas: Registro[] = [], metas: Registro[] = [metaConHitos()]) {
  const base = preparar(t, metas);
  const almacen = doblarColeccion(t, Partida, partidas);
  const ordenesResumen: Registro[] = [];
  // Emula el ordenamiento de la consulta de colección, no un resumen alternativo.
  // Exige que el servicio original solicite exactamente sus tres desempates.
  t.mock.method(Partida.collection, "findOne", async (filtro: Registro, opciones: Registro = {}) => {
    assert.deepEqual(opciones.sort, { fecha: -1, createdAt: -1, _id: -1 });
    ordenesResumen.push(copiar(opciones.sort));
    const filas = almacen.filas.filter((p) => String(p.videojuego) === String(filtro.videojuego));
    filas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()
      || b.createdAt.getTime() - a.createdAt.getTime()
      || String(b._id).localeCompare(String(a._id)));
    return copiar(filas[0] ?? null);
  });
  t.mock.timers.enable({ apis: ["Date"], now: new Date(AHORA) });
  return { ...base, almacen, ordenesResumen };
}

function sinEscrituras(e: ReturnType<typeof escenario>) {
  assert.equal(e.almacen.escrituras.length, 0);
  assert.equal(e.coleccion.escrituras.length, 0);
  assert.equal(e.juegos.escrituras.length, 0);
}

test("Infraestructura T10: reloj fijo y resumen P3 existente funcionan con dobles", async (t) => {
  const e = escenario(t, [sesion("2026-11-03T10:00:00-05:00", 60, 40)]);
  assert.equal(new Date().getTime(), new Date(AHORA).getTime());
  const pedir = await clienteHttp(t);
  const r = await pedir("GET", `/api/videojuegos/${JUEGO}/resumen`);
  assert.equal(r.status, 200);
  assert.equal(r.body.resumen.porcentajeAvance, 40);
  assert.equal(e.ordenesResumen.length, 1);
  sinEscrituras(e);
});

test("CA-05.1/CA-05.2/CA-05.3/CA-06.1/CA-06.4: 200 con contrato progreso completo", async (t) => {
  const anteriores = [20, 21, 22, 23, 24].map((dia) => sesion(`2026-10-${dia}T10:00:00-05:00`));
  const e = escenario(t, [...anteriores,
    sesion("2026-11-01T10:00:00-05:00", 40, 20),
    sesion("2026-11-02T10:00:00-05:00", 30, 25),
    sesion("2026-11-02T11:00:00-05:00", 30, 25),
    sesion("2026-11-03T10:00:00-05:00", 90, 50),
    sesion("2026-11-04T10:00:00-05:00", 60, 60),
  ]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { progreso: {
    semana: { inicio: "2026-11-02", fin: "2026-11-08" },
    meta: { horasSemanales: 5, diasPorSemana: 4 },
    horasSemana: 3.5, porcentajeHoras: 70, diasJugadosSemana: 3,
    rachaActual: 4, mejorRacha: 5,
    hitos: [
      { descripcion: "Cuarto", porcentajeObjetivo: 25, alcanzado: true },
      { descripcion: "Mitad", porcentajeObjetivo: 50, alcanzado: true },
      { descripcion: "Final", porcentajeObjetivo: 100, alcanzado: false },
    ],
  } });
  assert.ok(r.requestId); assert.equal(e.ordenesResumen.length, 1); sinEscrituras(e);
});

for (const id of ["invalido", "0".repeat(23), "z".repeat(24)]) {
  test(`400: ID de progreso inválido (${id}) sin consultar colecciones`, async (t) => {
    const e = escenario(t);
    t.mock.method(Videojuego.collection, "findOne", async () => { throw new Error("No debe consultar un ID inválido"); });
    const pedir = await clienteHttp(t); const r = await pedir("GET", `/api/videojuegos/${id}/progreso-semanal`);
    assert.equal(r.status, 400); assert.ok(r.body.error);
    assert.ok(r.requestId); assert.equal(r.body.requestId, r.requestId); sinEscrituras(e);
  });
}

test("404: videojuego inexistente, distinto de ruta inexistente", async (t) => {
  const e = escenario(t); const pedir = await clienteHttp(t);
  const r = await pedir("GET", `/api/videojuegos/${INEXISTENTE}/progreso-semanal`);
  assert.equal(r.status, 404); assert.equal(r.body.error, "Videojuego no encontrado");
  assert.equal(r.body.requestId, r.requestId); sinEscrituras(e);
});

for (const anteriores of [false, true]) {
  test(`CA-05.8: sin meta activa, actividad disponible sin hitos anteriores (${anteriores})`, async (t) => {
    const e = escenario(t, [sesion("2026-11-02T10:00:00-05:00"), sesion("2026-11-03T10:00:00-05:00")],
      anteriores ? [metaConHitos({ activa: false })] : []);
    const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
    assert.equal(r.status, 200);
    assert.equal(r.body.progreso.meta, null); assert.equal(r.body.progreso.porcentajeHoras, null);
    assert.deepEqual(r.body.progreso.hitos, []); assert.equal(r.body.progreso.horasSemana, 2);
    assert.equal(r.body.progreso.diasJugadosSemana, 2); assert.equal(r.body.progreso.rachaActual, 2);
    assert.equal(r.body.progreso.mejorRacha, 2); sinEscrituras(e);
  });
}

test("CA-05.9/CA-07.1: sin partidas, actividad cero e hitos no alcanzados", async (t) => {
  const e = escenario(t); const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200);
  const p = r.body.progreso;
  assert.equal(p.horasSemana, 0); assert.equal(p.diasJugadosSemana, 0);
  assert.equal(p.rachaActual, 0); assert.equal(p.mejorRacha, 0); assert.equal(p.porcentajeHoras, 0);
  assert.equal(p.hitos.length, 3); assert.ok(p.hitos.every((h: Registro) => h.alcanzado === false));
  assert.equal(e.ordenesResumen.length, 1); sinEscrituras(e);
});

test("CA-05.8/CA-05.9: sin partidas ni meta mantiene porcentaje null", async (t) => {
  escenario(t, [], []); const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.progreso, {
    semana: { inicio: "2026-11-02", fin: "2026-11-08" }, meta: null,
    horasSemana: 0, porcentajeHoras: null, diasJugadosSemana: 0,
    rachaActual: 0, mejorRacha: 0, hitos: [],
  });
});

test("CA-07.1: meta activa sin hitos devuelve lista vacía", async (t) => {
  escenario(t, [sesion("2026-11-03T10:00:00-05:00")], [metaConHitos({ hitos: [] })]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200); assert.deepEqual(r.body.progreso.hitos, []);
});

test("CA-05.8/CA-07.3: seleccionar solo meta activa de este juego, no anterior ni ajena", async (t) => {
  const e = escenario(t, [sesion("2026-11-03T10:00:00-05:00", 60, 60)], [
    metaConHitos({ _id: new Types.ObjectId(OTRA_META), activa: false, horasSemanales: 1,
      hitos: [{ descripcion: "Anterior", porcentajeObjetivo: 1 }] }),
    metaConHitos({ _id: new Types.ObjectId(INEXISTENTE), videojuego: new Types.ObjectId(OTRO_JUEGO),
      hitos: [{ descripcion: "Ajeno", porcentajeObjetivo: 1 }] }),
    metaConHitos(),
  ]);
  const antes = copiar(e.coleccion.filas);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200); assert.equal(r.body.progreso.meta.horasSemanales, 5);
  assert.deepEqual(r.body.progreso.hitos.map((h: Registro) => h.descripcion), ["Cuarto", "Mitad", "Final"]);
  assert.deepEqual(e.coleccion.filas, antes); sinEscrituras(e);
});

test("CA-05.5/CA-06.5/CA-07.3: partida futura no suma actividad, pero sí determina hitos vía P3", async (t) => {
  const e = escenario(t, [
    sesion("2026-11-03T10:00:00-05:00", 60, 40),
    sesion("2026-11-05T10:00:00-05:00", 600, 80),
  ]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200);
  const p = r.body.progreso;
  assert.equal(p.horasSemana, 1); assert.equal(p.diasJugadosSemana, 1);
  assert.equal(p.rachaActual, 1); assert.equal(p.mejorRacha, 1);
  assert.equal(p.hitos[1].alcanzado, true); assert.equal(p.hitos[2].alcanzado, false);
  assert.equal(e.ordenesResumen.length, 1); sinEscrituras(e);
});

test("CA-05.5/CA-07.3: solo partidas futuras, actividad cero y hito alcanzado válido", async (t) => {
  escenario(t, [sesion("2026-11-05T10:00:00-05:00", 60, 80)]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200);
  const p = r.body.progreso;
  assert.equal(p.horasSemana, 0); assert.equal(p.diasJugadosSemana, 0);
  assert.equal(p.rachaActual, 0); assert.equal(p.mejorRacha, 0);
  assert.equal(p.hitos[1].alcanzado, true);
});

for (const desempate of ["fecha", "createdAt", "_id"] as const) {
  test(`CA-07.3: resumen P3 conserva prioridad/desempate por ${desempate}`, async (t) => {
    const a = sesion("2026-11-02T10:00:00-05:00", 60, 90, {
      _id: new Types.ObjectId("000000000000000000000021"), createdAt: new Date("2026-11-02T11:00:00Z"),
    });
    const b = sesion("2026-11-02T10:00:00-05:00", 60, 40, {
      _id: new Types.ObjectId("000000000000000000000022"), createdAt: new Date("2026-11-02T11:00:00Z"),
    });
    if (desempate === "fecha") {
      b.fecha = new Date("2026-11-03T10:00:00-05:00");
      a.createdAt = new Date("2026-11-04T10:00:00Z");
    } else if (desempate === "createdAt") {
      b.createdAt = new Date("2026-11-03T10:00:00Z");
      a._id = new Types.ObjectId("000000000000000000000099");
    }
    const e = escenario(t, [a, b]); const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
    assert.equal(r.status, 200); assert.equal(r.body.progreso.hitos[1].alcanzado, false);
    assert.equal(e.ordenesResumen.length, 1);
  });
}

test("CA-05.10: excluir actividad e hitos de otro juego", async (t) => {
  escenario(t, [sesion("2026-11-03T10:00:00-05:00", 60, 40),
    sesion("2026-11-04T10:00:00-05:00", 600, 100, { videojuego: new Types.ObjectId(OTRO_JUEGO) })]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200); assert.equal(r.body.progreso.horasSemana, 1);
  assert.equal(r.body.progreso.diasJugadosSemana, 1); assert.equal(r.body.progreso.rachaActual, 1);
  assert.equal(r.body.progreso.hitos[1].alcanzado, false);
});

test("CA-05.6: backend conserva porcentaje superior a 100", async (t) => {
  escenario(t, [sesion("2026-11-03T10:00:00-05:00", 420)]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200); assert.equal(r.body.progreso.horasSemana, 7);
  assert.equal(r.body.progreso.porcentajeHoras, 140);
});

test("CA-05.6: porcentaje usa primero horas redondeadas", async (t) => {
  escenario(t, [sesion("2026-11-03T10:00:00-05:00", 64)], [metaConHitos({ horasSemanales: 3 })]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 200); assert.equal(r.body.progreso.horasSemana, 1.1);
  assert.equal(r.body.progreso.porcentajeHoras, 37);
});

test("CA-03.2/CA-04.5: meta creada después no excluye partidas; editar recalcula toda la semana", async (t) => {
  escenario(t, [sesion("2026-11-02T10:00:00-05:00", 120)],
    [metaConHitos({ createdAt: new Date("2026-11-04T09:00:00-05:00") })]);
  const pedir = await clienteHttp(t); const antes = await pedir("GET", RUTA);
  assert.equal(antes.status, 200); assert.equal(antes.body.progreso.horasSemana, 2);
  assert.equal(antes.body.progreso.porcentajeHoras, 40);
  const editada = await pedir("PUT", `/api/metas/${META}`, { horasSemanales: 10, diasPorSemana: 2, hitos: [] });
  assert.equal(editada.status, 200);
  const despues = await pedir("GET", RUTA);
  assert.equal(despues.status, 200); assert.equal(despues.body.progreso.horasSemana, 2);
  assert.equal(despues.body.progreso.porcentajeHoras, 20);
  assert.equal(despues.body.progreso.meta.diasPorSemana, 2); assert.deepEqual(despues.body.progreso.hitos, []);
});

test("CA-07.2: nueva partida con menor avance revierte el hito sin persistir alcanzado", async (t) => {
  const e = escenario(t, [sesion("2026-11-02T10:00:00-05:00", 60, 60)]);
  const antesMeta = copiar(e.coleccion.filas); const pedir = await clienteHttp(t);
  const antes = await pedir("GET", RUTA);
  assert.equal(antes.status, 200); assert.equal(antes.body.progreso.hitos[1].alcanzado, true);
  const creada = await pedir("POST", "/api/partidas", {
    videojuego: JUEGO, fecha: "2026-11-04T10:00:00-05:00", duracionMinutos: 60, porcentajeAvance: 40,
  });
  assert.equal(creada.status, 201);
  const despues = await pedir("GET", RUTA);
  assert.equal(despues.status, 200); assert.equal(despues.body.progreso.hitos[1].alcanzado, false);
  assert.equal(e.coleccion.escrituras.length, 0); assert.deepEqual(e.coleccion.filas, antesMeta);
});

for (const [consulta, horas, inicio, fin] of [
  ["2026-11-09T04:59:59.999Z", 1, "2026-11-02", "2026-11-08"],
  ["2026-11-09T05:00:00.000Z", 2, "2026-11-09", "2026-11-15"],
] as const) {
  test(`CA-05.1/CA-05.4: límite domingo/lunes con consulta ${consulta}`, async (t) => {
    escenario(t, [sesion("2026-11-09T04:59:59.999Z", 60), sesion("2026-11-09T05:00:00.000Z", 120)]);
    t.mock.timers.setTime(new Date(consulta).getTime());
    const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
    assert.equal(r.status, 200); assert.equal(r.body.progreso.horasSemana, horas);
    assert.deepEqual(r.body.progreso.semana, { inicio, fin });
  });
}

test("500: fallo al consultar el resumen no se presenta como progreso cero", async (t) => {
  const e = escenario(t, [sesion("2026-11-03T10:00:00-05:00")]);
  t.mock.method(Partida.collection, "findOne", async () => { throw new Error("Fallo de consulta simulado"); });
  t.mock.method(console, "error", () => undefined);
  const pedir = await clienteHttp(t); const r = await pedir("GET", RUTA);
  assert.equal(r.status, 500); assert.equal(r.body.error, "Error interno del servidor");
  assert.ok(r.requestId); assert.equal(r.body.requestId, r.requestId);
  assert.equal(r.body.progreso, undefined); sinEscrituras(e);
});
