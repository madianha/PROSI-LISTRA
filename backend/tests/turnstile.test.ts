import { afterEach, describe, expect, it, vi } from "vitest";
import { verifikasiTurnstile } from "../src/services/turnstile";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

/** Ganti fetch dengan jawaban Cloudflare palsu, kembalikan mock-nya. */
function jawabanCloudflare(success: boolean) {
  const fetchPalsu = vi.fn().mockResolvedValue({ json: async () => ({ success }) });
  vi.stubGlobal("fetch", fetchPalsu);
  return fetchPalsu;
}

describe("verifikasiTurnstile", () => {
  it("token kosong langsung gagal tanpa menghubungi Cloudflare", async () => {
    const f = jawabanCloudflare(true);
    expect(await verifikasiTurnstile(undefined)).toBe(false);
    expect(await verifikasiTurnstile("")).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it("mengirim secret + token + ip, lalu mengikuti jawaban Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "rahasia");
    const f = jawabanCloudflare(true);
    expect(await verifikasiTurnstile("tok", "1.2.3.4")).toBe(true);

    const body = f.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("secret")).toBe("rahasia");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.2.3.4");

    jawabanCloudflare(false);
    expect(await verifikasiTurnstile("tok")).toBe(false);
  });

  it("tanpa secret di development: pakai kunci uji Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const f = jawabanCloudflare(true);
    await verifikasiTurnstile("tok");
    expect((f.mock.calls[0][1].body as URLSearchParams).get("secret")).toBe("1x0000000000000000000000000000000AA");
  });

  it("tanpa secret di production: error, bukan diam-diam memakai kunci uji", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    jawabanCloudflare(true);
    await expect(verifikasiTurnstile("tok")).rejects.toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it("Cloudflare tidak bisa dihubungi = gagal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifikasiTurnstile("tok")).toBe(false);
  });
});
