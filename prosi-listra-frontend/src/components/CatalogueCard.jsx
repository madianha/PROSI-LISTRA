export default function CatalogueCard(props) {
  const title = () => props.title || "";
  const category = () => props.category || "";
  const description = () => props.description || "";
  const price = () => props.price || "Rp 100.000–1.000.000";
  const tag = () => props.tag || "";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-[#f1dddd] bg-white shadow-[0_6px_18px_rgba(65,20,29,0.07)]">
      <div className="relative h-40 shrink-0 overflow-hidden bg-gradient-to-br from-[#4a151d] via-[#21070c] to-[#100205]">
        {props.image && (
          <img src={props.image} alt={title()} className="h-full w-full object-cover" />
        )}
        {props.videoHref && (
          <a
            href={props.videoHref}
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
            Kategori: {props.type || category().split("•")[0].trim() || "Jasa"}
          </span>
          <span className="text-[#9b8885]">{props.region || category().split("•").slice(1).join("•").trim()}</span>
        </div>

        {tag() && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <span className="text-[#9b8885]">Cocok untuk</span>
            <span className="rounded-full border border-[#e6cfcf] bg-[#fffafa] px-3 py-1 text-[#6d5554]">
              {tag().charAt(0) + tag().slice(1).toLowerCase()}
            </span>
          </p>
        )}

        <h2 className="mt-4 font-serif text-xl font-bold leading-tight text-[#54141d] sm:text-2xl">{title()}</h2>
        <p className="mt-3 text-sm leading-6 text-[#9b8885] sm:text-base">{description()}</p>

        <div className="mt-auto pt-4">
          <div className="rounded-xl border border-[#f5e0e1] bg-[#fff0f1] px-4 py-3">
            <p className="font-serif text-lg font-bold leading-relaxed text-[#54141d] sm:text-xl">{price()}</p>
            <p className="text-sm text-[#9b8885]">/ penampilan</p>
          </div>
          <a
            href={props.detailHref || "/katalog"}
            className="mt-3 flex min-h-12 items-center justify-center rounded-xl border border-[#e6cfcf] px-4 text-base font-semibold text-[#54141d] transition hover:bg-[#fffafa]"
          >
            Lihat Detail →
          </a>
        </div>
      </div>
    </article>
  );
}
