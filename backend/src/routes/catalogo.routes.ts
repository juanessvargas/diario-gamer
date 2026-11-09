
import { Router } from "express";
import * as controller from "../controllers/catalogo.controller";

export const catalogoRouter = Router();

catalogoRouter.get("/", controller.buscar);
