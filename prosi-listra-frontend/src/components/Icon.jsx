/**
 * Ikon Font Awesome sebagai SVG.
 * Pakai: import { faPen } from "@fortawesome/free-solid-svg-icons";
 *        <Icon icon={faPen} />
 * Ukuran mengikuti font-size (h-[1em]), warna mengikuti warna teks (currentColor).
 */
export default function Icon(props) {
  // data ikon dibaca di dalam JSX (bukan sekali di awal) supaya gambarnya ikut berganti saat props.icon berubah,
  // mis. tombol menu (garis tiga <-> silang) dan tombol putar/jeda video Beranda.
  // Isi data Font Awesome: [lebar, tinggi, ligatures, unicode, path]
  const data = () => props.icon.icon;
  return (
    <svg
      viewBox={`0 0 ${data()[0]} ${data()[1]}`}
      fill="currentColor"
      aria-hidden="true"
      className={`inline-block h-[1em] w-auto shrink-0 ${props.class ?? ""}`}
    >
      <path d={Array.isArray(data()[4]) ? data()[4].join(" ") : data()[4]} />
    </svg>
  );
}
