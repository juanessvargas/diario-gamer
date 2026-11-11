import { Meta } from "../modelos/Meta.model";
import { Videojuego } from "../modelos/Videojuego.model";
import { ApiError } from "../apiError";

interface DatosHito {
  descripcion: string;
  porcentajeObjetivo: number;
}

interface DatosMeta {
  videojuego: string;
  horasSemanales: number;
  diasPorSemana: number;
  hitos: DatosHito[];
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function validarId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new ApiError(400, "ID mal formado");
  }
}

// Validar el contrato antes de que Mongoose pueda convertir cadenas a números.
function validarCreacion(datos: unknown): DatosMeta {
  if (!esObjeto(datos)) {
    throw new ApiError(400, "El cuerpo de la meta debe ser un objeto");
  }

  validarId(datos.videojuego);

  const { horasSemanales, diasPorSemana } = datos;
  if (typeof horasSemanales !== "number" || !Number.isFinite(horasSemanales)
      || horasSemanales <= 0 || horasSemanales > 100) {
    throw new ApiError(400, "Las horas semanales deben ser mayores que 0 y como máximo 100");
  }

  if (typeof diasPorSemana !== "number" || !Number.isInteger(diasPorSemana)
      || diasPorSemana < 1 || diasPorSemana > 7) {
    throw new ApiError(400, "Los días por semana deben ser un entero entre 1 y 7");
  }

  const entradaHitos = datos.hitos === undefined ? [] : datos.hitos;
  if (!Array.isArray(entradaHitos) || entradaHitos.length > 5) {
    throw new ApiError(400, "Los hitos deben ser una lista de hasta cinco elementos");
  }

  const hitos = entradaHitos.map((hito: unknown): DatosHito => {
    if (!esObjeto(hito) || typeof hito.descripcion !== "string"
        || hito.descripcion.trim().length === 0) {
      throw new ApiError(400, "Cada hito necesita una descripción no vacía");
    }

    const objetivo = hito.porcentajeObjetivo;
    if (typeof objetivo !== "number" || !Number.isFinite(objetivo)
        || objetivo < 1 || objetivo > 100) {
      throw new ApiError(400, "El objetivo de cada hito debe estar entre 1 y 100");
    }

    return { descripcion: hito.descripcion.trim(), porcentajeObjetivo: objetivo };
  });

  return { videojuego: datos.videojuego, horasSemanales, diasPorSemana, hitos };
}

function esConflictoMetaActiva(error: unknown): boolean {
  if (!esObjeto(error) || error.code !== 11000 || !esObjeto(error.keyPattern)) {
    return false;
  }

  return Object.keys(error.keyPattern).length === 1 && error.keyPattern.videojuego === 1;
}

export async function crearMeta(entrada: unknown) {
  const datos = validarCreacion(entrada);
  const videojuego = await Videojuego.findById(datos.videojuego);

  if (!videojuego) {
    throw new ApiError(404, "El videojuego referenciado no existe");
  }

  const existente = await Meta.findOne({ videojuego: datos.videojuego, activa: true });
  if (existente) {
    throw new ApiError(409, "Este videojuego ya tiene una meta activa");
  }

  try {
    // El índice parcial es la defensa ante carreras entre comprobar y guardar.
    const meta = new Meta({ ...datos, activa: true });
    return await meta.save();
  } catch (error) {
    if (esConflictoMetaActiva(error)) {
      throw new ApiError(409, "Este videojuego ya tiene una meta activa");
    }
    throw error;
  }
}

export async function obtenerMeta(id: string) {
  validarId(id);
  const meta = await Meta.findById(id);

  if (!meta) {
    throw new ApiError(404, "Meta no encontrada");
  }

  return meta;
}

export async function listarMetasPorVideojuego(id: string) {
  validarId(id);
  const videojuego = await Videojuego.findById(id);

  if (!videojuego) {
    throw new ApiError(404, "Videojuego no encontrado");
  }

  return Meta.find({ videojuego: id }).sort({ createdAt: -1, _id: -1 });
}
