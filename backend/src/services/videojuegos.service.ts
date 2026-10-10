
import { Videojuego } from "../modelos/Videojuego.model";

// Listar videojuegos con filtro opcional por estado.
export async function listarVideojuegos(estado?: string) {
  const videojuegos = await Videojuego.find({}).sort({ createdAt: -1 });

  if (estado) {
    return videojuegos.filter((videojuego) => videojuego.estado === estado);
  }

  return videojuegos;
}

// Obtener un videojuego por ID.
export async function obtenerVideojuego(id: string) {
  return Videojuego.findById(id);
}

// Crear un videojuego nuevo.
export async function crearVideojuego(datos: object) {
  const videojuego = new Videojuego(datos);
  return videojuego.save();
}

// Actualizar un videojuego.
export async function actualizarVideojuego(id: string, datos: object) {
  return Videojuego.findByIdAndUpdate(id, datos, {
    new: true,
    runValidators: true,
  });
}

// Eliminar un videojuego.
export async function eliminarVideojuego(id: string) {
  return Videojuego.findByIdAndDelete(id);
}
