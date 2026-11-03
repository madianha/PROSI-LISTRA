import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { EKSTENSI_GAMBAR, saveImage } from "../storage/uploadStorage";

export const MAKS_UKURAN_GAMBAR = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAKS_UKURAN_GAMBAR },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in EKSTENSI_GAMBAR) cb(null, true);
    else cb(new Error("TIPE_TIDAK_DIDUKUNG"));
  },
});

const router = Router();

/**
 * POST /api/upload, field "file".
 * Balasan { location } adalah format yang diharapkan TinyMCE.
 */
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Ukuran gambar maksimal 5 MB." });
        return;
      }
      if (err) {
        res.status(400).json({ message: "Gambar harus berformat JPG, PNG, WEBP, atau GIF." });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ message: "File gambar wajib dikirim." });
      return;
    }
    try {
      const location = await saveImage(req.file.buffer, req.file.mimetype);
      res.status(201).json({ location });
    } catch (error) {
      console.error("Gagal menyimpan gambar:", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
  },
);

export default router;
