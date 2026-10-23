import { A, useNavigate, useParams } from "@solidjs/router";
import { createResource, createSignal, Match, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { faArrowLeft, faFileLines, faImage, faLink } from "@fortawesome/free-solid-svg-icons";
import Icon from "../../components/Icon";
import RichTextEditor from "../../components/internal/RichTextEditor";
import Toggle from "../../components/internal/Toggle";
import { createBerita, getBerita, updateBerita, uploadGambar } from "../../api/berita";
import { hariIni, jenisBerita, toPayload, validateBeritaForm } from "../../utils/berita";

const INPUT =
  "w-full rounded-lg border border-[#e3d6d3] bg-white px-3 py-2 text-sm text-[#302929] focus:border-[#39000a] focus:outline-none focus:ring-1 focus:ring-[#39000a]";

/** Label + input + pesan error di bawahnya. */
function Kolom(props) {
  return (
    <div>
      <label for={props.for} className="mb-1.5 block text-sm font-medium text-[#302929]">
        {props.label}
      </label>
      {props.children}
      <Show when={props.error}>
        <p className="mt-1 text-xs text-red-700">{props.error}</p>
      </Show>
    </div>
  );
}

/** Pilihan Artikel / Tautan, hanya muncul saat membuat berita baru. */
function PilihJenis(props) {
  const tombol = (nilai, label, icon) => (
    <button
      type="button"
      aria-pressed={props.value === nilai}
      onClick={() => props.onChange(nilai)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
        props.value === nilai ? "bg-[#39000a] text-white" : "text-[#685856] hover:text-[#302929]"
      }`}
    >
      <Icon icon={icon} class="text-xs" /> {label}
    </button>
  );

  return (
    <div className="flex gap-1 rounded-lg border border-[#e3d6d3] bg-white p-1 sm:max-w-sm">
      {tombol("artikel", "Artikel", faFileLines)}
      {tombol("tautan", "Tautan", faLink)}
    </div>
  );
}

function FormBerita(props) {
  const navigate = useNavigate();
  const b = props.berita;

  const [jenis, setJenis] = createSignal(b ? jenisBerita(b) : "artikel");
  // hanya dipakai saat membuat berita baru; mulai mati (draf)
  const [publik, setPublikForm] = createSignal(false);
  const [values, setValues] = createStore({
    judul: b?.judul ?? "",
    tanggal: b?.tanggal ?? hariIni(),
    url_gambar: b?.url_gambar ?? "",
    konten: b?.konten ?? "",
    sumber: b?.sumber ?? "",
    url_artikel: b?.url_artikel ?? "",
  });
  const [errors, setErrors] = createSignal({});
  const [mengunggah, setMengunggah] = createSignal(false);
  const [menyimpan, setMenyimpan] = createSignal(false);
  const [pesanError, setPesanError] = createSignal("");
  let editor; // { ambilKonten } dari RichTextEditor

  const pilihGambar = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;
    setMengunggah(true);
    setErrors((prev) => ({ ...prev, url_gambar: undefined }));
    try {
      setValues("url_gambar", await uploadGambar(file));
    } catch (error) {
      setErrors((prev) => ({ ...prev, url_gambar: error.message }));
    } finally {
      setMengunggah(false);
    }
  };

  const simpan = async (e) => {
    e.preventDefault();
    setPesanError("");
    if (jenis() === "artikel" && editor) {
      try {
        setValues("konten", await editor.ambilKonten());
      } catch {
        setPesanError("Ada gambar di konten yang gagal diunggah. Hapus atau unggah ulang gambar itu.");
        return;
      }
    }
    const hasil = validateBeritaForm(values, jenis());
    setErrors(hasil);
    if (Object.keys(hasil).length > 0) return;

    setMenyimpan(true);
    try {
      const data = toPayload(values, jenis());
      if (b) await updateBerita(b.id_berita, data);
      else await createBerita({ ...data, is_publik: publik() });
      navigate("/internal/berita");
    } catch (error) {
      setPesanError(error.message);
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <form onSubmit={simpan} noValidate className="mt-6 flex flex-col gap-6">
      <Show when={!b}>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e3d6d3] bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#302929]">Publik</p>
            <p className="mt-0.5 text-xs text-[#685856]">
              {publik()
                ? "Langsung tampil di halaman Berita setelah disimpan."
                : "Disimpan sebagai draf, belum tampil di halaman Berita."}
            </p>
          </div>
          <Toggle label="Publik" checked={publik()} onChange={setPublikForm} />
        </div>
      </Show>

      <Show when={!b}>
        <div>
          <p className="mb-1.5 text-sm font-medium text-[#302929]">Jenis</p>
          <PilihJenis value={jenis()} onChange={setJenis} />
          <p className="mt-1.5 text-xs text-[#685856]">
            {jenis() === "artikel"
              ? "Ditulis di sini dan dibaca langsung di website LISTRA."
              : "Mengarahkan pengunjung ke berita di media lain, mis. unpar.ac.id."}
          </p>
        </div>
      </Show>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_200px]">
        <Kolom label="Judul" for="judul" error={errors().judul}>
          <input
            id="judul"
            type="text"
            maxLength={255}
            value={values.judul}
            onInput={(e) => setValues("judul", e.currentTarget.value)}
            className={INPUT}
          />
        </Kolom>
        <Kolom label="Tanggal" for="tanggal" error={errors().tanggal}>
          <input
            id="tanggal"
            type="date"
            value={values.tanggal}
            onInput={(e) => setValues("tanggal", e.currentTarget.value)}
            className={INPUT}
          />
        </Kolom>
      </div>

      <Kolom label="Gambar sampul" for="sampul" error={errors().url_gambar}>
        <div className="flex flex-wrap items-center gap-4">
          <Show when={values.url_gambar}>
            <img
              src={values.url_gambar}
              alt="Pratinjau sampul"
              className="aspect-[16/10] w-48 rounded-lg border border-[#f0dedf] object-cover"
            />
          </Show>
          {/* input file disembunyikan (sr-only), diklik lewat label yang terlihat seperti tombol */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#e3d6d3] bg-white px-4 py-2 text-sm font-semibold text-[#54141d] hover:bg-[#fff7f6]">
            <Icon icon={faImage} class="text-xs" />
            {mengunggah() ? "Mengunggah..." : values.url_gambar ? "Ganti gambar" : "Pilih gambar"}
            <input
              id="sampul"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={mengunggah()}
              onChange={pilihGambar}
              className="sr-only"
            />
          </label>
          <span className="text-xs text-[#685856]">JPG, PNG, WEBP, atau GIF. Maks 5 MB.</span>
        </div>
      </Kolom>

      <Switch>
        <Match when={jenis() === "artikel"}>
          <Kolom label="Konten" for="konten" error={errors().konten}>
            <div className="overflow-hidden rounded-lg border border-[#e3d6d3]">
              <RichTextEditor
                ref={(api) => (editor = api)}
                value={values.konten}
                onChange={(html) => setValues("konten", html)}
              />
            </div>
          </Kolom>
        </Match>
        <Match when={jenis() === "tautan"}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
            <Kolom label="Sumber" for="sumber" error={errors().sumber}>
              <input
                id="sumber"
                type="text"
                maxLength={255}
                placeholder="unpar.ac.id"
                value={values.sumber}
                onInput={(e) => setValues("sumber", e.currentTarget.value)}
                className={INPUT}
              />
            </Kolom>
            <Kolom label="URL artikel" for="url_artikel" error={errors().url_artikel}>
              <input
                id="url_artikel"
                type="url"
                placeholder="https://"
                value={values.url_artikel}
                onInput={(e) => setValues("url_artikel", e.currentTarget.value)}
                className={INPUT}
              />
            </Kolom>
          </div>
        </Match>
      </Switch>

      <Show when={pesanError()}>
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {pesanError()}
        </p>
      </Show>

      <div className="flex justify-end gap-3 border-t border-[#f0dedf] pt-5">
        <A href="/internal/berita" className="rounded-lg px-4 py-2 text-sm font-semibold text-[#685856] hover:bg-white">
          Batal
        </A>
        <button
          type="submit"
          disabled={menyimpan() || mengunggah()}
          className="rounded-lg bg-[#39000a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5a0c1a] disabled:opacity-60"
        >
          {menyimpan() ? "Menyimpan..." : b ? "Simpan perubahan" : publik() ? "Terbitkan" : "Simpan draf"}
        </button>
      </div>
    </form>
  );
}

/** Berita Baru (/internal/berita/baru) dan Ubah Berita (/internal/berita/:id/ubah). */
export default function InternalBeritaForm() {
  const params = useParams();
  // hanya mengambil data saat mode ubah (params.id ada)
  // semua: true agar draf juga bisa dibuka untuk diubah
  const [berita] = createResource(() => params.id, (id) => getBerita(id, { semua: true }));

  return (
    <div className="mx-auto max-w-3xl">
      <Show when={params.id}>
        <A
          href="/internal/berita"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#54141d] hover:underline"
        >
          <Icon icon={faArrowLeft} class="text-xs" /> Kelola Berita
        </A>
      </Show>
      <h1 className="font-serif text-2xl font-bold text-[#39000a]">
        {params.id ? "Ubah Berita" : "Berita Baru"}
      </h1>

      <Switch>
        <Match when={!params.id}>
          <FormBerita />
        </Match>
        <Match when={berita.loading}>
          <p className="py-12 text-sm text-[#685856]">Memuat berita...</p>
        </Match>
        <Match when={berita.error}>
          <p className="py-12 text-sm text-[#685856]">{berita.error.message}</p>
        </Match>
        <Match when={berita()}>
          <FormBerita berita={berita()} />
        </Match>
      </Switch>
    </div>
  );
}
