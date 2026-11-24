import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

describe("Icon", () => {
  it("ikut berganti saat props.icon berubah (mis. tombol menu: garis tiga lalu silang)", () => {
    const [ikon, setIkon] = createSignal(faBars);
    const { container } = render(() => <Icon icon={ikon()} />);
    const svg = () => container.querySelector("svg");

    // data ikon dari Font Awesome: [lebar, tinggi, ligatures, unicode, path]
    expect(svg().getAttribute("viewBox")).toBe(`0 0 ${faBars.icon[0]} ${faBars.icon[1]}`);
    expect(svg().querySelector("path").getAttribute("d")).toBe(faBars.icon[4]);

    setIkon(faXmark);
    expect(svg().getAttribute("viewBox")).toBe(`0 0 ${faXmark.icon[0]} ${faXmark.icon[1]}`);
    expect(svg().querySelector("path").getAttribute("d")).toBe(faXmark.icon[4]);
  });
});
