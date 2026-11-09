import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiError } from "../apiError";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = res.locals.requestId;

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: error.message,
      requestId,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: "Error de validación",
      detalle: error.message,
      requestId,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: "ID mal formado",
      requestId,
    });
  }

  console.error("Error inesperado:", error);

  return res.status(500).json({
    error: "Error interno del servidor",
    requestId,
  });
}