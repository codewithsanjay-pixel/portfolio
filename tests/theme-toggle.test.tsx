// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function render() {
  act(() => {
    root.render(<ThemeToggle />);
  });
  return container.querySelector("button")!;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("ThemeToggle", () => {
  it("follows the OS setting when nothing is saved", () => {
    mockSystemDark(true);
    const button = render();
    expect(button.textContent).toBe("Light theme");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("switches theme, saves the choice and updates its label", () => {
    mockSystemDark(false);
    const button = render();
    expect(button.textContent).toBe("Dark theme");

    act(() => button.click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(button.textContent).toBe("Light theme");
    expect(button.getAttribute("aria-pressed")).toBe("true");

    act(() => button.click());
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(button.getAttribute("aria-label")).toBe("Switch to dark theme");
  });

  it("re-applies a saved choice", () => {
    mockSystemDark(false);
    localStorage.setItem("theme", "dark");
    const button = render();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(button.textContent).toBe("Light theme");
  });

  it("ignores unexpected saved values", () => {
    mockSystemDark(false);
    localStorage.setItem("theme", "<script>");
    render();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
