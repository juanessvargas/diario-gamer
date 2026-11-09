
import { Request, Response, NextFunction } from "express";
import * as servicio from "../services/partidas.service";
import { ApiError } from "../apiError";

// GET /api/partidas
export async function listar(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partidas = await servicio.listarPartidas();
    res.json({ total: partidas.length, partidas });
  } catch (error) {
    next(error);
  }
}

// POST /api/partidas
export async function crear(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partida = await servicio.crearPartida(req.body);
    res.status(201).json({ partida });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/partidas/:id
export async function eliminar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partida = await servicio.eliminarPartida(
      String(req.params.id)
    );

    if (!partida) {
      throw new ApiError(404, "Partida no encontrada");
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// GET /api/videojuegos/:id/partidas
export async function listarPorVideojuego(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partidas = await servicio.listarPartidasPorVideojuego(
      String(req.params.id)
    );

    res.json({ total: partidas.length, partidas });
  } catch (error) {
    next(error);
  }
}

// GET /api/videojuegos/:id/resumen
export async function resumen(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const resumen = await servicio.obtenerResumenVideojuego(
      String(req.params.id)
    );

    res.json({ resumen });
  } catch (error) {
    next(error);
  }
}
