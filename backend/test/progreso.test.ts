import assert from "node:assert/strict";
import test from "node:test";

// E2-T06: contrato del dominio futuro. Solo datos en memoria y relojes fijos.
// No importa modelos, servicios, servidor, MongoDB ni el cálculo de hitos.
// Las cargas son por caso: un módulo ausente debe dejar cada escenario rojo,
// no ocultarse con skip/todo ni sustituirse por una implementación en el test.
interface PartidaDominio {
  readonly videojuego: string;
  readonly fecha: Date;
  readonly duracionMinutos: number;
}

interface ObjetivosMeta {
  readonly horasSemanales: number;
  readonly diasPorSemana: number;
}

interface ActividadSemanal {
  horasSemana: number;
  diasJugadosSemana: number;
  porcentajeHoras: number | null;
}

interface Rachas {
  rachaActual: number;
  mejorRacha: number;
}

interface DominioProgreso {
  calcularSemana(ahora: Date): { inicio: string; fin: string };
  calcularActividadSemanal(
    partidas: readonly PartidaDominio[], videojuegoId: string,
    ahora: Date, meta: ObjetivosMeta | null,
  ): ActividadSemanal;
  calcularRachas(partidas: readonly PartidaDominio[], videojuegoId: string, ahora: Date): Rachas;
  // Función interna: no agrega un campo al contrato HTTP de progreso.
  cumpleMetaSemanal(actividad: ActividadSemanal, meta: ObjetivosMeta): boolean;
}

function cargarDominio(): DominioProgreso {
  return require("../src/dominio/progreso");
}

const JUEGO = "000000000000000000000001";
const OTRO_JUEGO = "000000000000000000000002";
const META: ObjetivosMeta = Object.freeze({ horasSemanales: 5, diasPorSemana: 4 });
const FECHA_CONSULTA = "2026-11-04T12:00:00-05:00";

function partida(fecha: string, minutos = 60, videojuego = JUEGO): PartidaDominio {
  return { videojuego, fecha: new Date(fecha), duracionMinutos: minutos };
}

function actividad(
  partidas: readonly PartidaDominio[],
  ahora = FECHA_CONSULTA,
  meta: ObjetivosMeta | null = META,
) {
  return cargarDominio().calcularActividadSemanal(partidas, JUEGO, new Date(ahora), meta);
}

function rachas(partidas: readonly PartidaDominio[], ahora = FECHA_CONSULTA) {
  return cargarDominio().calcularRachas(partidas, JUEGO, new Date(ahora));
}

const semanas = [
  ["lunes a medianoche", "2026-11-02T05:00:00.000Z", "2026-11-02", "2026-11-08"],
  ["último milisegundo del domingo", "2026-11-09T04:59:59.999Z", "2026-11-02", "2026-11-08"],
  ["lunes siguiente", "2026-11-09T05:00:00.000Z", "2026-11-09", "2026-11-15"],
  ["lunes UTC que aún es domingo en Ecuador", "2026-11-02T02:00:00Z", "2026-10-26", "2026-11-01"],
  ["semana que cruza de mes", "2026-12-01T00:00:00Z", "2026-11-30", "2026-12-06"],
  ["semana que cruza de año", "2027-01-01T12:00:00Z", "2026-12-28", "2027-01-03"],
  ["primera semana completa del nuevo año", "2027-01-04T05:00:00Z", "2027-01-04", "2027-01-10"],
  ["febrero bisiesto", "2024-03-01T12:00:00Z", "2024-02-26", "2024-03-03"],
] as const;

for (const [nombre, consulta, inicio, fin] of semanas) {
  test(`CA-05.1: ${nombre}`, () => {
    const semana = cargarDominio().calcularSemana(new Date(consulta));
    assert.equal(semana.inicio, inicio);
    assert.equal(semana.fin, fin);
  });
}

test("CA-05.2: suma minutos de diferentes sesiones antes de convertir a horas", () => {
  const resultado = actividad([
    partida("2026-11-02T10:00:00-05:00", 48),
    partida("2026-11-03T10:00:00-05:00", 78),
  ]);
  assert.equal(resultado.horasSemana, 2.1);
});

for (const [minutos, horas] of [[1, 0], [4, 0.1], [62, 1], [64, 1.1], [67.5, 1.1]] as const) {
  test(`CA-05.2: ${minutos} minutos se muestran como ${horas} horas`, () => {
    const resultado = actividad([partida("2026-11-03T10:00:00-05:00", minutos)]);
    assert.equal(resultado.horasSemana, horas);
    assert.equal(resultado.diasJugadosSemana, 1);
  });
}

test("CA-05.3: varias partidas en una fecha suman tiempo y cuentan una vez", () => {
  const resultado = actividad([
    partida("2026-11-02T10:00:00-05:00", 20),
    partida("2026-11-02T20:00:00-05:00", 40),
    partida("2026-11-03T10:00:00-05:00", 30),
  ]);
  assert.equal(resultado.horasSemana, 1.5);
  assert.equal(resultado.diasJugadosSemana, 2);
});

test("CA-05.3: dos fechas UTC pueden ser el mismo día en Ecuador", () => {
  const resultado = actividad([
    partida("2026-11-03T23:30:00Z", 30),
    partida("2026-11-04T02:30:00Z", 30),
  ]);
  assert.equal(resultado.horasSemana, 1);
  assert.equal(resultado.diasJugadosSemana, 1);
});

test("CA-05.4: sesión que cruza medianoche pertenece íntegra al inicio", () => {
  const partidas = [partida("2026-11-02T23:30:00-05:00", 120)];
  const resultado = actividad(partidas, "2026-11-03T03:00:00-05:00");
  assert.equal(resultado.horasSemana, 2);
  assert.equal(resultado.diasJugadosSemana, 1);
  // Hoy martes no hubo inicio de sesión: la racha viva termina el lunes.
  assert.equal(rachas(partidas, "2026-11-03T03:00:00-05:00").rachaActual, 1);
});

test("CA-05.4: cruce domingo/lunes no reparte duración entre semanas", () => {
  const partidas = [partida("2026-11-08T23:30:00-05:00", 120)];
  const domingo = actividad(partidas, "2026-11-08T23:59:59-05:00");
  const lunes = actividad(partidas, "2026-11-09T02:00:00-05:00");
  assert.equal(domingo.horasSemana, 2);
  assert.equal(domingo.diasJugadosSemana, 1);
  assert.equal(lunes.horasSemana, 0);
  assert.equal(lunes.diasJugadosSemana, 0);
});

test("CA-05.1/CA-05.10: lunes 00:00 entra; domingo anterior no entra", () => {
  const resultado = actividad([
    partida("2026-11-02T04:59:59.999Z", 180),
    partida("2026-11-02T05:00:00.000Z", 60),
  ]);
  assert.equal(resultado.horasSemana, 1);
  assert.equal(resultado.diasJugadosSemana, 1);
});

test("CA-05.1/CA-05.10: domingo final entra y lunes siguiente queda fuera", () => {
  const partidas = [
    partida("2026-11-09T04:59:59.999Z", 60),
    partida("2026-11-09T05:00:00.000Z", 120),
  ];
  const domingo = actividad(partidas, "2026-11-09T04:59:59.999Z");
  assert.equal(domingo.horasSemana, 1);
  assert.equal(domingo.diasJugadosSemana, 1);
  const lunes = actividad(partidas, "2026-11-09T05:00:00.000Z");
  assert.equal(lunes.horasSemana, 2);
  assert.equal(lunes.diasJugadosSemana, 1);
});

test("CA-05.5: una partida futura de hoy tampoco cuenta todavía", () => {
  const resultado = actividad([
    partida("2026-11-03T10:00:00-05:00", 30),
    partida("2026-11-04T20:00:00-05:00", 180),
    partida("2026-11-05T10:00:00-05:00", 300),
  ]);
  assert.equal(resultado.horasSemana, 0.5);
  assert.equal(resultado.diasJugadosSemana, 1);
});

test("CA-05.5: instante anterior, igual y posterior al inicio registrado", () => {
  const partidas = [partida("2026-11-04T12:00:00.000-05:00", 60)];
  assert.equal(actividad(partidas, "2026-11-04T11:59:59.999-05:00").horasSemana, 0);
  assert.equal(actividad(partidas, "2026-11-04T12:00:00.000-05:00").horasSemana, 1);
  assert.equal(actividad(partidas, "2026-11-04T12:00:00.001-05:00").horasSemana, 1);
});

test("CA-05.6: 7 horas frente a 5 producen 140 %, sin tope", () => {
  assert.equal(actividad([partida("2026-11-03T10:00:00-05:00", 420)]).porcentajeHoras, 140);
});

test("CA-05.6: calcula el porcentaje después de redondear las horas", () => {
  const resultado = actividad([partida("2026-11-03T10:00:00-05:00", 64)], FECHA_CONSULTA,
    { horasSemanales: 3, diasPorSemana: 1 });
  assert.equal(resultado.horasSemana, 1.1);
  assert.equal(resultado.porcentajeHoras, 37); // 1.1 / 3; no 36 usando minutos sin redondear.
  assert.ok(Number.isInteger(resultado.porcentajeHoras));
});

test("CA-05.6: redondea el porcentaje a entero también hacia abajo", () => {
  const resultado = actividad([partida("2026-11-03T10:00:00-05:00", 64)], FECHA_CONSULTA,
    { horasSemanales: 6, diasPorSemana: 1 });
  assert.equal(resultado.porcentajeHoras, 18);
});

const cumplimiento = [
  ["ambos objetivos exactos", 3, 2, true],
  ["solo horas", 3, 3, false],
  ["solo días", 4, 2, false],
  ["ningún objetivo", 4, 3, false],
  ["ambos superados", 2, 1, true],
] as const;

for (const [nombre, horasSemanales, diasPorSemana, esperado] of cumplimiento) {
  test(`CA-05.7: cumplir semana requiere horas y días (${nombre})`, () => {
    const dominio = cargarDominio();
    const meta = { horasSemanales, diasPorSemana };
    const resultado = dominio.calcularActividadSemanal([
      partida("2026-11-02T10:00:00-05:00", 90),
      partida("2026-11-03T10:00:00-05:00", 90),
    ], JUEGO, new Date(FECHA_CONSULTA), meta);
    assert.equal(resultado.horasSemana, 3);
    assert.equal(resultado.diasJugadosSemana, 2);
    assert.equal(dominio.cumpleMetaSemanal(resultado, meta), esperado);
  });
}

test("CA-05.8: sin meta hay actividad y rachas, pero porcentaje null", () => {
  const partidas = [
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
  ];
  assert.deepEqual(actividad(partidas, FECHA_CONSULTA, null), {
    horasSemana: 2, diasJugadosSemana: 2, porcentajeHoras: null,
  });
  assert.deepEqual(rachas(partidas), { rachaActual: 2, mejorRacha: 2 });
});

test("CA-05.9: sin partidas, horas, días y rachas son cero", () => {
  assert.deepEqual(actividad([]), { horasSemana: 0, diasJugadosSemana: 0, porcentajeHoras: 0 });
  assert.deepEqual(rachas([]), { rachaActual: 0, mejorRacha: 0 });
});

test("CA-05.8/CA-05.9: sin partidas ni meta conserva porcentaje null", () => {
  assert.deepEqual(actividad([], FECHA_CONSULTA, null), {
    horasSemana: 0, diasJugadosSemana: 0, porcentajeHoras: null,
  });
  assert.deepEqual(rachas([]), { rachaActual: 0, mejorRacha: 0 });
});

test("CA-05.10: partidas ajenas no aportan horas, días ni continuidad", () => {
  const partidas = [
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00", 600, OTRO_JUEGO),
    partida("2026-11-04T10:00:00-05:00"),
  ];
  assert.deepEqual(actividad(partidas), { horasSemana: 2, diasJugadosSemana: 2, porcentajeHoras: 40 });
  assert.deepEqual(rachas(partidas), { rachaActual: 1, mejorRacha: 1 });
});

test("CA-06.1: racha de ayer sigue viva hasta terminar hoy", () => {
  const partidas = [
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
  ];
  assert.deepEqual(rachas(partidas, "2026-11-04T00:00:00-05:00"), { rachaActual: 2, mejorRacha: 2 });
  assert.deepEqual(rachas(partidas, "2026-11-04T23:59:59.999-05:00"), { rachaActual: 2, mejorRacha: 2 });
});

test("CA-06.2: jugar hoy aumenta una vez aunque registre varias partidas", () => {
  const partidas = [
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
    partida("2026-11-04T09:00:00-05:00"),
    partida("2026-11-04T10:00:00-05:00"),
  ];
  assert.deepEqual(rachas(partidas), { rachaActual: 3, mejorRacha: 3 });
});

test("CA-06.2: primer día jugado hoy inicia una racha de uno", () => {
  assert.deepEqual(rachas([partida("2026-11-04T10:00:00-05:00")]), { rachaActual: 1, mejorRacha: 1 });
});

test("CA-06.3: al empezar mañana sin haber jugado hoy la racha se rompe", () => {
  const partidas = [
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
  ];
  assert.deepEqual(rachas(partidas, "2026-11-05T00:00:00-05:00"), { rachaActual: 0, mejorRacha: 2 });
});

test("CA-06.3: un hueco intermedio separa secuencias", () => {
  assert.deepEqual(rachas([
    partida("2026-11-01T10:00:00-05:00"),
    partida("2026-11-02T10:00:00-05:00"),
    partida("2026-11-04T10:00:00-05:00"),
  ]), { rachaActual: 1, mejorRacha: 2 });
});

test("CA-06.4: mejor racha histórica puede superar la actual y esta semana", () => {
  const partidas = [
    partida("2026-10-20T10:00:00-05:00"),
    partida("2026-10-21T10:00:00-05:00"),
    partida("2026-10-22T10:00:00-05:00"),
    partida("2026-10-23T10:00:00-05:00"),
    partida("2026-10-24T10:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
    partida("2026-11-04T10:00:00-05:00"),
  ];
  assert.deepEqual(rachas(partidas), { rachaActual: 2, mejorRacha: 5 });
  assert.equal(actividad(partidas).horasSemana, 2);
});

test("CA-06.4: orden y duplicados no alteran la secuencia histórica", () => {
  assert.deepEqual(rachas([
    partida("2026-11-04T10:00:00-05:00"),
    partida("2026-11-02T20:00:00-05:00"),
    partida("2026-11-03T10:00:00-05:00"),
    partida("2026-11-02T10:00:00-05:00"),
  ]), { rachaActual: 3, mejorRacha: 3 });
});

test("CA-06.4/CA-05.10: racha cruza semanas sin arrastrar horas antiguas", () => {
  const partidas = [5, 6, 7, 8, 9].map((dia) => partida(`2026-11-${String(dia).padStart(2, "0")}T10:00:00-05:00`));
  const ahora = "2026-11-09T12:00:00-05:00";
  assert.deepEqual(rachas(partidas, ahora), { rachaActual: 5, mejorRacha: 5 });
  assert.equal(actividad(partidas, ahora).horasSemana, 1);
  assert.equal(actividad(partidas, ahora).diasJugadosSemana, 1);
});

test("CA-06.4: racha consecutiva cruza diciembre/enero", () => {
  assert.deepEqual(rachas([
    partida("2026-12-30T10:00:00-05:00"),
    partida("2026-12-31T10:00:00-05:00"),
    partida("2027-01-01T10:00:00-05:00"),
  ], "2027-01-01T12:00:00-05:00"), { rachaActual: 3, mejorRacha: 3 });
});

test("CA-06.5: fechas futuras no amplían ni la racha actual ni la mejor", () => {
  assert.deepEqual(rachas([
    partida("2026-11-03T10:00:00-05:00"),
    partida("2026-11-04T20:00:00-05:00"),
    partida("2026-11-05T10:00:00-05:00"),
    partida("2026-11-06T10:00:00-05:00"),
  ]), { rachaActual: 1, mejorRacha: 1 });
});

test("CA-06.5: una sesión futura puede contar al llegar exactamente su fecha", () => {
  const partidas = [partida("2026-11-04T12:00:00-05:00")];
  assert.deepEqual(rachas(partidas, "2026-11-04T11:59:59.999-05:00"), { rachaActual: 0, mejorRacha: 0 });
  assert.deepEqual(rachas(partidas, FECHA_CONSULTA), { rachaActual: 1, mejorRacha: 1 });
});

test("CA-05.5/CA-06.5: solo partidas futuras dan cero actividad y rachas", () => {
  const partidas = [partida("2026-11-05T10:00:00-05:00", 300)];
  assert.deepEqual(actividad(partidas), { horasSemana: 0, diasJugadosSemana: 0, porcentajeHoras: 0 });
  assert.deepEqual(rachas(partidas), { rachaActual: 0, mejorRacha: 0 });
});

test("B-08/CA-05.2/CA-06.4: funciones reproducibles, sin mutar entradas ni reloj", () => {
  const dominio = cargarDominio();
  const partidas = Object.freeze([
    Object.freeze(partida("2026-11-03T10:00:00-05:00", 60)),
    Object.freeze(partida("2026-11-02T10:00:00-05:00", 30)),
  ]);
  const fechas = partidas.map((p) => p.fecha.getTime());
  const reloj = new Date(FECHA_CONSULTA); const instante = reloj.getTime();
  const primera = dominio.calcularActividadSemanal(partidas, JUEGO, reloj, META);
  const primeraRacha = dominio.calcularRachas(partidas, JUEGO, reloj);
  const semana = dominio.calcularSemana(reloj);
  assert.deepEqual(dominio.calcularActividadSemanal(partidas, JUEGO, reloj, META), primera);
  assert.deepEqual(dominio.calcularRachas(partidas, JUEGO, reloj), primeraRacha);
  assert.deepEqual(dominio.calcularSemana(reloj), semana);
  assert.equal(reloj.getTime(), instante);
  assert.deepEqual(partidas.map((p) => p.fecha.getTime()), fechas);
  assert.equal(partidas[0].duracionMinutos, 60);
  assert.equal(partidas[1].duracionMinutos, 30);
});
