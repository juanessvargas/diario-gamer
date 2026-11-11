import assert from "node:assert/strict";
import test from "node:test";
import { JUEGO, OTRO_JUEGO, INEXISTENTE, copiar, datosMeta } from "./soporte-metas";
import { servidorIntegrado } from "./soporte-integracion";

const AHORA = new Date("2026-11-15T12:00:00-05:00");
const RUTA = `/videojuegos/${JUEGO}`;

test("E2-T15: Chrome → Vite → Express → servicios/dominio reales; colecciones simuladas", async (t) => {
  t.mock.method(console, "log", () => undefined); // Silenciar solo el logger HTTP.
  t.mock.timers.enable({ apis: ["Date"], now: AHORA.getTime() });
  const e = await servidorIntegrado(t);
  const moduloNavegador = "../../frontend/test/navegador.mjs";
  const { navegador } = await import(moduloNavegador);
  const n = await navegador({ apiReal: e.url }); t.after(() => n.cerrar());
  let ultima: any;
  async function pagina() {
    if (ultima) await ultima.cerrar();
    ultima = await n.pagina({ ruta: `videojuegos/${JUEGO}`, titulo: "Juego ficticio" });
    await ultima.enviar("Emulation.setTimezoneOverride", { timezoneId: "America/Guayaquil" });
    await ultima.esperar('!!document.querySelector("#meta-horas")');
    return ultima;
  }
  const progreso = async () => (await e.solicitar("GET", `${RUTA}/progreso-semanal`)).body!.progreso;
  const textoProgreso = (p: any) => p.evaluar('document.querySelector("#progreso-semanal").textContent');
  const listo = (p: any) => p.esperar('!!document.querySelector("#progreso-semanal [data-actividad]")');
  async function meta() {
    const r = await e.solicitar("POST", "/metas", datosMeta()); assert.equal(r.status, 201); return r.body!.meta;
  }
  async function cincoPartidas() {
    for (let dia = 9; dia <= 13; dia++) {
      const r = await e.solicitar("POST", "/partidas", { videojuego: JUEGO, fecha: `2026-11-${String(dia).padStart(2, "0")}T12:00:00-05:00`, duracionMinutos: 84, porcentajeAvance: 60 });
      assert.equal(r.status, 201);
    }
  }

  await t.test("CA-01/02/03/05.9/09.1: sin partidas, crear/consultar/editar y rechazar edición inválida", async () => {
    e.reiniciar(); const p = await pagina(); await listo(p);
    assert.match(await textoProgreso(p), /Sin partidas registradas/);
    assert.equal((await progreso()).porcentajeHoras, null);
    assert.equal(await p.evaluar("typeof window.__datos"), "undefined", "No se sustituye fetch ni se inyecta la API ficticia de T13/T14");
    await p.campo("meta-horas", 0); await p.campo("meta-dias", 4); await p.clic("Guardar meta");
    await p.esperar('!!document.querySelector(".meta-formulario [role=alert]")');
    assert.equal(e.solicitudes.some((r) => r.metodo === "POST" && r.ruta === "/api/metas"), false);
    await p.campo("meta-horas", 5); await p.campo("meta-dias", 4); await p.clic("Agregar hito");
    await p.campo("meta-descripcion-0", "Mitad"); await p.campo("meta-objetivo-0", 50); await p.clic("Guardar meta");
    await p.esperar('document.body.textContent.includes("Meta guardada")');
    const id = String(e.coleccion.filas[0]._id);
    assert.equal((await e.solicitar("GET", `/metas/${id}`)).body!.meta.hitos[0].descripcion, "Mitad");
    assert.match(await textoProgreso(p), /Pendiente/);
    await p.campo("meta-horas", 10); await p.clic("Guardar cambios");
    await p.esperar('document.querySelector("#progreso-semanal").textContent.includes("de 10 h")');
    const antes = (await e.solicitar("GET", `/metas/${id}`)).body!.meta;
    assert.equal(antes._id, id); assert.equal(e.coleccion.filas.length, 1);
    assert.equal((await e.solicitar("PUT", `/metas/${id}`, { horasSemanales: 0, diasPorSemana: 4, hitos: [] })).status, 400);
    assert.deepEqual((await e.solicitar("GET", `/metas/${id}`)).body!.meta, antes);
    assert.ok(e.solicitudes.some((r) => r.metodo === "POST" && r.ruta === "/api/metas" && r.status === 201));
  });
  await t.test("CA-04.5/05/06: cinco fechas distintas, 140 %, racha rota y cambio inmediato de objetivos", async () => {
    e.reiniciar(); await cincoPartidas(); await meta(); const p = await pagina(); await listo(p);
    const actual = await progreso();
    assert.deepEqual([actual.horasSemana, actual.diasJugadosSemana, actual.rachaActual, actual.mejorRacha, actual.porcentajeHoras], [7, 5, 0, 5, 140]);
    assert.deepEqual(actual.semana, { inicio: "2026-11-09", fin: "2026-11-15" });
    assert.match(await textoProgreso(p), /140 %/); assert.match(await textoProgreso(p), /Racha actual: 0/);
    assert.equal(await p.evaluar('document.querySelector("#progreso-semanal [role=progressbar]").getAttribute("aria-valuenow")'), "100");
    await p.campo("meta-horas", 10); await p.campo("meta-dias", 6); await p.clic("Guardar cambios");
    await p.esperar('document.querySelector("#progreso-semanal").textContent.includes("70 %")');
    assert.match(await textoProgreso(p), /5 de 6 días/); assert.equal((await progreso()).horasSemana, 7);
  });
  await t.test("CA-07.2/09.5: registrar y eliminar partida desde UI renueva los cálculos reales", async () => {
    e.reiniciar(); await cincoPartidas(); await meta(); const p = await pagina(); await listo(p);
    assert.match(await textoProgreso(p), /Alcanzado/);
    const consultas = e.solicitudes.filter((r) => r.ruta.endsWith("progreso-semanal")).length;
    await p.evaluar(`document.querySelector('a[href="/partidas/nueva?videojuego=${JUEGO}"]').click()`);
    await p.esperar('!!document.querySelector("#partida-fecha")');
    await p.campo("partida-fecha", "2026-11-15T12:00"); await p.campo("partida-duracion", 60); await p.campo("partida-avance", 40);
    await p.evaluar('document.querySelector("form").requestSubmit()'); await listo(p);
    assert.match(await textoProgreso(p), /8.0 h/); assert.match(await textoProgreso(p), /Racha actual: 1/); assert.match(await textoProgreso(p), /Pendiente/);
    assert.equal((await e.solicitar("GET", `${RUTA}/resumen`)).body!.resumen.porcentajeAvance, 40);
    await p.evaluar(`document.querySelector('a[href="/partidas"]').click()`);
    await p.esperar('document.querySelectorAll(".historial-tarjeta").length === 6');
    const borrar = p.evaluar('document.querySelector(".historial-tarjeta button").click()');
    await p.confirmar(true); await borrar;
    await p.esperar('document.querySelectorAll(".historial-tarjeta").length === 5');
    assert.equal(await p.evaluar("location.pathname"), "/partidas");
    await p.evaluar('document.querySelector(".historial-ver-juego").click()'); await listo(p);
    assert.match(await textoProgreso(p), /7.0 h/); assert.match(await textoProgreso(p), /Alcanzado/);
    assert.ok(e.solicitudes.filter((r) => r.ruta.endsWith("progreso-semanal")).length > consultas);
  });
  await t.test("CA-04: confirmación nativa cancela/acepta y reemplazo conserva historial", async () => {
    e.reiniciar(); const anterior = await meta(); const p = await pagina();
    const cancelar = p.clic("Desactivar meta"); await p.confirmar(false); await cancelar;
    assert.equal((await e.solicitar("GET", `/metas/${anterior._id}`)).body!.meta.activa, true);
    const aceptar = p.clic("Desactivar meta"); await p.confirmar(true); await aceptar;
    await p.esperar('document.body.textContent.includes("Meta desactivada")');
    assert.equal(await p.evaluar("document.activeElement.id"), "meta-titulo");
    const inactiva = (await e.solicitar("GET", `/metas/${anterior._id}`)).body!.meta;
    assert.equal(inactiva.activa, false); assert.deepEqual(inactiva.hitos, anterior.hitos);
    await p.campo("meta-horas", 3); await p.campo("meta-dias", 2); await p.clic("Guardar meta");
    await p.esperar('document.body.textContent.includes("Meta guardada")');
    assert.match(await textoProgreso(p), /Esta meta no tiene hitos/);
    const listado = (await e.solicitar("GET", `${RUTA}/metas`)).body!;
    assert.equal(listado.total, 2); assert.equal(listado.metas.filter((m: { activa: boolean }) => m.activa).length, 1);
  });
  await t.test("CA-01.5/09.3: 409 real visible ante creación desde un formulario desactualizado", async () => {
    e.reiniciar(); const p = await pagina(); await meta();
    await p.campo("meta-horas", 1); await p.campo("meta-dias", 1); await p.clic("Guardar meta");
    await p.esperar('!!document.querySelector(".meta-formulario [role=alert]")');
    assert.match(await p.texto(), /meta activa/); assert.equal((await p.texto()).includes("Meta guardada"), false);
    assert.equal(e.coleccion.filas.length, 1);
    assert.ok(e.solicitudes.some((r) => r.metodo === "POST" && r.ruta === "/api/metas" && r.status === 409));
  });
  await t.test("CA-01.6/03.4: completar/abandonar conserva meta activa y acciones", async () => {
    e.reiniciar(); const actual = await meta();
    for (const estado of ["completado", "abandonado"]) {
      assert.equal((await e.solicitar("PUT", RUTA, { titulo: "Juego ficticio", genero: "rol", plataforma: "PC", estado, logros: [] })).status, 200);
      assert.equal((await e.solicitar("GET", `/metas/${actual._id}`)).body!.meta.activa, true);
      const p = await pagina(); assert.equal(await p.evaluar('!!document.querySelector("#meta-horas")'), true);
    }
  });
  await t.test("CA-01.5: carrera HTTP con unicidad SIMULADA, no acredita índice MongoDB", async (caso) => {
    e.reiniciar();
    const original = e.Meta.collection.findOne.bind(e.Meta.collection);
    let llamadas = 0; let liberar!: () => void;
    const barrera = new Promise<void>((resolve) => { liberar = resolve; });
    caso.mock.method(e.Meta.collection, "findOne", async (...args: Parameters<typeof original>) => {
      const resultado = await original(...args);
      if (++llamadas === 2) liberar();
      await barrera; return resultado;
    });
    const resultados = await Promise.all([e.solicitar("POST", "/metas", datosMeta()), e.solicitar("POST", "/metas", datosMeta())]);
    assert.deepEqual(resultados.map((r) => r.status).sort(), [201, 409]);
    assert.equal(e.coleccion.filas.length, 1);
  });
  await t.test("CA-01.2/01.3/01.4: eludir formulario conserva validaciones HTTP 400", async () => {
    e.reiniciar();
    for (const cambios of [
      { horasSemanales: 0 }, { horasSemanales: -1 }, { horasSemanales: 101 }, { horasSemanales: "5" },
      { diasPorSemana: 0 }, { diasPorSemana: 8 }, { diasPorSemana: 1.5 },
      { hitos: Array.from({ length: 6 }, () => ({ descripcion: "Hito", porcentajeObjetivo: 50 })) },
      { hitos: [{ descripcion: " ", porcentajeObjetivo: 50 }] },
      { hitos: [{ descripcion: "Hito", porcentajeObjetivo: 0 }] },
      { hitos: [{ descripcion: "Hito", porcentajeObjetivo: 101 }] },
    ]) {
      const r = await e.solicitar("POST", "/metas", datosMeta(cambios));
      assert.equal(r.status, 400); assert.equal(typeof r.body!.error, "string"); assert.ok(r.body!.requestId);
    }
    assert.equal(e.coleccion.filas.length, 0);
  });
  await t.test("CA-07.3/05.5/06.5: resumen P3 futuro alcanza hitos sin sumar actividad", async () => {
    e.reiniciar(); await meta();
    assert.equal((await e.solicitar("POST", "/partidas", { videojuego: JUEGO, fecha: "2026-11-16T12:00:00-05:00", duracionMinutos: 60, porcentajeAvance: 80 })).status, 201);
    const p = await pagina(); await listo(p); const actual = await progreso();
    assert.deepEqual([actual.horasSemana, actual.diasJugadosSemana, actual.rachaActual, actual.mejorRacha], [0, 0, 0, 0]);
    assert.equal(actual.hitos[0].alcanzado, true); assert.match(await textoProgreso(p), /Alcanzado/);
    assert.equal((await e.solicitar("GET", `${RUTA}/resumen`)).body!.resumen.porcentajeAvance, 80);
  });
  await t.test("CA-09.2/09.3/F-17: carga HTTP y guardado correcto con refresco fallido recuperable", async () => {
    e.reiniciar(); await meta(); let liberar!: () => void;
    e.control.espera = new Promise<void>((resolve) => { liberar = resolve; });
    const p = await pagina(); assert.match(await textoProgreso(p), /Cargando progreso/);
    liberar(); e.control.espera = null; await listo(p);
    e.control.fallo = true; await p.campo("meta-horas", 9); await p.clic("Guardar cambios");
    await p.esperar('document.body.textContent.includes("se guardó, pero no pudimos actualizar")');
    assert.equal(e.coleccion.filas[0].horasSemanales, 9);
    assert.equal(await p.evaluar('!!document.querySelector("#progreso-semanal [data-actividad]")'), false);
    e.control.fallo = false; await p.clic("Reintentar metas"); await listo(p);
    assert.match(await textoProgreso(p), /de 9 h/);
  });
  await t.test("CA-08 y matriz HTTP: cascada real de servicios, conservación ajena, 400/404/204", async () => {
    e.reiniciar(); const anterior = await meta();
    await e.solicitar("PATCH", `/metas/${anterior._id}/desactivar`); await meta(); await cincoPartidas();
    assert.equal((await e.solicitar("POST", "/metas", datosMeta({ videojuego: OTRO_JUEGO }))).status, 201);
    assert.equal((await e.solicitar("POST", "/partidas", { videojuego: OTRO_JUEGO, fecha: "2026-11-15T10:00:00-05:00", duracionMinutos: 30, porcentajeAvance: 20 })).status, 201);
    const ajenas = copiar(e.coleccion.filas.filter((m) => String(m.videojuego) === OTRO_JUEGO));
    const partidasAjenas = copiar(e.partidas.filas.filter((p) => String(p.videojuego) === OTRO_JUEGO));
    assert.equal((await e.solicitar("DELETE", "/videojuegos/invalido")).status, 400);
    assert.equal((await e.solicitar("DELETE", `/videojuegos/${INEXISTENTE}`)).status, 404);
    assert.equal((await e.solicitar("GET", "/metas/invalido")).status, 400);
    assert.equal((await e.solicitar("GET", `/metas/${INEXISTENTE}`)).status, 404);
    const p = await pagina();
    assert.equal(await p.evaluar(`fetch('/api${RUTA}',{method:'DELETE'}).then(r=>r.status)`), 204);
    assert.deepEqual(e.partidas.filas, partidasAjenas);
    assert.deepEqual(e.coleccion.filas, ajenas);
    assert.equal((await e.solicitar("GET", `/metas/${anterior._id}`)).status, 404);
    assert.equal((await e.solicitar("GET", RUTA)).status, 404);
    assert.equal((await e.solicitar("GET", `/videojuegos/${OTRO_JUEGO}`)).status, 200);
    const sinMeta = await e.solicitar("POST", "/videojuegos", { titulo: "Sin meta", genero: "rol", plataforma: "PC", logros: [] });
    assert.equal(sinMeta.status, 201);
    assert.equal((await e.solicitar("DELETE", `/videojuegos/${sinMeta.body!.videojuego._id}`)).status, 204);
  });
  await t.test("CA-09.6: etiquetas y teclado en frontend conectado a Express", async () => {
    e.reiniciar(); const p = await pagina(); await listo(p);
    assert.equal(await p.evaluar('[...document.querySelectorAll(".meta-formulario input")].every(e=>e.labels.length>0)'), true);
    await p.evaluar('document.querySelector("#meta-horas").focus()');
    await p.enviar("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await p.enviar("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    assert.equal(await p.evaluar("document.activeElement.id"), "meta-dias");
    assert.equal(await p.evaluar("getComputedStyle(document.activeElement).outlineStyle"), "solid");
  });
});
