import { Router } from "express";
import { getKontak, updateKontak } from "../controllers/kontakController";

const router = Router();

router.get("/", getKontak);
router.put("/", updateKontak);

export default router;
