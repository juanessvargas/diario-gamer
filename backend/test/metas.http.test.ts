import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import {
  clienteHttp, copiar, datosMeta, impedirConexion, INEXISTENTE,
  JUEGO, META, OTRA_META, OTRO_JUEGO, preparar, registroMeta,
} from "./soporte-metas";

// HTTP local contra app real; datos sustituidos por dobles de colección.
// No se carga index.ts ni se conecta a una base de datos.
test("Infraestructura HTTP: app existente responde sin conexión real", async (t) => {
  impedirConexion(t); const pedir = await clienteHttp(t); const r = await pedir("GET", "/");
  assert.equal(r.status, 200); assert.equal(typeof r.body.mensaje, "string"); assert.ok(r.requestId);
});
test("CA-01.1: POST devuelve 201 y envoltorio meta", async (t) => {
  preparar(t); const pedir = await clienteHttp(t); const r = await pedir("POST", "/api/metas", datosMeta());
  assert.equal(r.status, 201); assert.equal(r.body.meta.videojuego, JUEGO); assert.equal(r.body.meta.activa, true);
  assert.ok(r.body.meta._id); assert.ok(r.body.meta.createdAt); assert.ok(r.body.meta.updatedAt);
});

const invalidos: [string, unknown][] = [
  ["horas cero", datosMeta({ horasSemanales: 0 })], ["horas negativas", datosMeta({ horasSemanales: -1 })],
  ["horas >100", datosMeta({ horasSemanales: 100.01 })], ["horas string", datosMeta({ horasSemanales: "5" })],
  ["días fraccionarios", datosMeta({ diasPorSemana: 1.5 })], ["días cero", datosMeta({ diasPorSemana: 0 })],
  ["días >7", datosMeta({ diasPorSemana: 8 })], ["días string", datosMeta({ diasPorSemana: "4" })],
  ["seis hitos", datosMeta({ hitos: Array.from({ length: 6 }, () => ({ descripcion: "Hito", porcentajeObjetivo: 50 })) })],
  ["sin descripción", datosMeta({ hitos: [{ porcentajeObjetivo: 50 }] })],
  ["descripción vacía", datosMeta({ hitos: [{ descripcion: "", porcentajeObjetivo: 50 }] })],
  ["descripción no string", datosMeta({ hitos: [{ descripcion: 123, porcentajeObjetivo: 50 }] })],
  ["objetivo cero", datosMeta({ hitos: [{ descripcion: "Hito", porcentajeObjetivo: 0 }] })],
  ["objetivo >100", datosMeta({ hitos: [{ descripcion: "Hito", porcentajeObjetivo: 101 }] })],
  ["objetivo string", datosMeta({ hitos: [{ descripcion: "Hito", porcentajeObjetivo: "50" }] })],
  ["hitos no arreglo", datosMeta({ hitos: {} })], ["sin cuerpo", undefined], ["cuerpo null", null], ["cuerpo arreglo", []],
];
for (const [nombre, cuerpo] of invalidos) {
  test(`CA-01.2/CA-01.3/CA-01.4: POST inválido 400 (${nombre})`, async (t) => {
    const { coleccion } = preparar(t); const pedir = await clienteHttp(t);
    const r = await pedir("POST", "/api/metas", cuerpo);
    assert.equal(r.status, 400); assert.equal(typeof r.body.error, "string");
    assert.ok(r.requestId); assert.equal(r.body.requestId, r.requestId); assert.equal(coleccion.escrituras.length, 0);
  });
}
for (const [horas, dias, hitos] of [[0.01, 1, []], [100, 7, Array.from({ length: 5 }, (_, i) => ({ descripcion: `Hito ${i}`, porcentajeObjetivo: [1, 25, 50.5, 75, 100][i] }))]] as const) {
  test(`CA-01.2/CA-01.3/CA-01.4: POST acepta fronteras ${horas} horas, ${dias} días`, async (t) => {
    preparar(t); const pedir = await clienteHttp(t);
    assert.equal((await pedir("POST", "/api/metas", datosMeta({ horasSemanales: horas, diasPorSemana: dias, hitos }))).status, 201);
  });
}
test("CA-01.5: POST con meta activa devuelve 409 y conserva anterior", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const antes = copiar(coleccion.filas);
  const pedir = await clienteHttp(t); const r = await pedir("POST", "/api/metas", datosMeta());
  assert.equal(r.status, 409); assert.ok(r.body.error); assert.deepEqual(coleccion.filas, antes);
});
test("CA-02.1: GET devuelve meta existente", async (t) => {
  preparar(t, [registroMeta()]); const pedir = await clienteHttp(t); const r = await pedir("GET", `/api/metas/${META}`);
  assert.equal(r.status, 200); assert.equal(r.body.meta._id, META); assert.equal(r.body.meta.horasSemanales, 5);
});
test("CA-02.2: GET anidado devuelve total y solo metas del juego", async (t) => {
  preparar(t, [registroMeta(), registroMeta({ _id: new Types.ObjectId(OTRA_META), activa: false }),
    registroMeta({ _id: new Types.ObjectId(INEXISTENTE), videojuego: new Types.ObjectId(OTRO_JUEGO) })]);
  const pedir = await clienteHttp(t); const r = await pedir("GET", `/api/videojuegos/${JUEGO}/metas`);
  assert.equal(r.status, 200); assert.equal(r.body.total, 2);
  assert.deepEqual(r.body.metas.map((m: any) => m._id).sort(), [META, OTRA_META].sort());
});
test("CA-02.3: GET lista vacía es 200", async (t) => {
  preparar(t); const pedir = await clienteHttp(t); const r = await pedir("GET", `/api/videojuegos/${JUEGO}/metas`);
  assert.equal(r.status, 200); assert.deepEqual(r.body, { total: 0, metas: [] });
});
test("CA-03.1: PUT conserva ID y actualiza objetivos", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const pedir = await clienteHttp(t);
  const r = await pedir("PUT", `/api/metas/${META}`, { horasSemanales: 8, diasPorSemana: 2, hitos: [] });
  assert.equal(r.status, 200); assert.equal(r.body.meta._id, META); assert.equal(r.body.meta.horasSemanales, 8);
  assert.equal(coleccion.filas.length, 1);
});
for (const [nombre, datos] of [["horas", { horasSemanales: 0, diasPorSemana: 4, hitos: [] }],
  ["días", { horasSemanales: 5, diasPorSemana: 1.5, hitos: [] }],
  ["hitos", { horasSemanales: 5, diasPorSemana: 4, hitos: [{ descripcion: "Hito", porcentajeObjetivo: 101 }] }]] as const) {
  test(`CA-03.3: PUT inválido (${nombre}) devuelve 400 y conserva meta`, async (t) => {
    const { coleccion } = preparar(t, [registroMeta()]); const antes = copiar(coleccion.filas);
    const pedir = await clienteHttp(t); assert.equal((await pedir("PUT", `/api/metas/${META}`, datos)).status, 400);
    assert.deepEqual(coleccion.filas, antes); assert.equal(coleccion.escrituras.length, 0);
  });
}
test("CA-04.3/CA-04.4: PATCH desactiva y posterior POST conserva historial", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const pedir = await clienteHttp(t);
  const r = await pedir("PATCH", `/api/metas/${META}/desactivar`);
  assert.equal(r.status, 200); assert.equal(r.body.meta.activa, false); assert.equal(r.body.meta.hitos.length, 1);
  const nueva = await pedir("POST", "/api/metas", datosMeta({ horasSemanales: 8 }));
  assert.equal(nueva.status, 201); assert.notEqual(nueva.body.meta._id, META);
  assert.equal(coleccion.filas.length, 2); assert.equal(coleccion.filas.filter((m) => m.activa).length, 1);
});
for (const [metodo, ruta, cuerpo] of [
  ["POST", "/api/metas", datosMeta({ videojuego: "invalido" })],
  ["GET", "/api/metas/invalido", undefined],
  ["GET", "/api/videojuegos/invalido/metas", undefined],
  ["PUT", "/api/metas/invalido", { horasSemanales: 5, diasPorSemana: 4, hitos: [] }],
  ["PATCH", "/api/metas/invalido/desactivar", undefined],
] as const) {
  test(`400: ID inválido en ${metodo} ${ruta}`, async (t) => {
    const { coleccion } = preparar(t); const pedir = await clienteHttp(t);
    const r = await pedir(metodo, ruta, cuerpo); assert.equal(r.status, 400); assert.ok(r.body.error);
    assert.equal(coleccion.escrituras.length, 0);
  });
}
for (const [metodo, ruta, cuerpo] of [
  ["POST", "/api/metas", datosMeta({ videojuego: INEXISTENTE })],
  ["GET", `/api/metas/${INEXISTENTE}`, undefined],
  ["GET", `/api/videojuegos/${INEXISTENTE}/metas`, undefined],
  ["PUT", `/api/metas/${INEXISTENTE}`, { horasSemanales: 5, diasPorSemana: 4, hitos: [] }],
  ["PATCH", `/api/metas/${INEXISTENTE}/desactivar`, undefined],
] as const) {
  test(`404: recurso inexistente en ${metodo} ${ruta}`, async (t) => {
    const { coleccion } = preparar(t); const pedir = await clienteHttp(t); const r = await pedir(metodo, ruta, cuerpo);
    assert.equal(r.status, 404); assert.ok(r.body.error); assert.notEqual(r.body.error, "Ruta no encontrada");
    assert.equal(coleccion.escrituras.length, 0);
  });
}
