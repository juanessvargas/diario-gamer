import { Router } from "express";
import * as controller from "../controllers/metas.controller";

export const metasRouter = Router();

metasRouter.post("/", controller.crear);
metasRouter.get("/:id", controller.obtener);
