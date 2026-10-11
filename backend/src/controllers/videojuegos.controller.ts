
import { Request, Response, NextFunction } from "express";
import * as servicio from "../services/videojuegos.service";
import { ApiError } from "../apiError";

// GET /api/videojuegos
export async function listar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const estado = req.query.estado;

    if (estado !== undefined && typeof estado !== "string") {
      throw new ApiError(400, "Filtro estado no válido");
    }

    const videojuegos = await servicio.listarVideojuegos(estado);
    res.json({ total: videojuegos.length, videojuegos });
  } catch (error) {
    next(error);
  }
}

// GET /api/videojuegos/:id
export async function obtener(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const videojuego = await servicio.obtenerVideojuego(
      String(req.params.id)
    );

    if (!videojuego) {
      throw new ApiError(404, "Videojuego no encontrado");
    }

    res.json({ videojuego });
  } catch (error) {
    next(error);
  }
}

// POST /api/videojuegos
export async function crear(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const videojuego = await servicio.crearVideojuego(req.body);
    res.status(201).json({ videojuego });
  } catch (error) {
    next(error);
  }
}

// PUT /api/videojuegos/:id
export async function actualizar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const videojuego = await servicio.actualizarVideojuego(
      String(req.params.id),
      req.body
    );

    if (!videojuego) {
      throw new ApiError(404, "Videojuego no encontrado");
    }

    res.json({ videojuego });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/videojuegos/:id
export async function eliminar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const videojuego = await servicio.eliminarVideojuego(
      String(req.params.id)
    );

    if (!videojuego) {
      throw new ApiError(404, "Videojuego no encontrado");
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// PATCH /api/videojuegos/:id/logros/:logroId
export async function actualizarLogro(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (typeof req.body.obtenido !== "boolean") {
      throw new ApiError(400, "El campo obtenido debe ser booleano");
    }

    const videojuego = await servicio.actualizarLogro(
      String(req.params.id),
      String(req.params.logroId),
      req.body.obtenido
    );

    res.json({ videojuego });
  } catch (error) {
    next(error);
  }
}
