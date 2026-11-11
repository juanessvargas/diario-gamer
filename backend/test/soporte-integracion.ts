import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { TestContext } from "node:test";
import { Partida } from "../src/modelos/Partida.model";
import { Videojuego } from "../src/modelos/Videojuego.model";
import { copiar, doblarColeccion, errorDuplicado, preparar, type Registro } from "./soporte-metas";

// Solo sustituye operaciones de colecciones. Nunca calcula progreso ni responde
// por los controladores. NO acredita MongoDB, persistencia ni un índice real.
function coincide(doc: Registro, filtro: Registro) {
  return Object.entries(filtro).every(([campo, valor]) => {
    if (valor && typeof valor === "object" && "$in" in valor)
      return valor.$in.some((v: unknown) => String(v) === String(doc[campo]));
    return String(doc[campo]) === String(valor);
  });
}

function ordenar(filas: Registro[], orden: Registro = {}) {
  return [...filas].sort((a, b) => {
    for (const [campo, direccion] of Object.entries(orden)) {
      const x = a[campo] instanceof Date ? a[campo].getTime() : String(a[campo]);
      const y = b[campo] instanceof Date ? b[campo].getTime() : String(b[campo]);
      if (x !== y) return (x < y ? -1 : 1) * Number(direccion);
    }
    return 0;
  });
}

export async function servidorIntegrado(t: TestContext) {
  const base = preparar(t);
  const partidas = doblarColeccion(t, Partida, []);
  for (const juego of base.juegos.filas) Object.assign(juego, { genero: "rol", plataforma: "PC", logros: [] });
  const juegosIniciales = copiar(base.juegos.filas);
  for (const [modelo, filas] of [
    [Videojuego, base.juegos.filas], [Partida, partidas.filas], [base.Meta, base.coleccion.filas],
  ] as const) {
    t.mock.method(modelo.collection, "findOne", async (filtro: Registro, opciones: Registro = {}) =>
      copiar(ordenar(filas.filter((d) => coincide(d, filtro)), opciones.sort)[0] ?? null));
    t.mock.method(modelo.collection, "find", (filtro: Registro, opciones: Registro = {}) => {
      let orden = opciones.sort ?? {};
      const cursor = {
        sort: (nuevo: Registro) => { orden = nuevo; return cursor; },
        toArray: async () => ordenar(filas.filter((d) => coincide(d, filtro)), orden).map(copiar),
      };
      return cursor;
    });
    t.mock.method(modelo.collection, "deleteMany", async (filtro: Registro) => {
      assert.ok(Object.keys(filtro).length, "El doble prohíbe borrados sin filtro");
      let deletedCount = 0;
      for (let i = filas.length - 1; i >= 0; i--)
        if (coincide(filas[i], filtro)) { filas.splice(i, 1); deletedCount++; }
      return { acknowledged: true, deletedCount };
    });
    t.mock.method(modelo.collection, "deleteOne", async (filtro: Registro) => {
      const indice = filas.findIndex((d) => coincide(d, filtro));
      if (indice >= 0) filas.splice(indice, 1);
      return { acknowledged: true, deletedCount: indice >= 0 ? 1 : 0 };
    });
    t.mock.method(modelo.collection, "findOneAndDelete", async (filtro: Registro) => {
      const indice = filas.findIndex((d) => coincide(d, filtro));
      return indice < 0 ? null : copiar(filas.splice(indice, 1)[0]);
    });
  }
  t.mock.method(base.Meta.collection, "insertOne", async (doc: Registro) => {
    // Defensa SIMULADA para el escenario concurrente. No es un índice MongoDB.
    if (doc.activa && base.coleccion.filas.some((m) => m.activa && String(m.videojuego) === String(doc.videojuego))) throw errorDuplicado();
    base.coleccion.filas.push(copiar(doc));
    return { acknowledged: true, insertedId: doc._id };
  });
  const control = { espera: null as Promise<void> | null, fallo: false };
  const solicitudes: { metodo: string; ruta: string; status: number }[] = [];
  const { app } = require("../src/app");
  const server = createServer(async (req, res) => {
    const ruta = req.url ?? "";
    res.once("finish", () => solicitudes.push({ metodo: req.method ?? "", ruta, status: res.statusCode }));
    if (ruta.endsWith("/progreso-semanal")) {
      if (control.espera) await control.espera;
      if (control.fallo) {
        // Fallo de transporte inyectado para observar recuperación de la UI.
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Fallo de transporte simulado" })); return;
      }
    }
    app(req, res);
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
  });
  const direccion = server.address(); assert.ok(direccion && typeof direccion !== "string");
  const url = `http://127.0.0.1:${direccion.port}`;
  async function solicitar(metodo: string, ruta: string, cuerpo?: unknown) {
    const r = await fetch(`${url}/api${ruta}`, {
      method: metodo, headers: cuerpo === undefined ? {} : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), signal: AbortSignal.timeout(5000),
    });
    return { status: r.status, body: r.status === 204 ? null : await r.json() as Registro };
  }
  function reiniciar() {
    base.juegos.filas.splice(0, base.juegos.filas.length, ...copiar(juegosIniciales));
    base.coleccion.filas.splice(0); partidas.filas.splice(0); solicitudes.splice(0);
    control.fallo = false; control.espera = null;
  }
  return { ...base, partidas, url, solicitar, solicitudes, control, reiniciar };
}
