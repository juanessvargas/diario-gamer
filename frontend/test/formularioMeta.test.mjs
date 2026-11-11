import assert from "node:assert/strict";
import test from "node:test";
import { navegador } from "./navegador.mjs";

test("E2-T13 — formularios en Chrome con API ficticia", async (t) => {
  const n = await navegador(); t.after(() => n.cerrar());
  let ultima;
  const pagina = async (opciones) => {
    if (ultima) await ultima.cerrar();
    const p = await n.pagina(opciones); ultima = p;
    await p.esperar('!!document.querySelector("#meta-horas")');
    return p;
  };
  await t.test("CA-01.1/01.6/09.1: crea desde juego completado con objetivos e hitos", async () => {
    const p = await pagina({ sinMeta: true });
    await p.campo("meta-horas", 2.5); await p.campo("meta-dias", 7);
    await p.clic("Agregar hito"); await p.campo("meta-descripcion-0", "Comienzo"); await p.campo("meta-objetivo-0", 1.5);
    await p.clic("Guardar meta"); await p.esperar('document.body.innerText.includes("Meta guardada")');
    const metas = await p.evaluar("window.__datos.metas");
    assert.equal(metas.length, 1); assert.equal(metas[0].horasSemanales, 2.5);
    assert.equal(metas[0].diasPorSemana, 7); assert.equal(metas[0].hitos[0].porcentajeObjetivo, 1.5);
    assert.equal(metas[0].videojuego, "juego");
  });
  await t.test("CA-03.1/03.4: precarga, edita mismo ID y permite abandonado", async () => {
    const p = await pagina({ estado: "abandonado" });
    assert.equal(await p.evaluar('document.querySelector("#meta-horas").value'), "5");
    await p.campo("meta-horas", 100); await p.campo("meta-dias", 1);
    await p.clic("Guardar cambios"); await p.esperar('document.body.innerText.includes("Meta guardada")');
    const metas = await p.evaluar("window.__datos.metas");
    assert.equal(metas.length, 1); assert.equal(metas[0]._id, "meta-1"); assert.equal(metas[0].activa, true);
    assert.equal(metas[0].horasSemanales, 100);
  });
  for (const [campo, valor] of [["meta-horas", 0], ["meta-horas", -1], ["meta-horas", 101], ["meta-horas", ""], ["meta-dias", 0], ["meta-dias", 8], ["meta-dias", 1.5]]) {
    await t.test(`CA-01.2/01.3/03.3: rechaza ${campo}=${valor} sin guardar`, async () => {
      const p = await pagina(); await p.campo(campo, valor);
      await p.evaluar("document.querySelector('.meta-formulario').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))");
      await p.esperar('!!document.querySelector(".meta-formulario [role=alert]")');
      assert.equal(await p.evaluar('window.__datos.peticiones.filter(p => p.clave.startsWith("PUT")).length'), 0);
      assert.equal(await p.evaluar("window.__datos.metas[0].horasSemanales"), 5);
    });
  }
  await t.test("CA-01.4: cinco hitos, límites 1/100 y quitar con nombre accesible", async () => {
    const p = await pagina({ sinMeta: true });
    await p.campo("meta-horas", 5); await p.campo("meta-dias", 3);
    for (let i = 0; i < 5; i++) {
      await p.clic("Agregar hito"); await p.campo(`meta-descripcion-${i}`, `Hito ${i}`); await p.campo(`meta-objetivo-${i}`, i === 4 ? 100 : 1);
    }
    assert.equal(await p.evaluar('[...document.querySelectorAll("button")].find(b => b.textContent === "Agregar hito").disabled'), true);
    await p.clic("Guardar meta"); await p.esperar('document.body.innerText.includes("Meta guardada")');
    assert.equal(await p.evaluar("window.__datos.metas[0].hitos.length"), 5);
    await p.clic("Quitar hito 1"); assert.equal(await p.evaluar('document.querySelectorAll(".meta-hito").length'), 4);
  });
  for (const [campo, valor] of [["meta-descripcion-0", "   "], ["meta-objetivo-0", 0], ["meta-objetivo-0", 101], ["meta-objetivo-0", ""]]) {
    await t.test(`CA-01.4/03.3: hito inválido ${campo}=${valor}`, async () => {
      const p = await pagina(); await p.campo(campo, valor); await p.clic("Guardar cambios");
      await p.esperar('!!document.querySelector(".meta-formulario [role=alert]")');
      assert.equal(await p.evaluar('window.__datos.peticiones.some(p => p.clave.startsWith("PUT"))'), false);
    });
  }
  await t.test("CA-04.1/04.2/04.3/04.4: cancela, confirma y crea nueva conservando anterior", async () => {
    const p = await pagina(); await p.evaluar("window.__confirmar = false"); await p.clic("Desactivar meta");
    assert.equal(await p.evaluar("window.__confirmaciones"), 1);
    assert.equal(await p.evaluar('window.__datos.peticiones.some(p => p.clave.startsWith("PATCH"))'), false);
    await p.evaluar("window.__confirmar = true"); await p.clic("Desactivar meta");
    await p.esperar('document.body.innerText.includes("Meta desactivada")');
    assert.equal(await p.evaluar('document.activeElement.id'), "meta-titulo");
    await p.campo("meta-horas", 1); await p.campo("meta-dias", 1); await p.clic("Guardar meta");
    await p.esperar('document.body.innerText.includes("Meta guardada")');
    const metas = await p.evaluar("window.__datos.metas");
    assert.equal(metas.length, 2); assert.equal(metas[0].activa, false); assert.equal(metas[0].hitos.length, 1); assert.equal(metas[1].activa, true);
  });
  for (const status of [400, 404, 409]) {
    await t.test(`CA-01.5/09.3: HTTP ${status} no anuncia guardado`, async () => {
      const p = await pagina(); await p.evaluar(`window.__datos.fallos['PUT /api/metas/meta-1']={status:${status},error:'Error comprobado ${status}'}`);
      await p.clic("Guardar cambios"); await p.esperar(`document.body.innerText.includes('Error comprobado ${status}')`);
      assert.equal((await p.texto()).includes("Meta guardada"), false);
      assert.equal(await p.evaluar('document.activeElement.id'), "meta-mensaje");
    });
  }
  await t.test("CA-09.2: carga y bloqueo de doble envío", async () => {
    const p = await pagina(); await p.evaluar("window.__datos.esperas['PUT /api/metas/meta-1'] = true");
    await p.clic("Guardar cambios"); await p.esperar('document.body.innerText.includes("Guardando...")');
    await p.evaluar("document.querySelector('.meta-formulario').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))");
    assert.equal(await p.evaluar('window.__datos.peticiones.filter(p => p.clave.startsWith("PUT")).length'), 1);
    await p.evaluar("window.__datos.esperas['PUT /api/metas/meta-1']()");
    await p.esperar('document.body.innerText.includes("Meta guardada")');
  });
  await t.test("F-17: guardado correcto y refresco fallido se distinguen", async () => {
    const p = await pagina(); await p.evaluar("window.__datos.fallos['GET /api/videojuegos/juego/metas']={status:500}");
    await p.clic("Guardar cambios");
    await p.esperar('document.body.innerText.includes("se guardó, pero no pudimos actualizar")');
    assert.equal(await p.evaluar('window.__datos.peticiones.filter(p => p.clave.startsWith("PUT")).length'), 1);
  });
  await t.test("CA-01.5: creación en conflicto no duplica una meta activa", async () => {
    const p = await pagina({ sinMeta: true });
    await p.campo("meta-horas", 1); await p.campo("meta-dias", 1);
    await p.evaluar("window.__datos.fallos['POST /api/metas']={status:409,error:'Ya existe una meta activa'}");
    await p.clic("Guardar meta"); await p.esperar('document.body.innerText.includes("Ya existe una meta activa")');
    assert.equal(await p.evaluar("window.__datos.metas.length"), 0);
    assert.equal((await p.texto()).includes("Meta guardada"), false);
  });
  await t.test("CA-09.2/09.3: consulta pendiente y error permiten reintentar sin crear una meta ficticia", async () => {
    if (ultima) await ultima.cerrar();
    const p = await n.pagina({ esperas: { "GET /api/videojuegos/juego/metas": true }, fallos: { "GET /api/videojuegos/juego/metas": { status: 404, error: "Meta no disponible" } } }); ultima = p;
    assert.match(await p.texto(), /Cargando tu meta/);
    assert.equal(await p.evaluar('!!document.querySelector("#meta-horas")'), false);
    await p.evaluar("window.__datos.esperas['GET /api/videojuegos/juego/metas']()");
    await p.esperar('document.body.innerText.includes("Meta no disponible")');
    await p.evaluar("delete window.__datos.fallos['GET /api/videojuegos/juego/metas']");
    await p.clic("Reintentar metas"); await p.esperar('!!document.querySelector("#meta-horas")');
  });
  await t.test("CA-09.6: etiquetas, teclado y foco visible", async () => {
    const p = await pagina();
    assert.equal(await p.evaluar('[...document.querySelectorAll(".meta-formulario input")].every(e => e.labels.length > 0)'), true);
    await p.evaluar('document.querySelector("#meta-horas").focus()');
    await p.enviar("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await p.enviar("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    assert.equal(await p.evaluar("document.activeElement.id"), "meta-dias");
    assert.equal(await p.evaluar("getComputedStyle(document.activeElement).outlineStyle"), "solid");
  });
});
