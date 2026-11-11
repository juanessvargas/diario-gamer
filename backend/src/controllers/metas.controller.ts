import { Request, Response, NextFunction } from "express";
import * as servicio from "../services/metas.service";

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const meta = await servicio.crearMeta(req.body);
    res.status(201).json({ meta });
  } catch (error) {
    next(error);
  }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const meta = await servicio.obtenerMeta(String(req.params.id));
    res.json({ meta });
  } catch (error) {
    next(error);
  }
}

export async function listarPorVideojuego(req: Request, res: Response, next: NextFunction) {
  try {
    const metas = await servicio.listarMetasPorVideojuego(String(req.params.id));
    res.json({ total: metas.length, metas });
  } catch (error) {
    next(error);
  }
}
