import { Router } from "express";
import {
  createJasa,
  getJasaDetail,
  listJasa,
  listProvinsi,
  toggleStatusJasa,
  updateJasa,
} from "../controllers/jasaController";

const router = Router();

router.get("/provinsi", listProvinsi);
router.get("/", listJasa);
router.get("/:id", getJasaDetail);
router.post("/", createJasa);
router.put("/:id", updateJasa);
router.patch("/:id/status", toggleStatusJasa);

export default router;
