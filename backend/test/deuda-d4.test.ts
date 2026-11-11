import assert from "node:assert/strict";
import test from "node:test";
import { Videojuego } from "../src/modelos/Videojuego.model";
import { actualizarVideojuego } from "../src/services/videojuegos.service";
import { copiar, JUEGO, INEXISTENTE, type Registro } from "./soporte-metas";
import { servidorIntegrado } from "./soporte-integracion";

const RUTA = `/videojuegos/${JUEGO}`;

test("DT-CA-04: null elimina el campo con $unset y GET ya no devuelve calificación", async (t) => {
  const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8; e.juegos.filas[1].calificacion = 9;
  const ajeno = copiar(e.juegos.filas[1]);
  const original = Videojuego.collection.findOneAndUpdate.bind(Videojuego.collection);
  let instruccion: Registro = {};
  t.mock.method(Videojuego.collection, "findOneAndUpdate", async (...args: Parameters<typeof original>) => {
    instruccion = copiar(args[1]); return original(...args);
  });
  const r = await e.solicitar("PUT", RUTA, { titulo: "Juego actualizado", calificacion: null });
  assert.equal(r.status, 200);
  const consultado = (await e.solicitar("GET", RUTA)).body!.videojuego;
  assert.equal(Object.hasOwn(consultado, "calificacion"), false);
  assert.equal(Object.hasOwn(e.juegos.filas[0], "calificacion"), false);
  assert.deepEqual(instruccion.$unset, { calificacion: 1 });
  assert.equal(consultado.titulo, "Juego actualizado"); assert.deepEqual(e.juegos.filas[1], ajeno);
});

for (const cuerpo of [{ titulo: "Otro título" }, { titulo: "Otro título", calificacion: undefined }]) {
  test(`DT-CA-05: omisión${"calificacion" in cuerpo ? " por undefined serializado" : " explícita"} conserva el valor`, async (t) => {
    const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
    assert.equal((await e.solicitar("PUT", RUTA, cuerpo)).status, 200);
    const juego = (await e.solicitar("GET", RUTA)).body!.videojuego;
    assert.equal(juego.calificacion, 8); assert.equal(juego.titulo, "Otro título");
  });
}

for (const calificacion of [0, 10]) {
  test(`DT-CA-05: valor ${calificacion} es calificación, no borrado`, async (t) => {
    const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
    assert.equal((await e.solicitar("PUT", RUTA, { calificacion })).status, 200);
    assert.equal((await e.solicitar("GET", RUTA)).body!.videojuego.calificacion, calificacion);
  });
}

for (const calificacion of [-1, 11]) {
  test(`DT-CA-05: calificación inválida ${calificacion} no altera el valor previo`, async (t) => {
    const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
    assert.equal((await e.solicitar("PUT", RUTA, { calificacion })).status, 400);
    assert.equal((await e.solicitar("GET", RUTA)).body!.videojuego.calificacion, 8);
  });
}

test("DT-CA-04: quitar dos veces es idempotente y no convierte ausencia en null", async (t) => {
  const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
  for (let i = 0; i < 2; i++) {
    assert.equal((await e.solicitar("PUT", RUTA, { calificacion: null })).status, 200);
    assert.equal(Object.hasOwn((await e.solicitar("GET", RUTA)).body!.videojuego, "calificacion"), false);
  }
});

for (const [id, status] of [["invalido", 400], [INEXISTENTE, 404]] as const) {
  test(`DT-CA-04 regresión: ID ${id} mantiene HTTP ${status} y datos ajenos`, async (t) => {
    const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
    const antes = copiar(e.juegos.filas);
    assert.equal((await e.solicitar("PUT", `/videojuegos/${id}`, { calificacion: null })).status, status);
    assert.deepEqual(e.juegos.filas, antes);
  });
}

test("DT-CA-04: la limpieza no muta el objeto de entrada del servicio", async (t) => {
  const e = await servidorIntegrado(t); e.juegos.filas[0].calificacion = 8;
  const entrada = { titulo: "Juego actualizado", calificacion: null };
  const antes = copiar(entrada); await actualizarVideojuego(JUEGO, entrada);
  assert.deepEqual(entrada, antes);
});
