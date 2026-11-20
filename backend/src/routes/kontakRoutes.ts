import { Router } from "express";
import { getKontak, simpanKontak } from "../controllers/kontakController";

import { wajibLogin } from "../middleware/wajibLogin";

const router = Router();

router.get("/", getKontak);
// buat (POST) atau ubah (PUT) kontak; keduanya membuat baris bila tabel masih kosong
router.post("/", wajibLogin, simpanKontak(201));
router.put("/", wajibLogin, simpanKontak(200));

export default router;
