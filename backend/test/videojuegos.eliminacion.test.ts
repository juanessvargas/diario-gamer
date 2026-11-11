import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test, { type TestContext } from "node:test";
import { Types } from "mongoose";
import { Partida } from "../src/modelos/Partida.model";
import { Videojuego } from "../src/modelos/Videojuego.model";
import {
  copiar, doblarColeccion, INEXISTENTE, JUEGO, META, OTRA_META,
  OTRO_JUEGO, preparar, registroMeta, type Registro,
} from "./soporte-metas";

// E2-T11: endpoint, controlador y servicio reales; colecciones sustituidas.
// No acredita persistencia real ni atomicidad. D9 sigue diferido.
const RUTA = `/api/videojuegos/${JUEGO}`;
const ID_META_AJENA = "000000000000000000000031";
const ID_META_INACTIVA_AJENA = "000000000000000000000032";

function meta(activa = true, id = META, videojuego = JUEGO) {
  return registroMeta({
    _id: new Types.ObjectId(id), videojuego: new Types.ObjectId(videojuego), activa,
    hitos: [{ descripcion: "Mitad", porcentajeObjetivo: 50 }, { descripcion: "Final", porcentajeObjetivo: 100 }],
  });
}

function sesion(id: string, videojuego = JUEGO): Registro {
  return {
    _id: new Types.ObjectId(id), videojuego: new Types.ObjectId(videojuego),
    fecha: new Date("2026-11-03T10:00:00-05:00"), duracionMinutos: 60, porcentajeAvance: 50,
  };
}

function escenario(
  t: TestContext,
  propias: Registro[] = [meta()],
  partidasPropias: Registro[] = [sesion("000000000000000000000041"), sesion("000000000000000000000042")],
  fallo?: "partidas" | "metas" | "videojuego",
) {
  const base = preparar(t, [...propias,
    meta(true, ID_META_AJENA, OTRO_JUEGO), meta(false, ID_META_INACTIVA_AJENA, OTRO_JUEGO),
  ]);
  const partidas = doblarColeccion(t, Partida, [...partidasPropias, sesion("000000000000000000000043", OTRO_JUEGO)]);
  const operaciones: string[] = [];

  for (const [nombre, modelo, filas] of [
    ["partidas", Partida, partidas.filas], ["metas", base.Meta, base.coleccion.filas],
  ] as const) {
    t.mock.method(modelo.collection, "deleteMany", async (filtro: Registro) => {
      operaciones.push(nombre);
      assert.deepEqual(Object.keys(filtro), ["videojuego"]); // No filtrar solo activa.
      assert.equal(String(filtro.videojuego), JUEGO);
      if (fallo === nombre) throw new Error(`Fallo simulado al borrar ${nombre}`);
      let deletedCount = 0;
      for (let i = filas.length - 1; i >= 0; i -= 1) {
        if (String(filas[i].videojuego) === String(filtro.videojuego)) {
          filas.splice(i, 1); deletedCount += 1;
        }
      }
      return { acknowledged: true, deletedCount };
    });
  }
  t.mock.method(Videojuego.collection, "deleteOne", async (filtro: Registro) => {
    operaciones.push("videojuego");
    assert.equal(String(filtro._id), JUEGO);
    if (fallo === "videojuego") throw new Error("Fallo simulado al borrar videojuego");
    const indice = base.juegos.filas.findIndex((j) => String(j._id) === String(filtro._id));
    if (indice !== -1) base.juegos.filas.splice(indice, 1);
    return { acknowledged: true, deletedCount: indice === -1 ? 0 : 1 };
  });
  return { ...base, partidas, operaciones };
}

async function cliente(t: TestContext) {
  // Cliente propio: DELETE 204 tiene cuerpo vacío y no se debe parsear como JSON.
  const { app } = require("../src/app");
  const server = createServer(app);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const address = server.address(); assert.ok(address && typeof address !== "string");
  return async (ruta = RUTA) => {
    const r = await fetch(`http://127.0.0.1:${address.port}${ruta}`, { method: "DELETE", signal: AbortSignal.timeout(5000) });
    return { status: r.status, texto: await r.text(), requestId: r.headers.get("X-Request-Id") };
  };
}

function propias(filas: Registro[]) {
  return filas.filter((fila) => String(fila.videojuego) === JUEGO);
}

function datosAjenos(e: ReturnType<typeof escenario>) {
  return copiar({
    juegos: e.juegos.filas.filter((j) => String(j._id) === OTRO_JUEGO),
    partidas: e.partidas.filas.filter((p) => String(p.videojuego) === OTRO_JUEGO),
    metas: e.coleccion.filas.filter((m) => String(m.videojuego) === OTRO_JUEGO),
  });
}

test("CA-08.1: DELETE elimina meta activa y sus hitos con 204 sin cuerpo", async (t) => {
  const e = escenario(t); const borrar = await cliente(t); const r = await borrar();
  assert.equal(r.status, 204); assert.equal(r.texto, ""); assert.ok(r.requestId);
  assert.equal(e.juegos.filas.some((j) => String(j._id) === JUEGO), false);
  assert.equal(propias(e.partidas.filas).length, 0);
  assert.equal(propias(e.coleccion.filas).length, 0); // Los hitos son embebidos en estas metas.
});

test("CA-08.1: elimina metas activas e inactivas, sin limitar la cascada a la activa", async (t) => {
  const e = escenario(t, [meta(), meta(false, OTRA_META), meta(false, INEXISTENTE)]);
  const borrar = await cliente(t); const r = await borrar();
  assert.equal(r.status, 204); assert.equal(propias(e.coleccion.filas).length, 0);
  assert.deepEqual(e.operaciones, ["partidas", "metas", "videojuego"]);
});

test("CA-08.1: elimina también un historial con solo metas inactivas", async (t) => {
  const e = escenario(t, [meta(false)]); const borrar = await cliente(t);
  assert.equal((await borrar()).status, 204); assert.equal(propias(e.coleccion.filas).length, 0);
});

test("CA-08.2: conserva videojuegos, partidas, metas activas/inactivas e hitos ajenos", async (t) => {
  const e = escenario(t, [meta(), meta(false, OTRA_META)]); const ajenos = datosAjenos(e);
  const borrar = await cliente(t); assert.equal((await borrar()).status, 204);
  assert.equal(propias(e.coleccion.filas).length, 0);
  assert.deepEqual(datosAjenos(e), ajenos);
  assert.equal(e.coleccion.filas.length, 2);
});

test("CA-08.3: juego sin metas conserva eliminación de partidas y respuesta 204", async (t) => {
  const e = escenario(t, []); const ajenos = datosAjenos(e); const borrar = await cliente(t);
  const r = await borrar(); assert.equal(r.status, 204); assert.equal(r.texto, "");
  assert.equal(propias(e.partidas.filas).length, 0);
  assert.equal(e.juegos.filas.some((j) => String(j._id) === JUEGO), false);
  assert.deepEqual(datosAjenos(e), ajenos);
});

test("CA-08.3: juego sin metas ni partidas también devuelve 204", async (t) => {
  const e = escenario(t, [], []); const ajenos = datosAjenos(e); const borrar = await cliente(t);
  assert.equal((await borrar()).status, 204); assert.deepEqual(datosAjenos(e), ajenos);
});

for (const id of ["invalido", "0".repeat(23), "z".repeat(24)]) {
  test(`CA-08.3: ID inválido ${id} devuelve 400 sin borrar datos`, async (t) => {
    const e = escenario(t); const antes = copiar([e.juegos.filas, e.partidas.filas, e.coleccion.filas]);
    const borrar = await cliente(t); const r = await borrar(`/api/videojuegos/${id}`);
    assert.equal(r.status, 400); const error = JSON.parse(r.texto);
    assert.equal(error.error, "ID mal formado"); assert.equal(error.requestId, r.requestId);
    assert.deepEqual(e.operaciones, []);
    assert.deepEqual([e.juegos.filas, e.partidas.filas, e.coleccion.filas], antes);
  });
}

test("CA-08.3: videojuego inexistente devuelve 404 sin borrar datos", async (t) => {
  const e = escenario(t); const antes = copiar([e.juegos.filas, e.partidas.filas, e.coleccion.filas]);
  const borrar = await cliente(t); const r = await borrar(`/api/videojuegos/${INEXISTENTE}`);
  assert.equal(r.status, 404); const error = JSON.parse(r.texto);
  assert.equal(error.error, "Videojuego no encontrado"); assert.equal(error.requestId, r.requestId);
  assert.deepEqual(e.operaciones, []);
  assert.deepEqual([e.juegos.filas, e.partidas.filas, e.coleccion.filas], antes);
});

test("CA-08.3: segunda eliminación devuelve 404 sin tocar datos ajenos", async (t) => {
  const e = escenario(t); const ajenos = datosAjenos(e); const borrar = await cliente(t);
  assert.equal((await borrar()).status, 204);
  const operaciones = [...e.operaciones];
  assert.equal((await borrar()).status, 404); assert.deepEqual(e.operaciones, operaciones);
  assert.deepEqual(datosAjenos(e), ajenos); assert.equal(propias(e.coleccion.filas).length, 0);
});

test("B-19/D9: fallo al borrar partidas responde 500 y no continúa", async (t) => {
  const e = escenario(t, [meta()], undefined, "partidas");
  const antes = copiar([e.juegos.filas, e.partidas.filas, e.coleccion.filas]);
  t.mock.method(console, "error", () => undefined);
  const borrar = await cliente(t); const r = await borrar();
  assert.equal(r.status, 500); assert.equal(JSON.parse(r.texto).error, "Error interno del servidor");
  assert.deepEqual(e.operaciones, ["partidas"]);
  assert.deepEqual([e.juegos.filas, e.partidas.filas, e.coleccion.filas], antes);
});

test("B-19/D9: fallo al borrar metas conserva el juego, pero no revierte partidas borradas", async (t) => {
  const e = escenario(t, [meta()], undefined, "metas"); const ajenos = datosAjenos(e);
  t.mock.method(console, "error", () => undefined);
  const borrar = await cliente(t); const r = await borrar();
  assert.equal(r.status, 500); assert.deepEqual(e.operaciones, ["partidas", "metas"]);
  assert.equal(e.juegos.filas.some((j) => String(j._id) === JUEGO), true);
  assert.equal(propias(e.partidas.filas).length, 0); assert.equal(propias(e.coleccion.filas).length, 1);
  assert.deepEqual(datosAjenos(e), ajenos);
});

test("B-19/D9: fallo al borrar videojuego responde 500 tras borrar sus partidas y metas", async (t) => {
  const e = escenario(t, [meta()], undefined, "videojuego"); const ajenos = datosAjenos(e);
  t.mock.method(console, "error", () => undefined);
  const borrar = await cliente(t); const r = await borrar();
  assert.equal(r.status, 500); assert.deepEqual(e.operaciones, ["partidas", "metas", "videojuego"]);
  assert.equal(e.juegos.filas.some((j) => String(j._id) === JUEGO), true);
  assert.equal(propias(e.partidas.filas).length, 0); assert.equal(propias(e.coleccion.filas).length, 0);
  assert.deepEqual(datosAjenos(e), ajenos);
});

test.todo("INTEGRACIÓN REAL CA-08.1/CA-08.2/CA-08.3: verificar cascada y conservación de datos ajenos contra una base de pruebas autorizada, sin afirmar atomicidad D9");
