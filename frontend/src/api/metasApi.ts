import type { Meta, NuevaMeta, ObjetivosMeta, ProgresoSemanal } from "../tipos";

const API_URL = import.meta.env?.VITE_API_URL ?? "";

export class ErrorMetasApi extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "ErrorMetasApi";
    this.status = status;
  }
}

async function solicitar<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api${ruta}`, opciones);
  } catch {
    throw new ErrorMetasApi("No pudimos conectar. Revisa tu conexión e inténtalo nuevamente.", null);
  }
  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    const mensaje = respuesta.status < 500 && typeof datos?.error === "string"
      ? datos.error
      : "No pudimos completar la operación de metas. Inténtalo nuevamente.";
    throw new ErrorMetasApi(mensaje, respuesta.status);
  }
  try {
    return await respuesta.json() as T;
  } catch {
    throw new ErrorMetasApi("No pudimos interpretar la respuesta de metas. Inténtalo nuevamente.", respuesta.status);
  }
}

function cuerpo(method: string, datos: NuevaMeta | ObjetivosMeta): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) };
}

export async function crearMeta(datos: NuevaMeta): Promise<Meta> {
  return (await solicitar<{ meta: Meta }>("/metas", cuerpo("POST", datos))).meta;
}

export async function obtenerMeta(id: string): Promise<Meta> {
  return (await solicitar<{ meta: Meta }>(`/metas/${encodeURIComponent(id)}`)).meta;
}

export async function listarMetasVideojuego(id: string): Promise<Meta[]> {
  return (await solicitar<{ total: number; metas: Meta[] }>(`/videojuegos/${encodeURIComponent(id)}/metas`)).metas;
}

export async function actualizarMeta(id: string, datos: ObjetivosMeta): Promise<Meta> {
  return (await solicitar<{ meta: Meta }>(`/metas/${encodeURIComponent(id)}`, cuerpo("PUT", datos))).meta;
}

export async function desactivarMeta(id: string): Promise<Meta> {
  return (await solicitar<{ meta: Meta }>(`/metas/${encodeURIComponent(id)}/desactivar`, { method: "PATCH" })).meta;
}

export async function obtenerProgresoSemanal(id: string): Promise<ProgresoSemanal> {
  return (await solicitar<{ progreso: ProgresoSemanal }>(`/videojuegos/${encodeURIComponent(id)}/progreso-semanal`)).progreso;
}
