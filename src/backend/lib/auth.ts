import { Request, Response, NextFunction } from "express";

export function requireApiAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.APP_API_TOKEN;
  if (!expected) {
    res.status(500).json({ error: "APP_API_TOKEN is not configured." });
    return;
  }
  const token = req.header("x-api-token");
  if (token !== expected) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
