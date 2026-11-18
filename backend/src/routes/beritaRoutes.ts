import { Router } from "express";
import {
  createBerita,
  deleteBerita,
  getBerita,
  listBerita,
  setPublik,
  updateBerita,
} from "../controllers/beritaController";

import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

router.get("/", listBerita);
router.get("/:id", getBerita);
router.post("/", wajibLogin, createBerita);
router.put("/:id", wajibLogin, updateBerita);
router.patch("/:id/publik", wajibLogin, setPublik);
router.delete("/:id", wajibLogin, deleteBerita);

export default router;
