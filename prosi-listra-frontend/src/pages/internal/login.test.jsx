import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi, beforeEach } from "vitest";
import LoginInternal from "./login";
import * as authApi from "../../api/auth";

const mockNavigate = vi.fn();
vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  A: (props) => <a href={props.href} class={props.class}>{props.children}</a>,
}));

describe("LoginInternal Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it("merender form login dengan judul dan input email & kata sandi", () => {
    render(() => <LoginInternal />);

    expect(screen.getByText("Masuk Panel Internal")).toBeDefined();
    expect(screen.getByPlaceholderText("nama@student.unpar.ac.id")).toBeDefined();
    expect(screen.getByPlaceholderText("••••••••")).toBeDefined();
    expect(screen.getByRole("button", { name: /masuk/i })).toBeDefined();
    expect(screen.getByRole("button", { name: "Toggle password visibility" })).toBeDefined();
  });

  it("dapat toggle visibilitas kata sandi antara password dan text", () => {
    render(() => <LoginInternal />);

    const passwordInput = screen.getByPlaceholderText("••••••••");
    const toggleBtn = screen.getByRole("button", { name: "Toggle password visibility" });

    expect(passwordInput.type).toBe("password");

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("menampilkan pesan error jika login gagal", async () => {
    vi.spyOn(authApi, "loginApi").mockRejectedValueOnce(
      new Error("Email atau kata sandi tidak valid.")
    );

    render(() => <LoginInternal />);

    const emailInput = screen.getByPlaceholderText("nama@student.unpar.ac.id");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /masuk/i });

    fireEvent.input(emailInput, { target: { value: "salah@unpar.ac.id" } });
    fireEvent.input(passwordInput, { target: { value: "salahpassword" } });
    fireEvent.click(submitBtn);

    // Tunggu pesan error muncul
    const errEl = await screen.findByText("Email atau kata sandi tidak valid.");
    expect(errEl).toBeDefined();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("berhasil login dan bernavigasi ke /internal/kalender saat kredensial valid", async () => {
    vi.spyOn(authApi, "loginApi").mockResolvedValueOnce({
      success: true,
      token: "dummy-token",
      user: { id_anggota: 1, nama: "Alexander Haryanto" },
    });

    render(() => <LoginInternal />);

    const emailInput = screen.getByPlaceholderText("nama@student.unpar.ac.id");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /masuk/i });

    fireEvent.input(emailInput, { target: { value: "alexander@unpar.ac.id" } });
    fireEvent.input(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/internal/kalender", { replace: true });
    });
  });
});