import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export function requestId(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const id = randomUUID();

  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);

  next();
}