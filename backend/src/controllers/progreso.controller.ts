import { Request, Response, NextFunction } from "express";
import { obtenerProgresoSemanal } from "../services/progreso.service";

export async function obtener(req: Request, res: Response, next: NextFunction) {
  // Capturar un único instante para todos los cálculos de esta solicitud.
  const ahora = new Date();

  try {
    const progreso = await obtenerProgresoSemanal(String(req.params.id), ahora);
    res.json({ progreso });
  } catch (error) {
    next(error);
  }
}
