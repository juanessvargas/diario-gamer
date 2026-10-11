
import { Videojuego } from "../modelos/Videojuego.model";
import { Partida } from "../modelos/Partida.model";
import { ApiError } from "../apiError";

// 1. Listar videojuegos con filtro opcional por estado.
export async function listarVideojuegos(estado?: string) {
  if (estado) {
    const filtro = { estado: estado };
    return Videojuego.find().where("estado").equals(filtro.estado)
      .sort({ createdAt: -1 });
  }

  return Videojuego.find({}).sort({ createdAt: -1 });
}

// 2. Obtener un videojuego por ID.
export async function obtenerVideojuego(id: string) {
  return Videojuego.findById(id);
}

// 3. Crear un videojuego nuevo.
export async function crearVideojuego(datos: object) {
  const videojuego = new Videojuego(datos);
  return videojuego.save();
}

// 4. Actualizar un videojuego.
export async function actualizarVideojuego(
  id: string,
  datos: object
) {
  return Videojuego.findByIdAndUpdate(id, datos, {
    new: true,
    runValidators: true,
  });
}

// 5. Eliminar un videojuego y sus partidas relacionadas.
export async function eliminarVideojuego(id: string) {
  const videojuego = await Videojuego.findById(id);

  if (!videojuego) {
    return null;
  }

  await Partida.deleteMany({ videojuego: id });
  await videojuego.deleteOne();

  return videojuego;
}

// 6. Marcar un logro como obtenido o pendiente.
export async function actualizarLogro(
  videojuegoId: string,
  logroId: string,
  obtenido: boolean
) {
  const videojuego = await Videojuego.findById(videojuegoId);

  if (!videojuego) {
    throw new ApiError(404, "Videojuego no encontrado");
  }

  const logro = videojuego.logros.find(
    (logro) => String(logro._id) === logroId
  );

  if (!logro) {
    throw new ApiError(404, "Logro no encontrado");
  }

  logro.obtenido = obtenido;

  await videojuego.save();

  return videojuego;
}
