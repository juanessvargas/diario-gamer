import assert from "node:assert/strict";
import test from "node:test";
import * as api from "../src/api/metasApi";

const objetivos = { horasSemanales: 5, diasPorSemana: 3, hitos: [] };
const meta = { ...objetivos, _id: "meta", videojuego: "juego", activa: true };

for (const [nombre, ejecutar, ruta, method, respuesta, esperado, body] of [
  ["crear", () => api.crearMeta({ ...objetivos, videojuego: "juego" }), "/metas", "POST", { meta }, meta, { ...objetivos, videojuego: "juego" }],
  ["consultar", () => api.obtenerMeta("meta"), "/metas/meta", "GET", { meta }, meta, undefined],
  ["listar", () => api.listarMetasVideojuego("juego"), "/videojuegos/juego/metas", "GET", { total: 1, metas: [meta] }, [meta], undefined],
  ["editar", () => api.actualizarMeta("meta", objetivos), "/metas/meta", "PUT", { meta }, meta, objetivos],
  ["desactivar", () => api.desactivarMeta("meta"), "/metas/meta/desactivar", "PATCH", { meta }, meta, undefined],
  ["progreso", () => api.obtenerProgresoSemanal("juego"), "/videojuegos/juego/progreso-semanal", "GET", { progreso: { meta: null, porcentajeHoras: null, hitos: [] } }, { meta: null, porcentajeHoras: null, hitos: [] }, undefined],
] as const) {
  test(`T12 contrato ${nombre}: método, ruta y envoltorio`, async (t) => {
    t.mock.method(globalThis, "fetch", async (url: string, opciones?: RequestInit) => {
      assert.equal(url, `/api${ruta}`);
      assert.equal(opciones?.method ?? "GET", method);
      assert.deepEqual(opciones?.body ? JSON.parse(String(opciones.body)) : undefined, body);
      if (body) assert.deepEqual(opciones?.headers, { "Content-Type": "application/json" });
      return Response.json(respuesta);
    });
    assert.deepEqual(await ejecutar(), esperado);
  });
}

for (const status of [400, 404, 409, 500]) {
  test(`T12 conserva HTTP ${status} y oculta detalles internos de 500`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Mensaje del servidor" }, { status }));
    await assert.rejects(api.obtenerMeta("meta"), (e: unknown) => {
      assert.ok(e instanceof api.ErrorMetasApi);
      assert.equal(e.status, status);
      assert.equal(e.message.includes("Mensaje del servidor"), status < 500);
      return true;
    });
  });
}

test("T12 conexión fallida diferenciada de HTTP", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(api.obtenerMeta("meta"), (e: unknown) => e instanceof api.ErrorMetasApi && e.status === null && /conexión/.test(e.message));
});

test("T12 listado vacío es éxito", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ total: 0, metas: [] }));
  assert.deepEqual(await api.listarMetasVideojuego("juego"), []);
});

test("T12 respuesta no JSON de error conserva status", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("No disponible", { status: 503 }));
  await assert.rejects(api.obtenerMeta("meta"), (e: unknown) => e instanceof api.ErrorMetasApi && e.status === 503);
});

test("T12 respuesta JSON ilegible no anuncia éxito", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("{"));
  await assert.rejects(api.obtenerMeta("meta"), /interpretar/);
});
