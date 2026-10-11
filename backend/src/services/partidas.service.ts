
import { Partida } from "../modelos/Partida.model";
import { Videojuego } from "../modelos/Videojuego.model";
import { ApiError } from "../apiError";

// Listar todas las partidas con su videojuego.
export async function listarPartidas() {
  return Partida.find({})
    .populate("videojuego")
    .sort({ fecha: -1 });
}

// Obtener las partidas de un videojuego.
export async function listarPartidasPorVideojuego(id: string) {
  const videojuego = await Videojuego.findById(id);

  if (!videojuego) {
    throw new ApiError(404, "Videojuego no encontrado");
  }

  return Partida.find({ videojuego: id })
    .sort({ fecha: -1 });
}

// Crear una nueva partida.
export async function crearPartida(datos: {
  videojuego: string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
}) {
  const videojuego = await Videojuego.findById(datos.videojuego);

  if (!videojuego) {
    throw new ApiError(404, "El videojuego referenciado no existe");
  }

  const partida = new Partida(datos);
  return partida.save();
}

// Eliminar una partida.
export async function eliminarPartida(id: string) {
  return Partida.findByIdAndDelete(id);
}

// Calcular el resumen de un videojuego.
export async function obtenerResumenVideojuego(id: string) {
  const partidas = await listarPartidasPorVideojuego(id);

  const totalPartidas = partidas.length;

  const totalMinutos = partidas.reduce(
    (acumulado, partida) => acumulado + partida.duracionMinutos,
    0
  );

  const horasTotales = totalMinutos / 60;

  // Las partidas ya están ordenadas por fecha descendente.
  const ultimaPartida = partidas[0];

  return {
    totalPartidas,
    horasTotales,
    ultimaSesion: ultimaPartida?.fecha ?? null,
    porcentajeAvance: ultimaPartida?.porcentajeAvance ?? 0,
  };
}
