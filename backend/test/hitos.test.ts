import assert from "node:assert/strict";
import test from "node:test";

// E2-T08: tests puros. No importa modelos, servicios ni servidor.
// El servicio futuro debe pasar los hitos de la meta activa (o null) y el
// avance del resumen original de P3, sin volver a calcularlo desde partidas.
interface Hito {
  readonly descripcion: string;
  readonly porcentajeObjetivo: number;
}

interface HitoCalculado {
  descripcion: string;
  porcentajeObjetivo: number;
  alcanzado: boolean;
}

type CalcularHitos = (
  hitosDeMetaActiva: readonly Hito[] | null,
  porcentajeAvanceActual: number,
) => HitoCalculado[];

function cargarCalculo(): CalcularHitos {
  const dominio = require("../src/dominio/progreso") as { calcularHitos?: CalcularHitos };
  assert.equal(typeof dominio.calcularHitos, "function", "Falta exportar calcularHitos en el dominio (E2-T09)");
  return dominio.calcularHitos!;
}

const HITOS: readonly Hito[] = Object.freeze([
  Object.freeze({ descripcion: "Comenzar", porcentajeObjetivo: 1 }),
  Object.freeze({ descripcion: "Llegar a la mitad", porcentajeObjetivo: 50 }),
  Object.freeze({ descripcion: "Terminar", porcentajeObjetivo: 100 }),
]);

for (const [objetivo, avance, esperado] of [
  [50, 40, false], [50, 50, true], [50, 60, true],
  [1, 0, false], [1, 1, true], [1, 2, true],
  [100, 99.9, false], [100, 100, true],
  [50.5, 50.49, false], [50.5, 50.5, true],
] as const) {
  test(`CA-07.1: avance ${avance} frente a objetivo ${objetivo} da alcanzado=${esperado}`, () => {
    const calcularHitos = cargarCalculo();
    assert.deepEqual(calcularHitos([{ descripcion: "Objetivo ficticio", porcentajeObjetivo: objetivo }], avance), [
      { descripcion: "Objetivo ficticio", porcentajeObjetivo: objetivo, alcanzado: esperado },
    ]);
  });
}

test("CA-07.1: objetivos inferiores, iguales y superiores al avance", () => {
  const calcularHitos = cargarCalculo();
  assert.deepEqual(calcularHitos([
    { descripcion: "Primero", porcentajeObjetivo: 25 },
    { descripcion: "Segundo", porcentajeObjetivo: 50 },
    { descripcion: "Tercero", porcentajeObjetivo: 75 },
  ], 50), [
    { descripcion: "Primero", porcentajeObjetivo: 25, alcanzado: true },
    { descripcion: "Segundo", porcentajeObjetivo: 50, alcanzado: true },
    { descripcion: "Tercero", porcentajeObjetivo: 75, alcanzado: false },
  ]);
});

test("CA-07.1: avance cero no alcanza ni el objetivo mínimo del 1 %", () => {
  const calcularHitos = cargarCalculo();
  const resultado = calcularHitos(HITOS, 0);
  assert.equal(resultado.length, 3);
  assert.ok(resultado.every((hito) => hito.alcanzado === false));
});

test("CA-07.1: avance 100 alcanza todos los objetivos válidos", () => {
  const calcularHitos = cargarCalculo();
  const resultado = calcularHitos(HITOS, 100);
  assert.equal(resultado.length, 3);
  assert.ok(resultado.every((hito) => hito.alcanzado === true));
});

test("CA-07.2: bajar de 60 a 40 revierte el hito del 50 %", () => {
  const calcularHitos = cargarCalculo();
  const antes = calcularHitos(HITOS, 60);
  const despues = calcularHitos(HITOS, 40);
  assert.equal(antes[1].alcanzado, true);
  assert.equal(despues[1].alcanzado, false);
  assert.equal(antes[1].alcanzado, true); // La segunda llamada tampoco muta el resultado anterior.
  assert.ok(HITOS.every((hito) => !Object.hasOwn(hito, "alcanzado")));
});

test("CA-07.2: un resultado previo no fija un estado histórico permanente", () => {
  const calcularHitos = cargarCalculo();
  const antes = calcularHitos(HITOS, 60);
  const despues = calcularHitos(antes, 40);
  assert.equal(despues[1].alcanzado, false);
  assert.equal(antes[1].alcanzado, true);
});

test("CA-05.9/CA-07.1: sin partidas, el resumen P3 entrega avance 0 y ningún hito se alcanza", () => {
  const calcularHitos = cargarCalculo();
  // Entrada ficticia del contrato; no ejecuta obtenerResumenVideojuego.
  const resumenSinPartidas = {
    totalPartidas: 0, horasTotales: 0, ultimaSesion: null, porcentajeAvance: 0,
  };
  const resultado = calcularHitos(HITOS, resumenSinPartidas.porcentajeAvance);
  assert.equal(resultado.length, 3);
  assert.ok(resultado.every((hito) => hito.alcanzado === false));
});

test("CA-05.8: sin meta activa, null devuelve lista vacía aunque haya avance", () => {
  const calcularHitos = cargarCalculo();
  assert.deepEqual(calcularHitos(null, 100), []);
  assert.deepEqual(calcularHitos(null, 0), []);
  // Elegir null en lugar de hitos de metas anteriores corresponde al servicio.
});

test("CA-07.1: meta activa sin hitos devuelve lista vacía", () => {
  const calcularHitos = cargarCalculo();
  assert.deepEqual(calcularHitos([], 0), []);
  assert.deepEqual(calcularHitos([], 100), []);
});

test("CA-07.3: utiliza el avance recibido del resumen, no un máximo histórico", () => {
  const calcularHitos = cargarCalculo();
  // Representa una sesión actual con menor avance que otra anterior.
  // No se implementa aquí la selección de sesiones del resumen original.
  const resumenP3 = { totalPartidas: 2, horasTotales: 2, ultimaSesion: "2026-11-04T15:00:00Z", porcentajeAvance: 40 };
  const resultado = calcularHitos(HITOS, resumenP3.porcentajeAvance);
  assert.equal(resultado[1].alcanzado, false);
});

test("CA-07.3/RA-02: avance 80 de una partida futura también alcanza el hito 50", () => {
  const calcularHitos = cargarCalculo();
  // Resumen ficticio: no prueba la integración con el servicio ni sus consultas.
  const consultaFija = new Date("2026-11-04T12:00:00-05:00");
  const resumenP3 = {
    totalPartidas: 2, horasTotales: 2,
    ultimaSesion: "2026-11-05T10:00:00-05:00", porcentajeAvance: 80,
  };
  assert.ok(new Date(resumenP3.ultimaSesion).getTime() > consultaFija.getTime());
  const resultado = calcularHitos(HITOS, resumenP3.porcentajeAvance);
  assert.equal(resultado[0].alcanzado, true);
  assert.equal(resultado[1].alcanzado, true);
  assert.equal(resultado[2].alcanzado, false);
});

test("B-08/CA-07.1: no modifica hitos originales, descripciones ni su orden", () => {
  const calcularHitos = cargarCalculo();
  const originales = Object.freeze([
    Object.freeze({ descripcion: "Objetivo mayor", porcentajeObjetivo: 100 }),
    Object.freeze({ descripcion: "Objetivo menor", porcentajeObjetivo: 1 }),
  ]);
  assert.deepEqual(calcularHitos(originales, 50), [
    { descripcion: "Objetivo mayor", porcentajeObjetivo: 100, alcanzado: false },
    { descripcion: "Objetivo menor", porcentajeObjetivo: 1, alcanzado: true },
  ]);
  assert.deepEqual(originales, [
    { descripcion: "Objetivo mayor", porcentajeObjetivo: 100 },
    { descripcion: "Objetivo menor", porcentajeObjetivo: 1 },
  ]);
  assert.ok(originales.every((hito) => !Object.hasOwn(hito, "alcanzado")));
});

test("B-08/CA-07.2: cálculo determinista y sin estado compartido entre resultados", () => {
  const calcularHitos = cargarCalculo();
  const primero = calcularHitos(HITOS, 60);
  const esperado = [
    { descripcion: "Comenzar", porcentajeObjetivo: 1, alcanzado: true },
    { descripcion: "Llegar a la mitad", porcentajeObjetivo: 50, alcanzado: true },
    { descripcion: "Terminar", porcentajeObjetivo: 100, alcanzado: false },
  ];
  assert.deepEqual(primero, esperado);
  calcularHitos(HITOS, 40);
  assert.deepEqual(calcularHitos(HITOS, 60), esperado);
  primero[0].alcanzado = false;
  assert.deepEqual(calcularHitos(HITOS, 60), esperado);
});

// Integración simulada cubierta en progreso.http.test.ts (E2-T10):
// CA-07.3: resumen P3 real con colecciones sustituidas, desempates y partida futura.
// CA-05.8/CA-05.9: selección de meta activa, exclusión de anteriores y sin partidas.
// Son pruebas HTTP ejecutables, no evidencia de persistencia real en MongoDB.
