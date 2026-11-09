
import { Router } from "express";
import * as controller from "../controllers/partidas.controller";

export const partidasRouter = Router();

partidasRouter.get("/", controller.listar);
partidasRouter.post("/", controller.crear);
partidasRouter.delete("/:id", controller.eliminar);
