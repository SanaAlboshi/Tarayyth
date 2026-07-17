import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("خطأ في الخادم:", err);
  const message = err instanceof Error ? err.message : "خطأ غير متوقع في الخادم";
  res.status(500).json({ error: message });
}
