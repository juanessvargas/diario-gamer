import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Videojuego } from "../src/modelos/Videojuego.model";
import { servidorIntegrado } from "./soporte-integracion";
import { copiar, JUEGO } from "./soporte-metas";

const LOGRO = "000000000000000000000033";
const RUTA = `/videojuegos/${JUEGO}/logros/${LOGRO}`;

for (const ruta of ["/videojuegos", "/metas"]) {
  test(`DT-CA-01: JSON mal formado en ${ruta} responde 400 sin escribir`, async (t) => {
    const e = await servidorIntegrado(t); t.mock.method(console, "error", () => undefined);
    const antes = copiar(e.juegos.filas);
    const r = await fetch(`${e.url}/api${ruta}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"titulo":' });
    assert.equal(r.status, 400);
    assert.equal(typeof (await r.json()).error, "string");
    assert.deepEqual(e.juegos.filas, antes); assert.equal(e.coleccion.filas.length, 0);
  });
}

test("DT-CA-01: error de parseo conserva X-Request-Id en encabezado y JSON", async (t) => {
  const e = await servidorIntegrado(t); t.mock.method(console, "error", () => undefined);
  const r = await fetch(`${e.url}/api/videojuegos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  const id = r.headers.get("X-Request-Id");
  assert.ok(id); assert.equal((await r.json()).requestId, id);
});

for (const [nombre, cuerpo] of [
  ["ausente", undefined], ["null", null], ["vacío", {}], ["arreglo", []], ["obtenido no booleano", { obtenido: "true" }],
] as const) {
  test(`DT-CA-02: cuerpo ${nombre} al actualizar logro responde 400 y conserva datos`, async (t) => {
    const e = await servidorIntegrado(t); t.mock.method(console, "error", () => undefined);
    e.juegos.filas[0].logros = [{ _id: new Types.ObjectId(LOGRO), nombre: "Primer paso", obtenido: false }];
    const antes = copiar(e.juegos.filas);
    const r = await e.solicitar("PATCH", RUTA, cuerpo);
    assert.equal(r.status, 400); assert.ok(r.body!.requestId);
    assert.deepEqual(e.juegos.filas, antes);
    assert.equal(e.juegos.escrituras.length, 0);
  });
}

test("DT-CA-02 regresión: cuerpo válido conserva respuesta 200 del logro", async (t) => {
  const e = await servidorIntegrado(t);
  e.juegos.filas[0].logros = [{ _id: new Types.ObjectId(LOGRO), nombre: "Primer paso", obtenido: false }];
  const r = await e.solicitar("PATCH", RUTA, { obtenido: false });
  assert.equal(r.status, 200); assert.equal(r.body!.videojuego.logros[0].obtenido, false);
});

for (const error of [new Error("Fallo inesperado simulado"), new SyntaxError("Fallo de sintaxis interno simulado")]) {
  test(`DT-CA-03: ${error.name} interno sigue siendo 500, sin filtrar detalle`, async (t) => {
    const e = await servidorIntegrado(t); t.mock.method(console, "error", () => undefined);
    t.mock.method(Videojuego.collection, "findOne", async () => { throw error; });
    const r = await e.solicitar("GET", `/videojuegos/${JUEGO}`);
    assert.equal(r.status, 500); assert.equal(r.body!.error, "Error interno del servidor");
    assert.ok(r.body!.requestId); assert.equal(JSON.stringify(r.body).includes(error.message), false);
  });
}
