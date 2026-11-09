
import { ApiError } from "../apiError";

interface JuegoRAWG {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
}

interface RespuestaRAWG {
  results: JuegoRAWG[];
}

export async function buscarJuegosRAWG(busqueda: string) {
  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    throw new ApiError(
      500,
      "La API de videojuegos no está configurada"
    );
  }

  const nombre = busqueda.trim();

  if (nombre.length < 2) {
    throw new ApiError(
      400,
      "Escribe al menos 2 caracteres para buscar"
    );
  }

  const parametros = new URLSearchParams({
    key: apiKey,
    search: nombre,
    page_size: "8",
  });

  const respuesta = await fetch(
    `https://api.rawg.io/api/games?${parametros}`,
    {
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!respuesta.ok) {
    throw new ApiError(
      502,
      "No se pudo consultar el catálogo de videojuegos"
    );
  }

  const datos = (await respuesta.json()) as RespuestaRAWG;

  return datos.results.map((juego) => ({
    id: juego.id,
    nombre: juego.name,
    imagen: juego.background_image,
    lanzamiento: juego.released,
  }));
}
