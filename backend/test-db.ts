import { pool } from "./src/db";

async function main(): Promise<void> {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    console.log("✅ Koneksi database berhasil:", result.rows[0]);
  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.error("❌ Koneksi database gagal:");
    console.error(`   code   : ${err.code ?? "-"}`);
    console.error(`   message: ${err.message ?? String(error)}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
