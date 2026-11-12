import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { pool } from "../db";

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export async function login(req: Request, res: Response): Promise<void> {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ message: "Email dan kata sandi wajib diisi." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id_anggota, nama, email, password_hash, peran, jabatan, is_aktif
       FROM anggota
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    if (!user || !user.is_aktif) {
      res.status(401).json({ message: "Email atau kata sandi salah." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: "Email atau kata sandi salah." });
      return;
    }

    const secret = process.env.JWT_SECRET || "listra_dev_secret";
    const token = signJwt(
      {
        id_anggota: user.id_anggota,
        email: user.email,
        peran: user.peran,
      },
      secret
    );

    res.status(200).json({
      token,
      user: {
        id_anggota: user.id_anggota,
        nama: user.nama,
        email: user.email,
        peran: user.peran,
        jabatan: user.jabatan,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}
