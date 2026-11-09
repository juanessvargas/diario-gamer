
import type { JuegoCatalogo } from "../tipos";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function buscarJuegosCatalogo(
  nombre: string
): Promise<JuegoCatalogo[]> {
  const respuesta = await fetch(
    `${API_URL}/api/catalogo?buscar=${encodeURIComponent(nombre)}`
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar el catálogo");
  }

  const datos: { juegos: JuegoCatalogo[] } =
    await respuesta.json();

  return datos.juegos;
}
