import { Router } from "express";
import {
  createAnggota,
  getAnggotaDetail,
  getSpesialisasiList,
  listAnggota,
  toggleStatusAktif,
  updateAnggota,
} from "../controllers/anggotaController";

const router = Router();

router.get("/spesialisasi", getSpesialisasiList);
router.get("/", listAnggota);
router.get("/:id", getAnggotaDetail);
router.post("/", createAnggota);
router.put("/:id", updateAnggota);
router.patch("/:id/status", toggleStatusAktif);

export default router;
