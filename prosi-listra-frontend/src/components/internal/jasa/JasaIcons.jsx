import { splitProps } from "solid-js";

function BaseIcon(props) {
  const [local, rest] = splitProps(props, ["size", "class", "children", "stroke"]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={local.size ?? 16}
      height={local.size ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={local.stroke ?? 1.75}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      class={local.class}
      {...rest}
    >
      {local.children}
    </svg>
  );
}

export const IconPlus = (p) => (
  <BaseIcon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </BaseIcon>
);

export const IconSearch = (p) => (
  <BaseIcon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </BaseIcon>
);

export const IconClose = (p) => (
  <BaseIcon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </BaseIcon>
);

export const IconPencil = (p) => (
  <BaseIcon {...p}>
    <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </BaseIcon>
);

export const IconEyeOff = (p) => (
  <BaseIcon {...p}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </BaseIcon>
);

export const IconEye = (p) => (
  <BaseIcon {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </BaseIcon>
);

/* Penari: figur dengan lengan terangkat */
export const IconDance = (p) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="4.5" r="1.75" />
    <path d="M5 8.5 9.5 10l2.5-1 2.5 1L19 8" />
    <path d="M12 9v5" />
    <path d="m12 14-3.5 6.5" />
    <path d="m12 14 3 3-1 3.5" />
  </BaseIcon>
);

export const IconMusic = (p) => (
  <BaseIcon {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </BaseIcon>
);

export const IconImage = (p) => (
  <BaseIcon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </BaseIcon>
);

export const IconLink = (p) => (
  <BaseIcon {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </BaseIcon>
);

export const IconAlert = (p) => (
  <BaseIcon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5" />
    <path d="M12 16h.01" />
  </BaseIcon>
);

/* Segitiga putar padat untuk badge media */
export const IconPlay = (p) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={p.size ?? 12}
    height={p.size ?? 12}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    class={p.class}
  >
    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.29-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
  </svg>
);
