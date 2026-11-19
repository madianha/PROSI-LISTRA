import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { pool } from "../db";
import { getAnggotaById } from "../repositories/anggotaRepository";

export function signJwt(payload: Record<string, unknown>, secret: string): string {
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

/** Cek token buatan signJwt. Hasilnya isi token, atau null bila tanda tangan salah / kedaluwarsa. */
export function verifyJwt(token: string): Record<string, unknown> | null {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;
  const secret = process.env.JWT_SECRET || "listra_dev_secret";
  const expected = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
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

const MIN_PANJANG_PASSWORD = 8; // sama dengan aturan kata sandi di anggotaController

/** GET /api/auth/me: data anggota yang sedang login (id dari token, tanpa hash kata sandi). */
export async function me(_req: Request, res: Response): Promise<void> {
  try {
    const anggota = await getAnggotaById(res.locals.pengguna.id_anggota);
    if (!anggota) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    res.status(200).json(anggota);
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}

/** PUT /api/auth/change-password: ganti kata sandi akun yang sedang login. */
export async function changePassword(req: Request, res: Response): Promise<void> {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const lama = str(req.body?.kata_sandi_lama);
  const baru = str(req.body?.kata_sandi_baru);
  const konfirmasi = str(req.body?.konfirmasi_kata_sandi);

  if (!lama || !baru || !konfirmasi) {
    res.status(400).json({ message: "Semua kolom kata sandi wajib diisi." });
    return;
  }
  if (baru.length < MIN_PANJANG_PASSWORD) {
    res.status(400).json({ message: `Kata sandi baru minimal ${MIN_PANJANG_PASSWORD} karakter.` });
    return;
  }
  if (baru !== konfirmasi) {
    res.status(400).json({ message: "Konfirmasi kata sandi tidak sesuai." });
    return;
  }

  try {
    const id = res.locals.pengguna.id_anggota;
    const result = await pool.query(
      "SELECT password_hash FROM anggota WHERE id_anggota = $1 AND is_aktif = TRUE",
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (!(await bcrypt.compare(lama, row.password_hash))) {
      res.status(400).json({ message: "Kata sandi lama tidak sesuai." });
      return;
    }
    if (baru === lama) {
      res.status(400).json({ message: "Kata sandi baru tidak boleh sama dengan kata sandi lama." });
      return;
    }
    const hash = await bcrypt.hash(baru, 10);
    await pool.query("UPDATE anggota SET password_hash = $1 WHERE id_anggota = $2", [hash, id]);
    res.status(200).json({ message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}