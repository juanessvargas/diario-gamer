import { Router } from "express";
import * as controller from "../controllers/videojuegos.controller";

export const videojuegosRouter = Router();

videojuegosRouter.get("/", controller.listar);
videojuegosRouter.get("/:id", controller.obtener);
videojuegosRouter.post("/", controller.crear);
videojuegosRouter.put("/:id", controller.actualizar);
videojuegosRouter.delete("/:id", controller.eliminar);