import { ApiError } from "../apiError";
import {
  calcularActividadSemanal,
  calcularHitos,
  calcularRachas,
  calcularSemana,
} from "../dominio/progreso";
import { Meta } from "../modelos/Meta.model";
import { Partida } from "../modelos/Partida.model";
import { Videojuego } from "../modelos/Videojuego.model";
import { obtenerResumenVideojuego } from "./partidas.service";

export async function obtenerProgresoSemanal(id: string, ahora: Date) {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new ApiError(400, "ID mal formado");
  }

  const videojuego = await Videojuego.findById(id);
  if (!videojuego) {
    throw new ApiError(404, "Videojuego no encontrado");
  }

  const videojuegoId = String(videojuego._id);
  const [partidas, metaActiva, resumen] = await Promise.all([
    Partida.find({ videojuego: videojuegoId }),
    Meta.findOne({ videojuego: videojuegoId, activa: true }),
    // No filtrar fechas ni sustituir el avance calculado por el resumen de P3.
    obtenerResumenVideojuego(videojuegoId),
  ]);

  const historial = partidas.map((partida) => ({
    videojuego: String(partida.videojuego),
    fecha: partida.fecha,
    duracionMinutos: partida.duracionMinutos,
  }));
  const meta = metaActiva ? {
    horasSemanales: metaActiva.horasSemanales,
    diasPorSemana: metaActiva.diasPorSemana,
  } : null;

  return {
    semana: calcularSemana(ahora),
    meta,
    ...calcularActividadSemanal(historial, videojuegoId, ahora, meta),
    ...calcularRachas(historial, videojuegoId, ahora),
    hitos: calcularHitos(metaActiva?.hitos ?? null, resumen.porcentajeAvance),
  };
}
