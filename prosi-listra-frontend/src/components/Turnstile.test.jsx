import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import Turnstile from "./Turnstile";

afterEach(() => {
  delete window.turnstile;
});

/** window.turnstile palsu; menyimpan opsi render supaya test bisa memanggil callback-nya. */
function turnstilePalsu() {
  const palsu = { render: vi.fn(() => "w1"), reset: vi.fn(), remove: vi.fn() };
  window.turnstile = palsu;
  return palsu;
}

describe("Turnstile", () => {
  it("memakai kunci uji Cloudflare bila VITE_TURNSTILE_SITE_KEY kosong, dan meneruskan token", async () => {
    const palsu = turnstilePalsu();
    const onToken = vi.fn();
    render(() => <Turnstile onToken={onToken} />);

    await vi.waitFor(() => expect(palsu.render).toHaveBeenCalled());
    const opsi = palsu.render.mock.calls[0][1];
    expect(opsi.sitekey).toBe("1x00000000000000000000AA");

    opsi.callback("tok");
    expect(onToken).toHaveBeenLastCalledWith("tok");
    opsi["expired-callback"]();
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("reset mengosongkan token dan meminta centang ulang; widget dilepas saat ditutup", async () => {
    const palsu = turnstilePalsu();
    const onToken = vi.fn();
    let kontrol;
    const { unmount } = render(() => <Turnstile onToken={onToken} ref={(r) => (kontrol = r)} />);

    await vi.waitFor(() => expect(kontrol).toBeTruthy());
    kontrol.reset();
    expect(onToken).toHaveBeenLastCalledWith(null);
    expect(palsu.reset).toHaveBeenCalledWith("w1");

    unmount();
    expect(palsu.remove).toHaveBeenCalledWith("w1");
  });
});
