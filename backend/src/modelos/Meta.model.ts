import { Schema, model } from "mongoose";

const HitoSchema = new Schema({
  descripcion: {
    type: String,
    required: true,
    trim: true,
  },
  porcentajeObjetivo: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    validate: {
      validator: Number.isFinite,
      message: "El objetivo del hito debe ser un número finito",
    },
  },
});

const MetaSchema = new Schema({
  videojuego: {
    type: Schema.Types.ObjectId,
    ref: "Videojuego",
    required: true,
  },
  horasSemanales: {
    type: Number,
    required: true,
    max: 100,
    validate: {
      validator: (valor: number) => Number.isFinite(valor) && valor > 0,
      message: "Las horas semanales deben ser mayores que cero y finitas",
    },
  },
  diasPorSemana: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
    validate: {
      validator: Number.isInteger,
      message: "Los días por semana deben ser un número entero",
    },
  },
  activa: {
    type: Boolean,
    default: true,
  },
  hitos: {
    type: [HitoSchema],
    default: [],
    validate: {
      validator: (hitos: unknown[]) => Array.isArray(hitos) && hitos.length <= 5,
      message: "Una meta admite como máximo cinco hitos",
    },
  },
}, { timestamps: true });

MetaSchema.index(
  { videojuego: 1 },
  {
    unique: true,
    partialFilterExpression: { activa: true },
    name: "meta_activa_por_videojuego",
  }
);

export const Meta = model("Meta", MetaSchema);
