
import { Schema, model } from "mongoose";

// Los logros se guardan dentro de cada videojuego.
const LogroSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  obtenido: {
    type: Boolean,
    default: false,
  },
});

// Esquema principal del videojuego.
const VideojuegoSchema = new Schema({
  titulo: {
    type: String,
    required: true,
  },
  genero: {
    type: String,
    enum: [
      "accion",
      "aventura",
      "rol",
      "deportes",
      "estrategia",
      "simulacion",
      "otros",
    ],
    required: true,
  },
  plataforma: {
    type: String,
    enum: [
      "PC",
      "PlayStation",
      "Xbox",
      "Nintendo Switch",
      "Movil",
      "Otra",
    ],
    required: true,
  },
  estado: {
    type: String,
    enum: ["pendiente", "jugando", "completado", "abandonado"],
    default: "pendiente",
  },
  calificacion: {
    type: Number,
    min: 0,
    max: 10,
  },
  logros: {
    type: [LogroSchema],
    default: [],
  },
}, { timestamps: true });

export const Videojuego = model("Videojuego", VideojuegoSchema);
