export default function CatalogueCard(props) {
  const title = () => props.title || "";
  const category = () => props.category || "";
  const description = () =>
    props.description ||
    "";
  const price = () => props.price || "Rp 100.000–1.000.000";
  const tag = () => props.tag || ""

  return (
    <article className="w-full overflow-hidden rounded-[18px] border border-[#eee7df] bg-white shadow-[0_6px_16px_rgba(40,15,15,0.08)]">
      <div className="relative h-52 bg-gradient-to-br from-[#210207] via-[#100003] to-[#050001]">
        <span className="absolute left-4 top-4 rounded-full border border-[#c28d11] bg-[#3c080d] px-3 py-1.5 text-[11px] font-bold text-[#dfae16]">
          {tag}
        </span>
      </div>

      <div className="px-6 py-6">
        <h2 className="font-serif text-3xl font-bold leading-none text-[#54141d]">{title()}</h2>
        <p className="mt-3 text-xs font-medium tracking-wide text-[#817b77]">{category()}</p>
        <p className="mt-4 text-base leading-7 text-[#625c58]">{description()}</p>
      </div>

      <div className="flex items-end justify-between gap-3 border-t border-[#f0ece8] px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#aaa29e]">Range Biaya</p>
          <p className="mt-1 font-serif text-md font-bold text-[#54141d]">{price()}</p>
        </div>
        <a href={props.detailHref || "/katalog"} className="shrink-0 text-sm font-semibold text-[#d5a710]">
          Lihat Detail &amp; Package &gt;
        </a>
      </div>
    </article>
  );
}
