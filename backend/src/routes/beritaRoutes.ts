import { Router } from "express";
import {
  createBerita,
  deleteBerita,
  getBerita,
  listBerita,
  setPublik,
  updateBerita,
} from "../controllers/beritaController";

const router = Router();

router.get("/", listBerita);
router.get("/:id", getBerita);
router.post("/", createBerita);
router.put("/:id", updateBerita);
router.patch("/:id/publik", setPublik);
router.delete("/:id", deleteBerita);

export default router;
