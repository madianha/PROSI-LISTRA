import app from "./app";
import { ensureJasaSchema } from "./repositories/jasaRepository";

const PORT = Number(process.env.PORT ?? 3001);

ensureJasaSchema().catch((err) => {
  console.warn("Peringatan: gagal memastikan kolom tambahan pada tabel jasa:", err?.message ?? err);
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
