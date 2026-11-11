import assert from "node:assert/strict";
import test from "node:test";
import { navegador } from "./navegador.mjs";

test("E2-T14 — progreso en Chrome con API ficticia", async (t) => {
  const n = await navegador(); t.after(() => n.cerrar());
  let ultima;
  const pagina = async (opciones) => {
    if (ultima) await ultima.cerrar();
    const p = await n.pagina(opciones); ultima = p;
    await p.esperar('!!document.querySelector("#progreso-semanal")');
    return p;
  };
  const texto = (p) => p.evaluar('document.querySelector("#progreso-semanal").textContent');
  const listo = (p) => p.esperar('!!document.querySelector("#progreso-semanal [data-actividad]")');

  await t.test("CA-05.1/05.2/05.6/06.1/06.4: datos del backend, 140 % real y barra limitada", async () => {
    const p = await pagina(); await listo(p);
    const contenido = await texto(p);
    for (const valor of ["7.0 h de 5 h", "2 de 3 días", "140 %", "Racha actual: 2", "Mejor racha: 9", "2026-11-09", "2026-11-15"]) assert.ok(contenido.includes(valor), valor);
    const barra = await p.evaluar('(() => { const b=document.querySelector("#progreso-semanal [role=progressbar]"); return [b.getAttribute("aria-valuenow"), b.firstElementChild.style.width,b.getAttribute("aria-valuetext")]; })()');
    assert.equal(barra[0], "100"); assert.equal(barra[1], "100%"); assert.match(barra[2], /140/);
    assert.match(contenido, /horas y días/);
    await p.enviar("Emulation.setTimezoneOverride", { timezoneId: "Pacific/Honolulu" });
    assert.equal(await p.evaluar('document.querySelector("#progreso-semanal time").dateTime'), "2026-11-09");
  });
  await t.test("CA-05.8/09.4: sin meta muestra actividad y rachas, sin porcentaje ni hitos anteriores", async () => {
    const p = await pagina({ sinMeta: true }); await listo(p);
    assert.match(await texto(p), /Sin meta activa/); assert.match(await texto(p), /7.0 h/);
    assert.equal(await p.evaluar('document.querySelectorAll("#progreso-semanal [role=progressbar]").length'), 0);
    assert.equal(await p.evaluar('document.querySelectorAll("#progreso-semanal [data-hito]").length'), 0);
    assert.match(await p.texto(), /Crea una/);
  });
  await t.test("CA-05.9/09.4: sin partidas muestra ceros e hitos pendientes", async () => {
    const p = await pagina({ sinPartidas: true, progreso: { horasSemana: 0, diasJugadosSemana: 0, rachaActual: 0, mejorRacha: 0, porcentajeHoras: 0, hitos: [{ descripcion: "Mitad", porcentajeObjetivo: 50, alcanzado: false }] } }); await listo(p);
    const contenido = await texto(p); assert.match(contenido, /Sin partidas registradas/); assert.match(contenido, /0.0 h/); assert.match(contenido, /Racha actual: 0/); assert.match(contenido, /Pendiente/);
  });
  await t.test("CA-09.4: meta sin hitos no es un error", async () => {
    const p = await pagina({ sinHitos: true }); await listo(p);
    assert.match(await texto(p), /Esta meta no tiene hitos/);
    assert.equal(await p.evaluar('!!document.querySelector("#progreso-semanal [role=alert]")'), false);
  });
  await t.test("CA-07.1/07.3: respeta hito alcanzado aun con cero actividad por partida futura", async () => {
    const p = await pagina({ futuras: true, progreso: { horasSemana: 0, diasJugadosSemana: 0, rachaActual: 0, mejorRacha: 0, porcentajeHoras: 0 } }); await listo(p);
    assert.match(await texto(p), /0.0 h/); assert.match(await texto(p), /Mitad/); assert.match(await texto(p), /Alcanzado/);
  });
  await t.test("CA-09.2: carga no muestra cero ni un vacío ficticio", async () => {
    const p = await pagina({ esperas: { "GET /api/videojuegos/juego/progreso-semanal": true } });
    assert.match(await texto(p), /Cargando progreso/);
    assert.equal(await p.evaluar('!!document.querySelector("#progreso-semanal [data-actividad]")'), false);
    await p.evaluar("window.__datos.esperas['GET /api/videojuegos/juego/progreso-semanal']()"); await listo(p);
  });
  await t.test("CA-09.3: fallo de progreso separado de P3, con reintento", async () => {
    const p = await pagina({ fallos: { "GET /api/videojuegos/juego/progreso-semanal": { status: 500 } } });
    await p.esperar('!!document.querySelector("#progreso-semanal [role=alert]")');
    assert.equal(await p.evaluar('!!document.querySelector("#progreso-semanal [data-actividad]")'), false);
    assert.match(await p.texto(), /JUEGO DE PRUEBA/);
    await p.evaluar("delete window.__datos.fallos['GET /api/videojuegos/juego/progreso-semanal']"); await p.clic("Reintentar progreso"); await listo(p);
  });
  await t.test("CA-03.2/09.1: editar consulta progreso nuevo sin reiniciar actividad", async () => {
    const p = await pagina(); await listo(p); await p.esperar('!!document.querySelector("#meta-horas")');
    const antes = await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length');
    await p.evaluar("window.__datos.despuesEditar={porcentajeHoras:70}"); await p.campo("meta-horas", 10); await p.campo("meta-dias", 4); await p.clic("Guardar cambios");
    await p.esperar('document.querySelector("#progreso-semanal").textContent.includes("70 %")');
    assert.match(await texto(p), /7.0 h de 10 h/); assert.match(await texto(p), /2 de 4 días/);
    assert.ok(await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length') > antes);
  });
  await t.test("CA-04.3/04.4/04.5: desactivar y crear renueva actividad e hitos", async () => {
    const p = await pagina(); await listo(p); await p.esperar('!!document.querySelector("#meta-horas")');
    await p.clic("Desactivar meta"); await p.esperar('document.querySelector("#progreso-semanal").textContent.includes("Sin meta activa")');
    assert.match(await texto(p), /7.0 h/);
    await p.evaluar("window.__datos.despuesCrear={porcentajeHoras:350,hitos:[]}");
    await p.campo("meta-horas", 2); await p.campo("meta-dias", 1); await p.clic("Guardar meta");
    await p.esperar('document.querySelector("#progreso-semanal").textContent.includes("350 %")');
    assert.match(await texto(p), /7.0 h de 2 h/);
    assert.equal(await p.evaluar("window.__datos.metas[0].activa"), false);
  });
  await t.test("F-17: fallo de refresco después de guardar no muestra progreso viejo como actualizado", async () => {
    const p = await pagina(); await listo(p); await p.esperar('!!document.querySelector("#meta-horas")');
    await p.evaluar("window.__datos.fallos['GET /api/videojuegos/juego/progreso-semanal']={status:500}"); await p.clic("Guardar cambios");
    await p.esperar('document.body.innerText.includes("se guardó, pero no pudimos actualizar")');
    assert.equal(await p.evaluar('!!document.querySelector("#progreso-semanal [data-actividad]")'), false);
  });
  await t.test("CA-09.5/07.2: registrar partida vuelve a detalle, renueva progreso y permite descenso de hitos", async () => {
    const p = await pagina(); await listo(p);
    const antes = await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length');
    await p.evaluar("window.__datos.despuesPartida={horasSemana:8,porcentajeHoras:160,rachaActual:3,hitos:[{descripcion:'Mitad',porcentajeObjetivo:50,alcanzado:false}]}; document.querySelector('a[href=\"/partidas/nueva?videojuego=juego\"]').click()");
    await p.esperar('!!document.querySelector("#partida-fecha")'); await p.campo("partida-fecha", "2026-11-10T12:00");
    await p.evaluar('document.querySelector("form").requestSubmit()');
    await p.esperar('!!document.querySelector("#progreso-semanal [data-actividad]")');
    assert.match(await texto(p), /8.0 h/); assert.match(await texto(p), /Racha actual: 3/); assert.match(await texto(p), /Pendiente/);
    assert.ok(await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length') > antes);
  });
  await t.test("CA-09.5: eliminar desde historial conserva navegación y renueva al regresar", async () => {
    const p = await pagina(); await listo(p);
    const antes = await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length');
    await p.evaluar("window.__datos.despuesEliminar={horasSemana:3,porcentajeHoras:60,diasJugadosSemana:1,rachaActual:1}; document.querySelector('a[href=\"/partidas\"]').click()");
    await p.esperar('!!document.querySelector(".historial-tarjeta")');
    await p.evaluar('document.querySelector(".historial-tarjeta button").click()');
    await p.esperar('document.querySelectorAll(".historial-tarjeta").length === 1');
    assert.equal(await p.evaluar("location.pathname"), "/partidas");
    await p.evaluar('document.querySelector(".historial-ver-juego").click()');
    await p.esperar('!!document.querySelector("#progreso-semanal [data-actividad]")');
    assert.match(await texto(p), /3.0 h/); assert.match(await texto(p), /1 de 3 días/);
    assert.ok(await p.evaluar('window.__datos.peticiones.filter(p=>p.clave.endsWith("progreso-semanal")).length') > antes);
  });
  await t.test("F-19/CA-05.10: respuesta tardía no sobrescribe otro videojuego", async () => {
    const p = await pagina({ esperas: { "GET /api/videojuegos/juego/progreso-semanal": true } });
    await p.evaluar("history.pushState({},'', '/videojuegos/otro'); dispatchEvent(new PopStateEvent('popstate'))");
    await p.esperar('document.querySelector("#progreso-semanal")?.textContent.includes("2.0 h")');
    await p.evaluar("window.__datos.esperas['GET /api/videojuegos/juego/progreso-semanal']()");
    await p.evaluar('new Promise(r=>setTimeout(r,100))');
    assert.match(await texto(p), /2.0 h/); assert.equal((await texto(p)).includes("7.0 h"), false);
  });
  await t.test("CA-09.6: móvil, escritorio, texto ampliado, foco y movimiento reducido", async () => {
    const p = await pagina(); await listo(p);
    await p.enviar("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    for (const width of [1280, 640, 390, 320]) {
      await p.enviar("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      assert.ok(await p.evaluar("document.documentElement.scrollWidth <= innerWidth"), `Sin desbordamiento a ${width}px`);
    }
    await p.enviar("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await p.esperar("visualViewport.scale >= 1.99");
    assert.match(await texto(p), /140 %/);
    await p.enviar("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
    await p.evaluar('document.querySelector("#progreso-semanal").style.fontSize="200%"');
    assert.ok(await p.evaluar("document.documentElement.scrollWidth <= innerWidth"));
    assert.ok(await p.evaluar('parseFloat(getComputedStyle(document.querySelector(".main-content")).animationDuration)<0.01'));
  });
});
