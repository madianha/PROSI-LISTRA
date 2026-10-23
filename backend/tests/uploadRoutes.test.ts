import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";

// Simpan upload test di folder sementara, bukan di backend/uploads
const tmpDir = mkdtempSync(path.join(os.tmpdir(), "listra-upload-"));
vi.stubEnv("UPLOAD_DIR", tmpDir);

const { default: app } = await import("../src/app");

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// PNG 1x1 piksel
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("POST /api/upload", () => {
  it("menyimpan gambar dan mengembalikan { location } untuk TinyMCE", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", PNG, { filename: "foto.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.location).toMatch(/^\/uploads\/[\w-]+\.png$/);
    expect(readdirSync(tmpDir)).toContain(path.basename(res.body.location));
  });

  it("gambar yang diunggah bisa dibuka lewat /uploads", async () => {
    const upload = await request(app)
      .post("/api/upload")
      .attach("file", PNG, { filename: "foto.png", contentType: "image/png" });
    const res = await request(app).get(upload.body.location);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });

  it("menolak file bukan gambar", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("file", Buffer.from("halo"), { filename: "catatan.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Gambar harus berformat JPG, PNG, WEBP, atau GIF.");
  });

  it("menolak gambar lebih dari 5 MB", async () => {
    const besar = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await request(app)
      .post("/api/upload")
      .attach("file", besar, { filename: "besar.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Ukuran gambar maksimal 5 MB.");
  });

  it("menolak request tanpa file", async () => {
    const res = await request(app).post("/api/upload");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("File gambar wajib dikirim.");
  });
});
