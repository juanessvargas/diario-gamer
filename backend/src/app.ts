import express from "express";
import cors from "cors";

import { requestId } from "./middlewares/requestId";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { videojuegosRouter } from "./routes/videojuegos.routes";
import { ApiError } from "./apiError";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(requestId);
app.use(logger);

app.get("/", (_req, res) => {
  res.json({
    mensaje: "API Diario de Progreso Gamer funcionando",
  });
});

app.use("/api/videojuegos", videojuegosRouter);

app.use((_req, _res, next) => {
  next(new ApiError(404, "Ruta no encontrada"));
});

app.use(errorHandler);