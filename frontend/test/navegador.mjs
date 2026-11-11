import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createServer } from "../node_modules/vite/dist/node/index.js";

// Solo procesa el hijo creado por este runner, nunca procesos del usuario.
export async function cerrarProceso(proceso, esperaMs = 2000) {
  if (proceso.exitCode !== null || proceso.signalCode !== null) return;
  await new Promise((resolve) => {
    const suave = setTimeout(() => proceso.kill("SIGTERM"), esperaMs);
    const fuerte = setTimeout(() => proceso.kill("SIGKILL"), esperaMs * 2);
    proceso.once("exit", () => { clearTimeout(suave); clearTimeout(fuerte); resolve(); });
  });
}

// Sin apiReal mantiene los dobles T13/T14; T15 puede usar Express por HTTP.
export async function navegador({ apiReal } = {}) {
  const vite = await createServer({ root: "frontend", envDir: false, server: {
    host: "127.0.0.1", port: 0,
    ...(apiReal ? { proxy: { "/api": { target: apiReal, changeOrigin: true } } } : {}),
  } });
  await vite.listen();
  const base = vite.resolvedUrls.local[0];
  const perfil = await mkdtemp(join(tmpdir(), "playlog-navegador-"));
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${perfil}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
    "--disable-sync", "--disable-component-update", "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let salida = "";
  const endpoint = await new Promise((resolve, reject) => {
    const tiempo = setTimeout(() => reject(new Error("Chrome no anunció CDP")), 15000);
    chrome.stderr.on("data", (chunk) => {
      salida += chunk.toString();
      const encontrado = salida.match(/DevTools listening on (ws:\/\/\S+)/);
      if (encontrado) { clearTimeout(tiempo); resolve(encontrado[1]); }
    });
    chrome.once("error", reject);
  });
  const ws = new WebSocket(endpoint);
  await once(ws, "open");
  let id = 0;
  const pendientes = new Map();
  const dialogos = new Set();
  ws.addEventListener("message", ({ data }) => {
    const mensaje = JSON.parse(data);
    if (mensaje.method === "Page.javascriptDialogOpening") dialogos.add(mensaje.sessionId);
    if (!mensaje.id) return;
    const pendiente = pendientes.get(mensaje.id);
    if (!pendiente) return;
    pendientes.delete(mensaje.id);
    clearTimeout(pendiente.tiempo);
    if (mensaje.error) pendiente.reject(new Error(JSON.stringify(mensaje.error)));
    else pendiente.resolve(mensaje.result);
  });
  ws.addEventListener("close", () => {
    for (const pendiente of pendientes.values()) {
      clearTimeout(pendiente.tiempo);
      pendiente.reject(new Error(`Chrome cerró CDP (código ${chrome.exitCode}, señal ${chrome.signalCode})`));
    }
    pendientes.clear();
  });
  function cdp(method, params = {}, sessionId) {
    if (ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Conexión CDP cerrada"));
    return new Promise((resolve, reject) => {
      const clave = ++id;
      const tiempo = setTimeout(() => { pendientes.delete(clave); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      pendientes.set(clave, { resolve, reject, tiempo });
      ws.send(JSON.stringify({ id: clave, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  return {
    async pagina(opciones = {}) {
      const { targetId } = await cdp("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await cdp("Target.attachToTarget", { targetId, flatten: true });
      await cdp("Target.activateTarget", { targetId });
      const enviar = (method, params) => cdp(method, params, sessionId);
      const evaluar = async (expression) => {
        const r = await enviar("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ": " + r.exceptionDetails.exception?.description);
        return r.result.value;
      };
      await enviar("Network.enable");
      await enviar("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*"] });
      await enviar("Page.enable");
      if (!apiReal) await enviar("Page.addScriptToEvaluateOnNewDocument", { source: `(${apiFicticia.toString()})(${JSON.stringify(opciones)})` });
      await enviar("Page.navigate", { url: `${base}${opciones.ruta ?? "videojuegos/juego"}` });
      const esperar = async (expresion) => {
        for (let intento = 0; intento < 150; intento++) {
          if (await evaluar(expresion)) return;
          await new Promise((r) => setTimeout(r, 40));
        }
        throw new Error(`No se cumplió: ${expresion}\n${await evaluar('document.body?.innerText ?? ""')}`);
      };
      await esperar(`document.body?.textContent.includes(${JSON.stringify(opciones.titulo ?? "Juego de prueba")})`);
      return {
        evaluar, esperar, enviar,
        async confirmar(accept) {
          for (let i = 0; i < 150 && !dialogos.has(sessionId); i++) await new Promise((r) => setTimeout(r, 20));
          assert.ok(dialogos.delete(sessionId), "Diálogo nativo de confirmación abierto");
          await enviar("Page.handleJavaScriptDialog", { accept });
        },
        texto: () => evaluar("document.body.innerText"),
        async clic(texto) {
          assert.equal(await evaluar(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(texto)}); if (!b || b.disabled) return false; b.click(); return true; })()`), true, `Botón disponible: ${texto}`);
        },
        async campo(idCampo, valor) {
          await evaluar(`(() => { const e = document.getElementById(${JSON.stringify(idCampo)}); if (!e) throw new Error('Campo ausente'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ${JSON.stringify(String(valor))}); e.dispatchEvent(new Event('input', {bubbles:true})); })()`);
        },
        cerrar: () => cdp("Target.closeTarget", { targetId }),
      };
    },
    async cerrar() {
      await cdp("Browser.close").catch(() => {});
      ws.close();
      await cerrarProceso(chrome);
      await vite.close();
      await rm(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}

function apiFicticia(opciones) {
  const objetivos = { horasSemanales: 5, diasPorSemana: 3, hitos: [{ descripcion: "Mitad", porcentajeObjetivo: 50 }] };
  const meta = { ...objetivos, _id: "meta-1", videojuego: "juego", activa: true, createdAt: "2026-11-01", updatedAt: "2026-11-01" };
  const juego = { _id: "juego", titulo: "Juego de prueba", genero: "rol", plataforma: "PC", estado: opciones.estado ?? "completado", logros: [] };
  window.__datos = {
    metas: opciones.sinMeta ? [] : [meta], peticiones: [], fallos: opciones.fallos ?? {}, esperas: opciones.esperas ?? {},
    progreso: { semana: { inicio: "2026-11-09", fin: "2026-11-15" }, meta: opciones.sinMeta ? null : objetivos,
      horasSemana: 7, porcentajeHoras: opciones.sinMeta ? null : 140, diasJugadosSemana: 2, rachaActual: 2, mejorRacha: 9,
      hitos: opciones.sinMeta ? [] : [{ descripcion: "Mitad", porcentajeObjetivo: 50, alcanzado: true }], ...opciones.progreso },
  };
  window.__datos.partidas = opciones.sinPartidas ? [] : [
    { _id: "partida-1", videojuego: juego, fecha: "2026-11-09T12:00:00-05:00", duracionMinutos: 200, porcentajeAvance: 40 },
    { _id: "partida-2", videojuego: juego, fecha: "2026-11-10T12:00:00-05:00", duracionMinutos: 220, porcentajeAvance: 50 },
  ];
  if (opciones.futuras) window.__datos.partidas.forEach((p) => { p.fecha = "2099-11-10T12:00:00-05:00"; });
  if (opciones.sinHitos) {
    window.__datos.metas.forEach((m) => { m.hitos = []; });
    window.__datos.progreso.hitos = [];
  }
  window.confirm = () => { window.__confirmaciones = (window.__confirmaciones ?? 0) + 1; return window.__confirmar !== false; };
  window.fetch = async (url, init = {}) => {
    const d = window.__datos;
    const ruta = new URL(url, location.origin).pathname;
    const clave = `${init.method ?? "GET"} ${ruta}`;
    const cuerpo = init.body ? JSON.parse(init.body) : undefined;
    d.peticiones.push({ clave, cuerpo });
    if (d.esperas[clave]) await new Promise((resolve) => { d.esperas[clave] = () => { delete d.esperas[clave]; resolve(); }; });
    if (d.fallos[clave]) {
      const fallo = d.fallos[clave];
      if (fallo === "red") throw new TypeError("Sin conexión simulada");
      return Response.json({ error: fallo.error }, { status: fallo.status });
    }
    if (clave === "GET /api/videojuegos/juego") return Response.json({ videojuego: juego });
    if (clave === "GET /api/videojuegos") return Response.json({ videojuegos: [juego] });
    if (clave === "GET /api/videojuegos/juego/partidas" || clave === "GET /api/partidas") return Response.json({ partidas: d.partidas });
    if (clave === "GET /api/videojuegos/juego/resumen") return Response.json({ resumen: { totalPartidas: d.partidas.length, horasTotales: d.partidas.length ? 7 : 0, ultimaSesion: d.partidas.at(-1)?.fecha ?? null, porcentajeAvance: d.partidas.length ? 50 : 0 } });
    if (clave === "GET /api/videojuegos/juego/metas") return Response.json({ total: d.metas.length, metas: d.metas });
    if (clave === "GET /api/videojuegos/juego/progreso-semanal") return Response.json({ progreso: d.progreso });
    if (clave === "POST /api/metas") {
      if (d.metas.some((m) => m.activa)) return Response.json({ error: "Ya existe una meta activa" }, { status: 409 });
      const nueva = { ...cuerpo, _id: `meta-${d.metas.length + 1}`, activa: true, createdAt: "2026-11-10", updatedAt: "2026-11-10" };
      d.metas.push(nueva); d.progreso.meta = cuerpo;
      Object.assign(d.progreso, d.despuesCrear ?? {});
      return Response.json({ meta: nueva }, { status: 201 });
    }
    if (clave.startsWith("PUT /api/metas/")) {
      const actual = d.metas.find((m) => m._id === ruta.split("/").at(-1));
      Object.assign(actual, cuerpo); d.progreso.meta = cuerpo;
      Object.assign(d.progreso, d.despuesEditar ?? {});
      return Response.json({ meta: actual });
    }
    if (clave === "POST /api/partidas") {
      const partida = { ...cuerpo, _id: "partida-nueva", videojuego: juego };
      d.partidas.push(partida); Object.assign(d.progreso, d.despuesPartida ?? {});
      return Response.json({ partida }, { status: 201 });
    }
    if (clave.startsWith("DELETE /api/partidas/")) {
      d.partidas = d.partidas.filter((p) => p._id !== ruta.split("/").at(-1));
      Object.assign(d.progreso, d.despuesEliminar ?? {});
      return new Response(null, { status: 204 });
    }
    if (ruta.startsWith("/api/videojuegos/otro")) {
      if (ruta.endsWith("/progreso-semanal")) return Response.json({ progreso: { ...d.progreso, horasSemana: 2, rachaActual: 1 } });
      if (ruta.endsWith("/resumen")) return Response.json({ resumen: { totalPartidas: 0, horasTotales: 0, ultimaSesion: null, porcentajeAvance: 0 } });
      if (ruta.endsWith("/partidas")) return Response.json({ partidas: [] });
      if (ruta.endsWith("/metas")) return Response.json({ total: 0, metas: [] });
      return Response.json({ videojuego: { ...juego, _id: "otro", titulo: "Otro juego" } });
    }
    if (clave.endsWith("/desactivar")) {
      const actual = d.metas.find((m) => m._id === ruta.split("/").at(-2));
      actual.activa = false; d.progreso.meta = null; d.progreso.porcentajeHoras = null; d.progreso.hitos = [];
      return Response.json({ meta: actual });
    }
    return Response.json({ error: `Ruta ficticia no prevista: ${clave}` }, { status: 404 });
  };
}
