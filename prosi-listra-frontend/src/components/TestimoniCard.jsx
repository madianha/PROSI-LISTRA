export default function TestimoniCard(props) {
  const rating = () => props.rating ?? 5;
  const review = () =>
    props.review ??
    "Penampilan LISTRA sangat memukau dan tepat waktu. Koordinasi dengan panitia berjalan lancar.";
  const name = () => props.name ?? "Prof. Dr. Handoko Wijaya";
  const organization = () => props.organization ?? "Rektorat UNPAR";
  const event = () => props.event ?? "Acara: Opening Ceremony Dies Natalis ke-71";

  return (
    <article className="w-full max-w-md rounded-[14px] border border-[#f0d9d8] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(84,20,29,0.06)]">
      <div className="flex items-center gap-2" aria-label={`Rating ${rating()} dari 5`}>
        <span className="tracking-[-0.08em] text-[#2d2020]" aria-hidden="true">
          {"★".repeat(rating())}{"☆".repeat(5 - rating())}
        </span>
        <span className="font-serif text-sm text-[#8d7774]">{rating()} / 5</span>
      </div>

      <p className="mt-3 text-sm leading-5 text-[#302929]">{review()}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-[#302929]">{name()}</p>
      <p className="text-sm leading-5 text-[#947c79]">{organization()}</p>
      <p className="mt-1 text-sm leading-5 text-[#947c79]">{event()}</p>
    </article>
  );
}
