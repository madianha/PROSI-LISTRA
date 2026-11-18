import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import VideoJasa, { sumberVideo } from "./VideoJasa";

describe("sumberVideo", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871?autoplay=1"],
    ["https://drive.google.com/file/d/1AbC_dEf-123/view?usp=sharing", "https://drive.google.com/file/d/1AbC_dEf-123/preview"],
  ])("%s diputar di dalam halaman (iframe)", (url, embed) => {
    expect(sumberVideo(url)).toEqual({ jenis: "iframe", src: embed });
  });

  it("file video langsung memakai elemen <video>", () => {
    expect(sumberVideo("https://cdn.example.org/tari-merak.mp4")).toEqual({
      jenis: "video",
      src: "https://cdn.example.org/tari-merak.mp4",
    });
  });

  it.each(["https://www.instagram.com/reel/abc/", "https://www.youtube.com/watch?v=pendek", "bukan url", "", null])(
    "%s tidak bisa diputar di halaman",
    (url) => {
      expect(sumberVideo(url)).toBeNull();
    },
  );
});

describe("VideoJasa", () => {
  it("tombol putar memakai ikon, bukan emoji, dan memutar video di tempat", () => {
    render(() => <VideoJasa url="https://youtu.be/dQw4w9WgXcQ" judul="Tari Merak" />);

    const tombol = screen.getByRole("button", { name: "Putar video Tari Merak" });
    expect(tombol.textContent).not.toMatch(/▶/);
    expect(tombol.querySelector("svg")).toBeTruthy();
    expect(document.querySelector("a[target=_blank]")).toBeNull();

    fireEvent.click(tombol);

    const iframe = screen.getByTitle("Video Tari Merak");
    expect(iframe.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    expect(screen.queryByRole("button", { name: "Putar video Tari Merak" })).toBeNull();
  });

  it("file video langsung diputar dengan pemutar bawaan browser", () => {
    render(() => <VideoJasa url="https://cdn.example.org/tari.mp4" judul="Tari Saman" />);
    fireEvent.click(screen.getByRole("button", { name: "Putar video Tari Saman" }));
    const video = document.querySelector("video");
    expect(video.getAttribute("src")).toBe("https://cdn.example.org/tari.mp4");
    expect(video.hasAttribute("controls")).toBe(true);
  });

  it("tautan yang tidak bisa diputar di halaman: tampil sebagai tautan yang jelas", () => {
    render(() => <VideoJasa url="https://www.instagram.com/reel/abc/" judul="Tari Saman" />);
    const tautan = screen.getByRole("link", { name: /Tonton video Tari Saman di instagram\.com/ });
    expect(tautan.getAttribute("href")).toBe("https://www.instagram.com/reel/abc/");
  });
});
