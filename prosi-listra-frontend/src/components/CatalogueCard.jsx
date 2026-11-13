export default function CatalogueCard(props) {
  const title = () => props.nama || "";
  const type = () => props.tipe_jasa
    ? props.tipe_jasa.charAt(0).toUpperCase() + props.tipe_jasa.slice(1).toLowerCase()
    : "Jasa";
  const price = () => {
    const formatRupiah = (amount) => `Rp ${Number(amount).toLocaleString("id-ID")}`;
    const min = props.harga_minimum;
    const max = props.harga_maximum;
    if (min != null && max != null) return `${formatRupiah(min)} – ${formatRupiah(max)}`;
    if (min != null) return formatRupiah(min);
    if (max != null) return formatRupiah(max);
    return "Hubungi untuk harga";
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#f1dddd] bg-white shadow-[0_6px_18px_rgba(65,20,29,0.07)]">
      <div className="relative h-40 shrink-0 overflow-hidden  from-[#4a151d] via-[#21070c] to-[#100205]">
        {props.link_image && (
          <img src={props.link_image} alt={title()} className="h-full w-full object-cover" />
        )}
        {props.link_media && (
          <a
            href={props.link_media}
            aria-label={`Putar video ${title()}`}
            className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/20"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 pl-1 text-3xl text-white/90">
              ▶
            </span>
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm sm:text-base">
          <span className="rounded-full border border-[#f5d5d6] bg-[#fff0f1] px-3 py-1 font-medium text-[#54141d]">
            Kategori: {type()}
          </span>
          <span className="text-[#9b8885]">{props.kultur || "Nusantara"}</span>
        </div>

        {props.nama_kecocokan && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <span className="text-[#9b8885]">Cocok untuk</span>
            <span className="rounded-full border border-[#e6cfcf] bg-[#fffafa] px-3 py-1 text-[#6d5554]">
              {props.nama_kecocokan.charAt(0) + props.nama_kecocokan.slice(1).toLowerCase()}
            </span>
          </p>
        )}

        <h2 className="mt-4 font-serif text-xl font-bold leading-tight text-[#54141d] sm:text-2xl">{title()}</h2>
        <p className="mt-3 text-sm leading-6 text-[#9b8885] sm:text-base">{props.deskripsi || ""}</p>

        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-[#f5e0e1] bg-[#fff0f1] px-4 py-3">
            <p className="font-serif text-lg font-bold leading-relaxed text-[#54141d] sm:text-xl">{price()}</p>
            <p className="text-sm text-[#9b8885]">/ penampilan</p>
            {props.min_performer != null && <p className="mt-1 text-sm text-[#9b8885]">Minimal {props.min_performer} performer</p>}
          </div>
          <a
            href={props.detailHref || `/jasa/${props.id_jasa ?? ""}`}
            className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-[#e6cfcf] px-4 text-base font-semibold text-[#54141d] transition hover:bg-[#fffafa]"
          >
            Lihat Detail →
          </a>
        </div>
      </div>
    </article>
  );
}
