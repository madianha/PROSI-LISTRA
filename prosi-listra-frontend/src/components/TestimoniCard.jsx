export default function TestimoniCard(props) {
  const rating = Number(props.rating ?? 0);
  const date = props.tanggal_input
    ? new Date(props.tanggal_input).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <article className="w-full max-w-md rounded-[14px] border border-[#f0d9d8] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(84,20,29,0.06)]">
      <p className="text-xs text-[#947c79]">{date}</p>
      <div className="flex items-center gap-2" aria-label={`Rating ${rating} dari 5`}>
        <span className="tracking-[-0.08em] text-[#2d2020]" aria-hidden="true">
          {"★".repeat(rating)}{"☆".repeat(5 - rating)}
        </span>
        <span className="font-serif text-sm text-[#8d7774]">{rating} / 5</span>
      </div>

      <p className="mt-3 text-sm leading-5 text-[#302929]">{props.isi_testimoni}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-[#302929]">{props.nama_klien}</p>
      {props.instansi && <p className="text-sm leading-5 text-[#947c79]">{props.instansi}</p>}
      {props.nama_acara && <p className="mt-1 text-sm leading-5 text-[#947c79]">{props.nama_acara}</p>}
    </article>
  );
}
