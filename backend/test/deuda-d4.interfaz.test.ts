import assert from "node:assert/strict";
import test from "node:test";
import { servidorIntegrado } from "./soporte-integracion";
import { JUEGO } from "./soporte-metas";

test("DT-D4: formulario P3 → API real → colección simulada", async (t) => {
  t.mock.method(console, "log", () => undefined);
  const e = await servidorIntegrado(t);
  const modulo = "../../frontend/test/navegador.mjs";
  const { navegador } = await import(modulo);
  const n = await navegador({ apiReal: e.url }); t.after(() => n.cerrar());
  let ultima: any;
  async function editar() {
    if (ultima) await ultima.cerrar(); e.reiniciar(); e.juegos.filas[0].calificacion = 8;
    const p = await n.pagina({ ruta: `videojuegos/${JUEGO}`, titulo: "Juego ficticio" }); ultima = p;
    // RAWG está fuera de la deuda; ninguna prueba debe usar sus credenciales/red.
    await p.enviar("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*", "*/api/catalogo*"] });
    await p.evaluar(`document.querySelector('a[href="/videojuegos/${JUEGO}/editar"]').click()`);
    await p.esperar('!!document.querySelector("#juego-calificacion")');
    return p;
  }
  async function guardar(p: any) {
    await p.evaluar('document.querySelector("form").requestSubmit()');
    await p.esperar('!!document.querySelector(".detalle-estadisticas")');
    return (await e.solicitar("GET", `/videojuegos/${JUEGO}`)).body!.videojuego;
  }
  await t.test("DT-CA-04: quitar, guardar y volver a consultar elimina el valor anterior", async () => {
    const p = await editar(); await p.clic("Quitar calificación");
    assert.match(await p.texto(), /SIN CALIFICAR/);
    const juego = await guardar(p);
    assert.equal(Object.hasOwn(juego, "calificacion"), false);
    assert.equal(Object.hasOwn(e.juegos.filas[0], "calificacion"), false);
    assert.equal(await p.evaluar('document.querySelector(".stat-blanca strong").textContent.trim()'), "—");
  });
  await t.test("DT-CA-05: cambiar solo el título desde el formulario conserva la calificación", async () => {
    const p = await editar(); await p.campo("juego-titulo", "Juego renombrado");
    const juego = await guardar(p); assert.equal(juego.calificacion, 8); assert.equal(juego.titulo, "Juego renombrado");
  });
  await t.test("DT-CA-05: quitar y elegir cero antes de guardar conserva 0/10", async () => {
    const p = await editar(); await p.clic("Quitar calificación");
    // El rango ya está visualmente en cero: ir a 1 y volver a 0 simula elegirlo.
    await p.campo("juego-calificacion", 1); await p.campo("juego-calificacion", 0);
    assert.equal((await guardar(p)).calificacion, 0);
  });
});
