import mongoose from "mongoose";
import { env } from "./config/env";

export async function conectarDB() {
  try {
    await mongoose.connect(env.mongodbUri!, {
      dbName: env.mongodbDb,
    });

    console.log(`Conectado a MongoDB Atlas (base: ${env.mongodbDb})`);
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    process.exit(1);
  }
}