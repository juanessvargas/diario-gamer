
import { Router } from "express";
import * as controller from "../controllers/videojuegos.controller";
import * as partidasController from "../controllers/partidas.controller";

export const videojuegosRouter = Router();

videojuegosRouter.get("/", controller.listar);
videojuegosRouter.post("/", controller.crear);
videojuegosRouter.patch("/:id/logros/:logroId", controller.actualizarLogro);


// Rutas anidadas de partidas y resumen.
videojuegosRouter.get("/:id/partidas", partidasController.listarPorVideojuego);
videojuegosRouter.get("/:id/resumen", partidasController.resumen);

// CRUD de videojuegos.
videojuegosRouter.get("/:id", controller.obtener);
videojuegosRouter.put("/:id", controller.actualizar);
videojuegosRouter.delete("/:id", controller.eliminar);
