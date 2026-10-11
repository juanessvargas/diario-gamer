
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { buscarJuegosRAWG } from "../services/rawg.service";

export async function buscar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const busqueda = String(req.query.buscar ?? "");

    const juegos = await buscarJuegosRAWG(busqueda);

    res.json({ juegos });
  } catch (error) {
    next(error);
  }
}
