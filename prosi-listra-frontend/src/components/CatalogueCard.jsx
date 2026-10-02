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

      </div>

      <div className="px-6 py-6">
        <p className="mt-3 text-xs font-medium tracking-wide text-[#817b77]">{category()}</p>
        <p className="m-2">Cocok untuk
          <span className="bg-[#FFF8F7] p-1 rounded-full m-2 text-sm border-2 border-[#E6CFCF]">{tag}</span>
        </p>
        <h2 className="font-serif text-3xl font-bold leading-none text-[#54141d]">{title()}</h2>
        
        <p className="mt-4 text-base leading-7 text-[#625c58]">{description()}</p>
      </div>

      <div className="items-center gap-3 border-t border-[#f0ece8] px-6 py-4 ">
        <div className="bg-[#FFF0F1] p-6 rounded-xl mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#aaa29e]">Range Biaya / penampilan</p>
          <p className="mt-1 font-serif text-md font-bold text-[#54141d]">{price()}</p>
        </div>
        <div className="flex justify-center items-center p-4 border-2 border-[#DBC0C0] rounded-xl">
          <a href={props.detailHref || "/katalog"} className="shrink-0 text-sm font-semibold text-black">
          Lihat Detail →
        </a>
        </div>
        
      </div>
    </article>
  );
}
