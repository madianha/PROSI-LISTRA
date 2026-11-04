import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepo from "../repositories/authRepository";

const JWT_SECRET = process.env.JWT_SECRET || "listra-secret-key-prosi-2026";
const JWT_EXPIRES_IN = "7d";

export interface AuthJwtPayload {
  id_anggota: number;
  email: string | null;
  nama: string;
  peran: string;
}

/**
 * POST /api/auth/login
 * Validasi email & password, status keaktifan, dan buat JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ success: false, message: "Email wajib diisi." });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).json({ success: false, message: "Kata sandi wajib diisi." });
    return;
  }

  try {
    const user = await authRepo.findAnggotaByEmail(email.trim());
    if (!user) {
      res.status(401).json({ success: false, message: "Email atau kata sandi tidak valid." });
      return;
    }

    if (!user.is_aktif) {
      res.status(403).json({
        success: false,
        message: "Akun Anda berstatus non-aktif. Hubungi pengurus sanggar.",
      });
      return;
    }

    if (!user.password_hash) {
      res.status(401).json({ success: false, message: "Kata sandi belum diatur untuk akun ini." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Email atau kata sandi tidak valid." });
      return;
    }

    const tokenPayload: AuthJwtPayload = {
      id_anggota: user.id_anggota,
      email: user.email,
      nama: user.nama,
      peran: user.peran,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      token,
      user: {
        id_anggota: user.id_anggota,
        nama: user.nama,
        email: user.email,
        peran: user.peran,
        jabatan: user.jabatan,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
}

/**
 * GET /api/auth/me
 * Mendapatkan profil pengguna yang sedang login berdasarkan token
 */
export async function me(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token tidak disertakan." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
    const user = await authRepo.findAnggotaById(decoded.id_anggota);

    if (!user) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan atau non-aktif." });
      return;
    }

    res.json({
      success: true,
      user: {
        id_anggota: user.id_anggota,
        nama: user.nama,
        email: user.email,
        peran: user.peran,
        jabatan: user.jabatan,
      },
    });
  } catch {
    res.status(401).json({ success: false, message: "Token tidak valid atau telah kedaluwarsa." });
  }
}

/**
 * POST /api/auth/logout
 * Menghapus/mengakui logout sesi
 */
export function logout(_req: Request, res: Response): void {
  res.json({ success: true, message: "Berhasil keluar." });
}