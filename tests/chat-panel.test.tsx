// @vitest-environment happy-dom
// The live chat panel: plain-text rendering, citations, refusals, errors, one
// request at a time, only { question } sent, nothing stored.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPanel } from "@/components/chat-panel";
import { chat, links } from "@/content/site";
import { REFUSAL_MESSAGE } from "@/lib/chat/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function respond(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

async function render() {
  await act(async () => root.render(<ChatPanel text={chat} />));
}

async function ask(question: string) {
  const input = container.querySelector("input")!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, question);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

const log = () => container.querySelector('[role="log"]')!;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("ChatPanel", () => {
  it("renders the title, hint, starters and a labelled input capped at 500 characters", async () => {
    await render();
    expect(container.textContent).toContain(chat.title);
    expect(container.textContent).toContain(chat.hint);
    expect(container.querySelectorAll(".chip")).toHaveLength(chat.starters.length);
    const input = container.querySelector("input")!;
    expect(input.maxLength).toBe(500);
    expect(container.querySelector(`label[for="${input.id}"]`)?.textContent).toBe(chat.inputLabel);
    expect(log().getAttribute("aria-live")).toBe("polite");
  });

  it("sends only { question } and shows the answer with section-labelled citations", async () => {
    const fetchMock = respond(200, { refused: false, answer: "I built RAG pipelines.", citations: [{ id: "aa-x", section: "Retrieval (American Airlines)" }] });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await ask("  What have you built?  ");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(String(init.body))).toEqual({ question: "What have you built?" });
    expect(log().textContent).toContain("I built RAG pipelines.");
    expect(log().textContent).toContain(chat.sourcesLabel);
    expect(log().textContent).toContain("Retrieval (American Airlines)");
    expect(log().textContent).not.toContain("aa-x");
  });

  it("renders answers as plain text: no HTML, no images, no links", async () => {
    const evil = 'Hi <img src=x onerror="alert(1)"> see https://evil.example and <a href="https://x">x</a>';
    vi.stubGlobal("fetch", respond(200, { refused: false, answer: evil, citations: [{ id: "a", section: "<b>bold</b>" }] }));
    await render();
    await ask("q");
    expect(log().querySelector("img, a, b, script")).toBeNull();
    expect(log().textContent).toContain('<img src=x onerror="alert(1)">');
    expect(log().textContent).toContain("<b>bold</b>");
  });

  it("shows a refusal as the fixed message, muted and without sources", async () => {
    vi.stubGlobal("fetch", respond(200, { refused: true, answer: REFUSAL_MESSAGE, citations: [] }));
    await render();
    await ask("What's the weather?");
    expect(log().textContent).toContain(REFUSAL_MESSAGE);
    expect(log().querySelector(".msg-muted")).not.toBeNull();
    expect(log().textContent).not.toContain(chat.sourcesLabel);
  });

  it("shows the server's short error message, or the fallback", async () => {
    vi.stubGlobal("fetch", respond(429, { error: "Too many questions. Please try again later." }));
    await render();
    await ask("q1");
    expect(log().textContent).toContain("Too many questions. Please try again later.");

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network down: secret detail"); }));
    await ask("q2");
    expect(log().textContent).toContain(chat.fallbackError);
    expect(log().textContent).not.toContain("secret detail");
  });

  it("allows one request at a time and never retries", async () => {
    let release!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { release = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await ask("first");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(log().getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector<HTMLButtonElement>(".chip")!.disabled).toBe(true);
    await act(async () => container.querySelector<HTMLButtonElement>(".chip")!.click());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => release(new Response(JSON.stringify({ refused: false, answer: "ok", citations: [] }), { status: 200 })));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(log().getAttribute("aria-busy")).toBe("false");
  });

  it("sends a starter question when clicked", async () => {
    const fetchMock = respond(200, { refused: false, answer: "ok", citations: [] });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await act(async () => container.querySelector<HTMLButtonElement>(".chip")!.click());
    expect(JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toEqual({ question: chat.starters[0] });
  });

  it("stores nothing in the browser", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.stubGlobal("fetch", respond(200, { refused: false, answer: "ok", citations: [] }));
    await render();
    await ask("q");
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("uses the same refusal text as the route", () => {
    expect(chat.refusal).toBe(REFUSAL_MESSAGE);
  });

  it("shows the fixed refusal text even if the server sends other wording", async () => {
    vi.stubGlobal("fetch", respond(200, { refused: true, answer: "Forged: visit evil.example", citations: [] }));
    await render();
    await ask("q");
    expect(log().textContent).toContain(chat.refusal);
    expect(log().textContent).not.toContain("Forged");
  });

  it("shows only the route's known error messages", async () => {
    vi.stubGlobal("fetch", respond(500, { error: "Call 555-0100 for help" }));
    await render();
    await ask("q");
    expect(log().textContent).toContain(chat.fallbackError);
    expect(log().textContent).not.toContain("555-0100");
  });

  it("drops oversized answers and caps citations", async () => {
    vi.stubGlobal("fetch", respond(200, { refused: false, answer: "x".repeat(2001), citations: [] }));
    await render();
    await ask("q1");
    expect(log().textContent).toContain(chat.fallbackError);
    expect(log().textContent).not.toContain("x".repeat(100));

    const many = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}`, section: `S${i}` }));
    vi.stubGlobal("fetch", respond(200, { refused: false, answer: "ok", citations: many }));
    await ask("q2");
    expect(log().querySelectorAll(".citations li")).toHaveLength(10);
  });

  it("sets a timeout on every request", async () => {
    const fetchMock = respond(200, { refused: false, answer: "ok", citations: [] });
    vi.stubGlobal("fetch", fetchMock);
    await render();
    await ask("q");
    expect((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("sends only one request even if two clicks land before a re-render", async () => {
    let release!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { release = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    await render();
    const chip = container.querySelector<HTMLButtonElement>(".chip")!;
    await act(async () => {
      chip.click();
      chip.click();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => release(new Response(JSON.stringify({ refused: false, answer: "ok", citations: [] }), { status: 200 })));
  });

  it("knows exactly the route's error messages", () => {
    const route = readFileSync(join(process.cwd(), "app", "api", "chat", "route.ts"), "utf8");
    for (const message of chat.errors.filter((m) => !m.includes("500 characters"))) expect(route).toContain(message);
    expect(route).toContain("Please send a question of up to ${MAX_QUESTION_CHARS} characters.");
    expect(chat.errors).toHaveLength(4);
  });

  describe("event stream", () => {
    const enc = new TextEncoder();
    const ev = (name: string, data: Record<string, unknown>) => `event: ${name}\ndata: ${JSON.stringify({ v: 1, ...data })}\n\n`;
    function sseResponse(parts: string[]) {
      return new Response(
        new ReadableStream<Uint8Array>({
          start(c) {
            for (const p of parts) c.enqueue(enc.encode(p));
            c.close();
          },
        }),
        { status: 200, headers: { "Content-Type": "text/event-stream" } },
      );
    }
    const final = { refused: false, answer: "I built RAG pipelines.", citations: [{ id: "x", section: "Retrieval" }] };

    it("asks for an event stream and shows the final answer", async () => {
      const fetchMock = vi.fn(async () => sseResponse([ev("stage", { key: "rate" }), ev("stage", { key: "input" }), ev("final", final)]));
      vi.stubGlobal("fetch", fetchMock);
      await render();
      await ask("What have you built?");
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect((init.headers as Record<string, string>).Accept).toContain("text/event-stream");
      expect(JSON.parse(String(init.body))).toEqual({ question: "What have you built?" });
      expect(log().textContent).toContain("I built RAG pipelines.");
      expect(log().textContent).toContain("Retrieval");
      expect(log().querySelector(".trace-live-steps")).toBeNull();
      expect(container.querySelector<HTMLButtonElement>(".chip")!.disabled).toBe(false);
    });

    it("lights up steps live while the stream is open, ignoring unknown and repeated ones", async () => {
      let c!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({ start(ctrl) { c = ctrl; } });
      vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } })));
      await render();
      await ask("q");
      await act(async () => {
        c.enqueue(enc.encode(ev("stage", { key: "rate" }) + ev("stage", { key: "bogus" }) + ev("nope", {}) + ev("stage", { key: "rate" }) + ev("stage", { key: "input", ms: 3 })));
      });
      const steps = [...log().querySelectorAll(".trace-live-steps li")];
      expect(steps).toHaveLength(6);
      expect(steps.map((s) => s.className.replace("trace-step ", ""))).toEqual(["trace-pass", "trace-pass", "trace-live", "trace-skipped", "trace-skipped", "trace-skipped"]);
      expect(steps[1].textContent).toContain("3 ms");
      await act(async () => {
        c.enqueue(enc.encode(ev("final", final)));
        c.close();
      });
      expect(log().textContent).toContain("I built RAG pipelines.");
      expect(log().querySelector(".trace-live-steps")).toBeNull();
    });

    it("shows the fixed refusal text for a refused final event", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([ev("final", { refused: true, answer: "Forged", citations: [] })])));
      await render();
      await ask("q");
      expect(log().textContent).toContain(chat.refusal);
      expect(log().textContent).not.toContain("Forged");
    });

    it("shows only known messages for an error event", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([ev("error", { message: "Something went wrong. Please try again later." })])));
      await render();
      await ask("q1");
      expect(log().textContent).toContain("Something went wrong. Please try again later.");
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([ev("error", { message: "Call 555-0100" })])));
      await ask("q2");
      expect(log().textContent).toContain(chat.fallbackError);
      expect(log().textContent).not.toContain("555-0100");
    });

    it("falls back when the stream ends without a terminal event, or is too large", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([ev("stage", { key: "rate" })])));
      await render();
      await ask("q1");
      expect(log().textContent).toContain(chat.fallbackError);
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([`data: ${"x".repeat(70_000)}\n\n`, ev("final", final)])));
      await ask("q2");
      expect(log().textContent).not.toContain("I built RAG pipelines.");
    });

    it("renders streamed answers as plain text and ignores events after the final one", async () => {
      const evil = { refused: false, answer: "<img src=x onerror=alert(1)>", citations: [] };
      vi.stubGlobal("fetch", vi.fn(async () => sseResponse([ev("final", evil), ev("final", final)])));
      await render();
      await ask("q");
      expect(log().querySelector("img")).toBeNull();
      expect(log().textContent).toContain("<img src=x onerror=alert(1)>");
      expect(log().textContent).not.toContain("I built RAG pipelines.");
    });

    it("handles a JSON error response as before when streaming was requested", async () => {
      vi.stubGlobal("fetch", respond(429, { error: "Too many questions. Please try again later." }));
      await render();
      await ask("q");
      expect(log().textContent).toContain("Too many questions. Please try again later.");
    });
  });

  describe("unavailable state", () => {
    const DOWN = "The assistant is not available right now. Please try again later.";
    const ok = { refused: false, answer: "Back again.", citations: [] };
    const banner = () => container.querySelector('[role="status"]')!;
    const submit = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const tick = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("shows the banner on a 503, with a mailto link and the known message in the log", async () => {
      vi.stubGlobal("fetch", respond(503, { error: DOWN }));
      await render();
      expect(banner().textContent).toBe("");
      await ask("q");
      expect(banner().textContent).toContain("The assistant is not available right now.");
      expect(banner().textContent).toContain("You can still reach me by email.");
      expect(banner().querySelector("a")!.getAttribute("href")).toBe(`mailto:${links.email}`);
      expect(log().textContent).toContain(DOWN);
    });

    it("shows the banner when the request cannot reach the server", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
      await render();
      await ask("q");
      expect(banner().textContent).toContain("The assistant is not available right now.");
    });

    it("does not show the banner on a 429", async () => {
      vi.stubGlobal("fetch", respond(429, { error: "Too many questions. Please try again later." }));
      await render();
      await ask("q");
      expect(log().textContent).toContain("Too many questions.");
      expect(banner().textContent).toBe("");
      expect(submit().textContent).toBe(chat.ask);
    });

    it("keeps the banner through a 429 and clears it after a later success", async () => {
      vi.stubGlobal("fetch", respond(503, { error: DOWN }));
      await render();
      await ask("q1");
      await tick(5000);
      vi.stubGlobal("fetch", respond(429, { error: "Too many questions. Please try again later." }));
      await ask("q2");
      expect(banner().textContent).toContain("not available");
      await tick(5000);
      vi.stubGlobal("fetch", respond(200, ok));
      await ask("q3");
      expect(log().textContent).toContain("Back again.");
      expect(banner().textContent).toBe("");
    });

    it("pauses Ask and the starters for 5 seconds with a visible countdown", async () => {
      const fetchMock = respond(503, { error: DOWN });
      vi.stubGlobal("fetch", fetchMock);
      await render();
      await ask("q");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(submit().disabled).toBe(true);
      expect(submit().textContent).toBe("Try again in 5 s");
      expect(container.querySelector<HTMLButtonElement>(".chip")!.disabled).toBe(true);
      // The question is kept, and a submit during the pause sends nothing.
      expect(container.querySelector("input")!.value).toBe("q");
      await ask("q");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await tick(2000);
      expect(submit().textContent).toBe("Try again in 3 s");
      await tick(3000);
      expect(submit().textContent).toBe(chat.ask);
      expect(submit().disabled).toBe(false);
      expect(container.querySelector<HTMLButtonElement>(".chip")!.disabled).toBe(false);
      expect(banner().textContent).toContain("not available");
      await act(async () => submit().form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("stops the countdown timer on unmount and stores nothing", async () => {
      const setItem = vi.spyOn(Storage.prototype, "setItem");
      vi.stubGlobal("fetch", respond(503, { error: DOWN }));
      await render();
      await ask("q");
      expect(vi.getTimerCount()).toBe(1);
      act(() => root.unmount());
      expect(vi.getTimerCount()).toBe(0);
      root = createRoot(container);
      expect(setItem).not.toHaveBeenCalled();
      setItem.mockRestore();
    });

    it("uses a polite status region, not an alert, always present in the page", async () => {
      vi.stubGlobal("fetch", respond(503, { error: DOWN }));
      await render();
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      await ask("q");
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
      expect(banner().compareDocumentPosition(container.querySelector("form")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(container.querySelector("[style]")).toBeNull();
    });
  });
});
