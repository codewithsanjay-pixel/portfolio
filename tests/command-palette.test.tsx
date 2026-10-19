// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { CommandPalette } from "@/components/command-palette";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(<CommandPalette />);
  });
}
function dialog() {
  return container.querySelector("dialog")!;
}
function input() {
  return container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
}
function options() {
  return Array.from(container.querySelectorAll('[role="option"]'));
}
function press(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
  });
}
function type(value: string) {
  const el = input();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function openPalette() {
  press(window, "k", { ctrlKey: true });
}

beforeEach(() => {
  push.mockClear();
  document.documentElement.removeAttribute("data-theme");
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({ matches: false, media: query })),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("CommandPalette", () => {
  it("is closed at first and opens on Ctrl+K and Cmd+K", () => {
    render();
    expect(dialog().open).toBe(false);
    openPalette();
    expect(dialog().open).toBe(true);
    press(window, "k", { ctrlKey: true });
    expect(dialog().open).toBe(false);
    press(window, "k", { metaKey: true });
    expect(dialog().open).toBe(true);
  });

  it("opens from the header button", () => {
    render();
    act(() => container.querySelector<HTMLButtonElement>(".palette-trigger")!.click());
    expect(dialog().open).toBe(true);
  });

  it("filters commands as you type and shows an empty state", () => {
    render();
    openPalette();
    const all = options().length;
    expect(all).toBeGreaterThan(5);
    type("git");
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining("Open GitHub")]);
    type("zzzz");
    expect(options()).toHaveLength(0);
    expect(container.textContent).toContain("No commands match.");
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("runs the active command with arrow keys and Enter", () => {
    render();
    openPalette();
    press(input(), "ArrowDown");
    press(input(), "ArrowDown");
    press(input(), "Enter");
    expect(push).toHaveBeenCalledWith("/#skills");
    expect(dialog().open).toBe(false);
  });

  it("supports Home, End and wrapping", () => {
    render();
    openPalette();
    press(input(), "End");
    const last = options().at(-1)!;
    expect(input().getAttribute("aria-activedescendant")).toBe(last.id);
    press(input(), "ArrowDown");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
    press(input(), "ArrowUp");
    expect(input().getAttribute("aria-activedescendant")).toBe(last.id);
    press(input(), "Home");
    expect(input().getAttribute("aria-activedescendant")).toBe(options()[0].id);
  });

  it("navigates to the how-it's-built page", () => {
    render();
    openPalette();
    type("built");
    press(input(), "Enter");
    expect(push).toHaveBeenCalledWith("/how-its-built");
  });

  it("toggles the theme and saves it under the same key as the toggle button", () => {
    render();
    openPalette();
    type("theme");
    press(input(), "Enter");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("closes on Escape-style close and returns focus to the opener", () => {
    render();
    const trigger = container.querySelector<HTMLButtonElement>(".palette-trigger")!;
    trigger.focus();
    act(() => trigger.click());
    // happy-dom does not synthesize Esc; the native dialog fires close.
    act(() => dialog().close());
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("has the combobox and listbox ARIA wiring", () => {
    render();
    openPalette();
    const box = input();
    const list = container.querySelector('[role="listbox"]')!;
    expect(box.getAttribute("aria-expanded")).toBe("true");
    expect(box.getAttribute("aria-controls")).toBe(list.id);
    expect(box.getAttribute("aria-autocomplete")).toBe("list");
    const opts = options();
    expect(opts.every((o) => o.getAttribute("role") === "option")).toBe(true);
    expect(box.getAttribute("aria-activedescendant")).toBe(opts[0].id);
    expect(opts[0].getAttribute("aria-selected")).toBe("true");
    expect(opts[1].getAttribute("aria-selected")).toBe("false");
    press(box, "ArrowDown");
    expect(box.getAttribute("aria-activedescendant")).toBe(opts[1].id);
    expect(opts[1].getAttribute("aria-selected")).toBe("true");
  });
});
