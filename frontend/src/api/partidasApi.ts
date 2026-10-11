
import type { Partida, NuevaPartida } from "../tipos";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Listar todas las partidas.
export async function obtenerPartidas(): Promise<Partida[]> {
  const respuesta = await fetch(`${API_URL}/api/partidas`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar las partidas");
  }

  const datos = await respuesta.json();
  return datos.partidas;
}

// Registrar nueva partida.
export async function crearPartida(
  partida: NuevaPartida
): Promise<Partida> {
  const respuesta = await fetch(`${API_URL}/api/partidas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partida),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo registrar la partida");
  }

  const datos = await respuesta.json();
  return datos.partida;
}

// Eliminar una partida.
export async function eliminarPartida(id: string): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/partidas/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo eliminar la partida");
  }
}
