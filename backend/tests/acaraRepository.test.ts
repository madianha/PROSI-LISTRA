import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/db", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

import { pool } from "../src/db";
import { cancelAcara, listAcara, listJadwalPublik, updateAcara } from "../src/repositories/acaraRepository";

const mockedPool = vi.mocked(pool);

function buatClient(queryImpl: (...args: any[]) => any) {
  return {
    query: vi.fn(queryImpl),
    release: vi.fn(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockedPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);
});

describe("acaraRepository soft-delete & visibilitas", () => {
  it("cancelAcara melakukan UPDATE status = 'dibatalkan' tanpa DELETE FROM acara", async () => {
    const rowBatal = {
      id_acara: 5,
      tipe_acara: "listra",
      nama_acara: "Latihan Gabungan",
      nama_klien: null,
      lokasi: "Studio",
      is_privat: false,
      status: "dibatalkan",
      alasan_batal: "Hujan deras",
      cancelled_at: new Date("2026-11-28T05:00:00.000Z"),
      acara_pj: [],
      acara_jasa: [],
    };
    const client = buatClient((sql: string) => {
      if (sql.startsWith("SELECT status FROM acara")) return { rows: [{ status: "aktif" }], rowCount: 1 };
      if (sql.includes("FROM acara a")) return { rows: [rowBatal], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    });
    mockedPool.connect.mockResolvedValue(client as any);

    const hasil = await cancelAcara(5, "Hujan deras");

    expect(hasil.status).toBe("ok");
    if (hasil.status === "ok") {
      expect(hasil.acara.status).toBe("dibatalkan");
      expect(hasil.acara.alasan_batal).toBe("Hujan deras");
      expect(hasil.acara.cancelled_at).toBe("2026-11-28T05:00:00.000Z");
    }
    const queries = client.query.mock.calls.map(([sql]) => String(sql));
    expect(queries.some((q) => /DELETE FROM acara\b/i.test(q))).toBe(false);
    expect(queries.some((q) => /UPDATE acara[\s\S]*status = 'dibatalkan'[\s\S]*cancelled_at = NOW\(\)/i.test(q))).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });

  it("cancelAcara menolak event yang sudah dibatalkan", async () => {
    const client = buatClient((sql: string) => {
      if (sql.startsWith("SELECT status FROM acara")) return { rows: [{ status: "dibatalkan" }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    mockedPool.connect.mockResolvedValue(client as any);

    const hasil = await cancelAcara(5, null);

    expect(hasil).toEqual({ status: "already_cancelled" });
    const queries = client.query.mock.calls.map(([sql]) => String(sql));
    expect(queries.some((q) => /UPDATE acara/i.test(q))).toBe(false);
  });

  it("updateAcara menolak perubahan pada event yang sudah dibatalkan", async () => {
    const client = buatClient((sql: string) => {
      if (sql.startsWith("SELECT status FROM acara")) return { rows: [{ status: "dibatalkan" }], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });
    mockedPool.connect.mockResolvedValue(client as any);

    const hasil = await updateAcara(5, {
      tipe_acara: "listra",
      nama_acara: "Ubah",
      nama_klien: null,
      lokasi: null,
      is_privat: false,
      acara_pj: [],
      acara_jasa: [],
    });

    expect(hasil).toEqual({ status: "cancelled" });
    const queries = client.query.mock.calls.map(([sql]) => String(sql));
    expect(queries.some((q) => /UPDATE acara/i.test(q))).toBe(false);
  });

  it("listJadwalPublik mengecualikan event dibatalkan, sedangkan listAcara internal tetap menyertakannya", async () => {
    await listJadwalPublik({ dari: "2026-11-01", sampai: "2026-11-30" });
    const sqlPublik = String(mockedPool.query.mock.calls.at(-1)?.[0]);
    expect(sqlPublik).toMatch(/a\.status <> 'dibatalkan'/);

    await listAcara({ dari: "2026-11-01", sampai: "2026-11-30" });
    const sqlInternal = String(mockedPool.query.mock.calls.at(-1)?.[0]);
    expect(sqlInternal).not.toMatch(/status <> 'dibatalkan'/);
  });
});
