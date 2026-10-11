
import type {
  Videojuego,
  NuevoVideojuego,
  ResumenVideojuego,
  Partida,
} from "../tipos";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Obtener todos los videojuegos.
export async function obtenerVideojuegos(
  estado?: string
): Promise<Videojuego[]> {
  const filtro = estado ? `?estado=${encodeURIComponent(estado)}` : "";

  const respuesta = await fetch(`${API_URL}/api/videojuegos${filtro}`);

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar los videojuegos");
  }

  const datos = await respuesta.json();
  return datos.videojuegos;
}

// Obtener un videojuego por ID.
export async function obtenerVideojuego(
  id: string
): Promise<Videojuego> {
  const respuesta = await fetch(`${API_URL}/api/videojuegos/${id}`);

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el videojuego");
  }

  const datos = await respuesta.json();
  return datos.videojuego;
}

// Crear videojuego.
export async function crearVideojuego(
  videojuego: NuevoVideojuego
): Promise<Videojuego> {
  const respuesta = await fetch(`${API_URL}/api/videojuegos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(videojuego),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo crear el videojuego");
  }

  const datos = await respuesta.json();
  return datos.videojuego;
}

// Actualizar videojuego.
export async function actualizarVideojuego(
  id: string,
  videojuego: NuevoVideojuego
): Promise<Videojuego> {
  const respuesta = await fetch(`${API_URL}/api/videojuegos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(videojuego),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo actualizar el videojuego");
  }

  const datos = await respuesta.json();
  return datos.videojuego;
}

// Eliminar videojuego.
export async function eliminarVideojuego(id: string): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/videojuegos/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo eliminar el videojuego");
  }
}

// Actualizar logro.
export async function actualizarLogro(
  videojuegoId: string,
  logroId: string,
  obtenido: boolean
): Promise<Videojuego> {
  const respuesta = await fetch(
    `${API_URL}/api/videojuegos/${videojuegoId}/logros/${logroId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obtenido }),
    }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo actualizar el logro");
  }

  const datos = await respuesta.json();
  return datos.videojuego;
}

// Obtener partidas de un videojuego.
export async function obtenerPartidasVideojuego(
  id: string
): Promise<Partida[]> {
  const respuesta = await fetch(
    `${API_URL}/api/videojuegos/${id}/partidas`
  );

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar las partidas");
  }

  const datos = await respuesta.json();
  return datos.partidas;
}

// Obtener resumen calculado por el backend.
export async function obtenerResumenVideojuego(
  id: string
): Promise<ResumenVideojuego> {
  const respuesta = await fetch(
    `${API_URL}/api/videojuegos/${id}/resumen`
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el resumen");
  }

  const datos = await respuesta.json();
  return datos.resumen;
}
