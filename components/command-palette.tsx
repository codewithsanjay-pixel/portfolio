"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { links } from "@/content/site";

type Theme = "light" | "dark";

type Command = {
  id: string;
  label: string;
  hint: string;
  run: (router: { push: (href: string) => void }) => void;
};

// Same behavior and storage key as components/theme-toggle.tsx.
function currentTheme(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toggleTheme() {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage blocked: the choice lasts this visit only.
  }
  window.dispatchEvent(new Event("themechange"));
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function section(id: string, label: string): Command {
  return { id: `go-${id}`, label, hint: "Home page", run: (r) => r.push(`/#${id}`) };
}

const COMMANDS: readonly Command[] = [
  section("pipeline", "Go to How the chat works"),
  section("focus", "Go to Focus"),
  section("experience", "Go to Experience"),
  section("skills", "Go to Skills"),
  section("projects", "Go to Projects"),
  section("about", "Go to About"),
  section("contact", "Go to Contact"),
  { id: "go-built", label: "Go to How it's built", hint: "Page", run: (r) => r.push("/how-its-built") },
  { id: "go-trust", label: "Go to Trust and limits", hint: "Page", run: (r) => r.push("/trust") },
  { id: "go-mcp", label: "Go to MCP", hint: "Page", run: (r) => r.push("/mcp") },
  {
    id: "go-eka",
    label: "Go to Enterprise knowledge assistant",
    hint: "Project",
    run: (r) => r.push("/projects/enterprise-knowledge-assistant"),
  },
  { id: "theme", label: "Toggle theme", hint: "Action", run: () => toggleTheme() },
  { id: "github", label: "Open GitHub", hint: "External link", run: () => openExternal(links.github) },
  { id: "linkedin", label: "Open LinkedIn", hint: "External link", run: () => openExternal(links.linkedin) },
];

export function CommandPalette() {
  const router = useRouter();
  const uid = useId();
  const listId = `${uid}-list`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const needle = query.trim().toLowerCase();
  const results = needle
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(needle))
    : COMMANDS;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));
  const activeId = results[activeIndex] ? `${uid}-opt-${results[activeIndex].id}` : undefined;

  const open = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActive(0);
    dialog.showModal();
  }, []);

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(activeId);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function onClosed() {
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && opener.isConnected) opener.focus();
  }

  function run(command: Command) {
    close();
    command.run(router);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    const last = results.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex >= last ? 0 : activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex <= 0 ? Math.max(last, 0) : activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(last, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = results[activeIndex];
      if (command) run(command);
    }
  }

  return (
    <>
      <button
        type="button"
        className="palette-trigger"
        onClick={open}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <span>Commands</span>
        <kbd className="palette-kbd">Ctrl K</kbd>
      </button>
      <dialog
        ref={dialogRef}
        className="palette"
        aria-label="Command palette"
        onClose={onClosed}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="palette-body">
          <input
            type="text"
            className="palette-input"
            role="combobox"
            aria-label="Search commands"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            placeholder="Type a command"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
          />
          <ul id={listId} role="listbox" aria-label="Commands" className="palette-list">
            {results.map((c, i) => (
              <li
                key={c.id}
                id={`${uid}-opt-${c.id}`}
                role="option"
                aria-selected={i === activeIndex}
                className="palette-option"
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
              >
                <span>{c.label}</span>
                <span className="palette-hint">{c.hint}</span>
              </li>
            ))}
          </ul>
          {results.length === 0 ? (
            <p className="palette-empty" role="status">
              No commands match.
            </p>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
