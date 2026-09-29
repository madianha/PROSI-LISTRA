import { splitProps } from "solid-js";
import { A } from "@solidjs/router";

export default function CustomButton(props) {
  const [local, others] = splitProps(props, ["children", "class", "className", "href", "type", "label", "text"]);

  const buttonClasses = () =>
    `inline-flex items-center justify-center px-4 py-2 rounded-full font-medium transition-all duration-200 cursor-pointer ${
      local.class || local.className
    }`;

  if (local.href) {
    return (
      <A href={local.href} class={buttonClasses()} {...others}>
        {local.children || local.label || local.text}
      </A>
    );
  }

  return (
    <button type={local.type || "button"} class={buttonClasses()} {...others}>
      {local.children || local.label || local.text}
    </button>
  );
}
