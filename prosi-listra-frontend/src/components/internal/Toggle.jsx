/**
 * Saklar on/off.
 * props.checked  = nyala atau mati
 * props.onChange = dipanggil dengan nilai baru saat diklik
 * props.label    = nama untuk pembaca layar (mis. "Publik")
 * props.disabled = tidak bisa diklik (mis. saat sedang menyimpan)
 */
export default function Toggle(props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
      // relative = posisi bulatan putih diatur terhadap tombol ini
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        props.checked ? "bg-[#39000a]" : "bg-[#d9cdca]"
      }`}
    >
      {/* translate-x-[18px] = bulatan bergeser ke kanan saat nyala */}
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          props.checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
