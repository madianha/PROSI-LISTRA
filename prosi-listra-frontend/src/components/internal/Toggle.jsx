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
      // h-11 min-w-11 = area klik 44px agar mudah disentuh di HP; saklarnya sendiri tetap kecil
      className="group inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#39000a] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* warna mati #948280 = kontras 3:1 dengan latar putih, saklar tetap terlihat */}
      <span
        className={`flex h-5 w-9 items-center rounded-full transition-colors group-active:brightness-90 ${
          props.checked
            ? "bg-[#39000a] group-hover:bg-[#5a0c1a]"
            : "bg-[#948280] group-hover:bg-[#7d6c69]"
        }`}
      >
        {/* translate-x-[18px] = bulatan bergeser ke kanan saat nyala */}
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow motion-safe:transition-transform group-hover:scale-110 ${
            props.checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
