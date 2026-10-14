import logoListra from "../img/logo-listra.PNG";

export default function BeritaCard(props) {
  const date = () => props.date ?? "20 Sep 2026";
  const category = () => props.category ?? "MEDIA DARING (CONTOH)";
  const title = () =>
    props.title ?? "(Contoh) Penampilan LISTRA di Festival Budaya Kota Bandung";
  const href = () => props.href ?? "";

  return (
    <article className="w-full overflow-hidden rounded-[14px] border border-[#f0d9d8] bg-white shadow-[0_4px_14px_rgba(84,20,29,0.06)]">
      <div className="flex h-[170px] items-center justify-center bg-[radial-gradient(ellipse_at_center,_#3b1017_0%,_#21080d_72%)]">
        <img className="h-[76px] w-[76px] object-contain" src={logoListra} alt="Logo LISTRA UNPAR" />
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <time className="rounded-full border border-[#f0d9d8] px-3 py-1 text-xs text-[#685856]">
            {date()}
          </time>
          <p className="font-serif text-xs font-bold tracking-[0.12em] text-[#8a6500]">
            {category()}
          </p>
        </div>

        <h2 className="mt-3 text-base font-bold leading-6 text-[#302929]">{title()}</h2>

        <a
          target="_blank"
          rel="noopener noreferrer"
          href={href()}
          className="mt-2 flex min-h-10 items-center justify-center rounded-lg border border-[#e8c9c7] px-4 text-sm font-semibold text-[#54141d] transition-colors hover:bg-[#fff7f6]"
        >
          Baca artikel ↗
        </a>
      </div>
    </article>
  );
}
