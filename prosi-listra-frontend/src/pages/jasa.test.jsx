import { fireEvent, screen } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRoute } from "../test/renderRoute";

vi.mock("../api/jasa", () => ({ listJasa: vi.fn() }));

import Katalog from "./jasa";
import { listJasa } from "../api/jasa";

const jasa = (id, nama, ubah) => ({
  id_jasa: id,
  tipe_jasa: "tari",
  nama,
  deskripsi: null,
  id_provinsi: 13,
  nama_provinsi: "Jawa Barat",
  pulau: "Jawa",
  durasi: 10,
  harga_minimum: 1000000,
  harga_maximum: 2000000,
  min_performer: 2,
  link_media: null,
  link_image: null,
  is_aktif: true,
  kecocokan: ["Opening"],
  ...ubah,
});

const daftar = [
  jasa(1, "Tari Merak", { kecocokan: ["Opening", "Closing"] }),
  jasa(2, "Tari Saman", { id_provinsi: 1, nama_provinsi: "Aceh", pulau: "Sumatera", kecocokan: ["Middle"] }),
  jasa(3, "Gamelan Degung", { tipe_jasa: "musik", id_provinsi: null, nama_provinsi: null, pulau: null, kecocokan: ["Closing"] }),
];

const centang = (label) => fireEvent.click(screen.getByRole("checkbox", { name: new RegExp(`^${label}`) }));

beforeEach(() => {
  vi.resetAllMocks();
  listJasa.mockResolvedValue(daftar);
});

describe("Katalog Jasa publik", () => {
  it("meminta jasa tanpa include_inactive (hanya yang aktif)", async () => {
    renderRoute(Katalog);
    expect(await screen.findByText("Tari Merak")).toBeTruthy();
    expect(listJasa).toHaveBeenCalledWith();
  });

  it("jasa dengan beberapa posisi pentas ikut tersaring di tiap posisinya", async () => {
    renderRoute(Katalog);
    await screen.findByText("Tari Merak");

    centang("Closing");

    expect(screen.getByText("Tari Merak")).toBeTruthy();
    expect(screen.getByText("Gamelan Degung")).toBeTruthy();
    expect(screen.queryByText("Tari Saman")).toBeNull();
  });

  it("filter Kultur memakai pulau dari tabel provinsi", async () => {
    renderRoute(Katalog);
    await screen.findByText("Tari Merak");

    centang("Sumatera");

    expect(screen.getByText("Tari Saman")).toBeTruthy();
    expect(screen.queryByText("Tari Merak")).toBeNull();
  });

  it("kartu menampilkan nama provinsi dan semua posisi pentas", async () => {
    renderRoute(Katalog);
    await screen.findByText("Tari Merak");
    expect(screen.getByText("Opening, Closing")).toBeTruthy();
    expect(screen.getByText("Aceh")).toBeTruthy();
  });
});
