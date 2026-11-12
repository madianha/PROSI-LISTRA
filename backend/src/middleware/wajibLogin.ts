import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../controllers/authController";

/** Isi token login, tersedia di res.locals.pengguna setelah lolos wajibLogin / cekLogin. */
export interface Pengguna {
  id_anggota: number;
  email?: string;
  peran: string;
}

/** Baca header "Authorization: Bearer <token>". null bila tidak ada atau tidak sah. */
export function bacaPengguna(req: Request): Pengguna | null {
  const header = req.headers.authorization ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const payload = verifyJwt(header.slice(7));
  if (!payload || typeof payload.peran !== "string") return null;
  return payload as unknown as Pengguna;
}

/** Route ini hanya untuk yang sudah login (peran apa pun). Selain itu 401. */
export function wajibLogin(req: Request, res: Response, next: NextFunction): void {
  const pengguna = bacaPengguna(req);
  if (!pengguna) {
    res.status(401).json({ message: "Silakan login terlebih dahulu." });
    return;
  }
  res.locals.pengguna = pengguna;
  next();
}
