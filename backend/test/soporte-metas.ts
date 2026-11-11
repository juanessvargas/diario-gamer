import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import type { TestContext } from "node:test";
import mongoose, { type Model, Types } from "mongoose";
import { Videojuego } from "../src/modelos/Videojuego.model";

// Solo infraestructura de pruebas. No valida metas ni implementa servicios.
// Las colecciones siguientes son dobles: no prueban persistencia ni índices.
export type Registro = Record<string, any>;
export const JUEGO = "000000000000000000000001";
export const OTRO_JUEGO = "000000000000000000000002";
export const META = "000000000000000000000011";
export const OTRA_META = "000000000000000000000012";
export const INEXISTENTE = "000000000000000000000099";

mongoose.set("bufferCommands", false);
mongoose.set("autoCreate", false);
mongoose.set("autoIndex", false);

export function impedirConexion(t: TestContext) {
  const prohibido = () => { throw new Error("TEST: conexión real prohibida"); };
  t.mock.method(mongoose, "connect", prohibido);
  t.mock.method(mongoose.Connection.prototype, "openUri", prohibido);
}

// Carga dentro de cada caso: la ausencia de producción deja los tests en rojo,
// sin impedir que node:test enumere los escenarios. No se oculta el error.
export function cargarMeta(): Model<any> {
  return require("../src/modelos/Meta.model").Meta;
}

export interface ServiciosMetas {
  crearMeta(datos: Registro): Promise<any>;
  obtenerMeta(id: string): Promise<any>;
  listarMetasPorVideojuego(id: string): Promise<any[]>;
  actualizarMeta(id: string, datos: Registro): Promise<any>;
  desactivarMeta(id: string): Promise<any>;
}

// Nombres internos siguiendo los servicios existentes de PLAYLOG!.
export function cargarServicio(): ServiciosMetas {
  return require("../src/services/metas.service");
}

export function datosMeta(cambios: Registro = {}): Registro {
  return {
    videojuego: JUEGO, horasSemanales: 5, diasPorSemana: 4,
    hitos: [{ descripcion: "Llegar al 50 %", porcentajeObjetivo: 50 }],
    ...cambios,
  };
}

export function registroMeta(cambios: Registro = {}): Registro {
  return {
    ...datosMeta(), _id: new Types.ObjectId(META),
    videojuego: new Types.ObjectId(JUEGO), activa: true,
    createdAt: new Date("2026-11-02T12:00:00Z"),
    updatedAt: new Date("2026-11-02T12:00:00Z"), ...cambios,
  };
}

export function copiar<T>(valor: T): T {
  if (valor instanceof Date) return new Date(valor) as T;
  if (valor instanceof Types.ObjectId) return new Types.ObjectId(valor) as T;
  if (Array.isArray(valor)) return valor.map(copiar) as T;
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, copiar(v)])) as T;
  }
  return valor;
}

function coincide(doc: Registro, filtro: Registro): boolean {
  return Object.entries(filtro).every(([clave, esperado]) => {
    const actual = doc[clave];
    if (esperado && typeof esperado === "object"
        && !(esperado instanceof Types.ObjectId) && !(esperado instanceof Date)) {
      return Object.entries(esperado).every(([operador, valor]) => {
        if (operador === "$eq") return String(actual) === String(valor);
        if (operador === "$ne") return String(actual) !== String(valor);
        if (operador === "$in") return (valor as unknown[]).some((x) => String(actual) === String(x));
        if (operador === "$exists") return (actual !== undefined) === valor;
        throw new Error("Doble de colección: operador no soportado: " + operador);
      });
    }
    return String(actual) === String(esperado);
  });
}

function aplicar(doc: Registro, update: Registro) {
  for (const [clave, valor] of Object.entries(update)) {
    if (clave === "$set") Object.assign(doc, copiar(valor));
    else if (clave === "$unset") for (const campo of Object.keys(valor)) delete doc[campo];
    else if (clave === "$inc") for (const [campo, n] of Object.entries(valor)) doc[campo] = (doc[campo] ?? 0) + Number(n);
    else if (!clave.startsWith("$")) doc[clave] = copiar(valor);
    else throw new Error("Doble de colección: actualización no soportada: " + clave);
  }
}

export function doblarColeccion(t: TestContext, modelo: Model<any>, iniciales: Registro[]) {
  const filas = iniciales.map(copiar);
  const escrituras: string[] = [];
  const collection = modelo.collection;
  t.mock.method(collection, "findOne", async (filtro: Registro) => copiar(filas.find((d) => coincide(d, filtro)) ?? null));
  t.mock.method(collection, "find", (filtro: Registro) => {
    const cursor = {
      sort: () => cursor,
      toArray: async () => filas.filter((d) => coincide(d, filtro)).map(copiar),
    };
    return cursor;
  });
  t.mock.method(collection, "countDocuments", async (filtro: Registro) => filas.filter((d) => coincide(d, filtro)).length);
  t.mock.method(collection, "insertOne", async (doc: Registro) => {
    escrituras.push("insertOne"); filas.push(copiar(doc));
    return { acknowledged: true, insertedId: doc._id };
  });
  t.mock.method(collection, "updateOne", async (filtro: Registro, update: Registro) => {
    escrituras.push("updateOne");
    const doc = filas.find((d) => coincide(d, filtro));
    if (doc) aplicar(doc, update);
    return { acknowledged: true, matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 };
  });
  t.mock.method(collection, "findOneAndUpdate", async (filtro: Registro, update: Registro, opciones: Registro = {}) => {
    escrituras.push("findOneAndUpdate");
    const doc = filas.find((d) => coincide(d, filtro));
    if (!doc) return null;
    const antes = copiar(doc); aplicar(doc, update);
    return copiar(opciones.returnDocument === "after" || opciones.new ? doc : antes);
  });
  // Nunca simular éxito de borrados fuera de E2-T03.
  for (const metodo of ["deleteOne", "deleteMany"] as const) {
    t.mock.method(collection, metodo, async () => { throw new Error("TEST: no se permite borrar metas/juegos en E2-T03"); });
  }
  return { filas, escrituras };
}

export function preparar(t: TestContext, metas: Registro[] = []) {
  impedirConexion(t);
  const Meta = cargarMeta();
  const juegos = doblarColeccion(t, Videojuego, [
    { _id: new Types.ObjectId(JUEGO), titulo: "Juego ficticio", estado: "jugando" },
    { _id: new Types.ObjectId(OTRO_JUEGO), titulo: "Otro ficticio", estado: "completado" },
  ]);
  const coleccion = doblarColeccion(t, Meta, metas);
  return { Meta, juegos, coleccion };
}

export function comprobarEstado(estado: number) {
  return (error: unknown) => {
    assert.equal((error as { status?: number }).status, estado);
    return true;
  };
}

export async function clienteHttp(t: TestContext) {
  // app no inicia servidor ni conexión: nunca importar index.ts aquí.
  const { app } = require("../src/app");
  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return async (metodo: string, ruta: string, cuerpo?: unknown) => {
    const respuesta = await fetch(`http://127.0.0.1:${address.port}${ruta}`, {
      method: metodo,
      headers: cuerpo === undefined ? {} : { "Content-Type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(5000),
    });
    return { status: respuesta.status, body: await respuesta.json(), requestId: respuesta.headers.get("X-Request-Id") };
  };
}

export function errorDuplicado() {
  return Object.assign(new Error("Conflicto simulado del índice de meta activa"), {
    code: 11000, keyPattern: { videojuego: 1 }, keyValue: { videojuego: JUEGO },
  });
}
