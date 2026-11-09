
import express from "express";
import cors from "cors";

import { videojuegosRouter } from "./routes/videojuegos.routes";
import { partidasRouter } from "./routes/partidas.routes";
import { catalogoRouter } from "./routes/catalogo.routes";

import { requestId } from "./middlewares/requestId";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
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
app.use("/api/partidas", partidasRouter);
app.use("/api/catalogo", catalogoRouter);

app.use((_req, _res, next) => {
  next(new ApiError(404, "Ruta no encontrada"));
});

app.use(errorHandler);
