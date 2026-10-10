import "dotenv/config";

export const env = {
  mongodbUri: process.env.MONGODB_URI,
  mongodbDb: process.env.MONGODB_DB ?? "diario_gamer",
  puerto: Number(process.env.PORT ?? 3000),
};

if (!env.mongodbUri) {
  throw new Error("Falta MONGODB_URI en el archivo .env");
}