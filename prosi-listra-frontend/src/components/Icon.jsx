/**
 * Ikon Font Awesome sebagai SVG.
 * Pakai: import { faPen } from "@fortawesome/free-solid-svg-icons";
 *        <Icon icon={faPen} />
 * Ukuran mengikuti font-size (h-[1em]), warna mengikuti warna teks (currentColor).
 */
export default function Icon(props) {
  const [width, height, , , path] = props.icon.icon;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      aria-hidden="true"
      className={`inline-block h-[1em] w-auto shrink-0 ${props.class ?? ""}`}
    >
      <path d={Array.isArray(path) ? path.join(" ") : path} />
    </svg>
  );
}
