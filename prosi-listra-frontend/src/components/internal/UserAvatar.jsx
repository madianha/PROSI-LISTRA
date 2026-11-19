/** Avatar bawaan: siluet kepala dan bahu, tanpa foto. */
export default function UserAvatar(props) {
  return (
    <span
      data-testid="user-avatar"
      aria-hidden="true"
      class={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#efe7e8] text-[#8c7377] ${props.class ?? "h-8 w-8"}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" class="h-full w-full">
        <circle cx="12" cy="9" r="4" />
        <path d="M3.5 24c0-5 3.8-8 8.5-8s8.5 3 8.5 8z" />
      </svg>
    </span>
  );
}
