// src/components/navigation/NavSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Search, X } from "lucide-react";
import styles from "./NavSearch.module.css";

export default function NavSearch() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);

  // Animate width / opacity on open/close
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (open) {
      tl.fromTo(
        el,
        { width: 0, opacity: 0, marginLeft: 0 },
        { width: 300, opacity: 1, marginLeft: 6, duration: 0.32 },
      ).add(() => inputRef.current?.focus());
    } else {
      tl.to(el, {
        width: 0,
        opacity: 0,
        marginLeft: 0,
        duration: 0.22,
        ease: "power3.in",
      });
    }

    return () => {
      tl.kill();
    };
  }, [open]);

  // Escape to close + click-outside to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={open ? "Close search" : "Search"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={18} /> : <Search size={18} />}
      </button>

      <div ref={wrapRef} className={styles.inputWrap}>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search appliances, lights, wiring…"
          className={styles.input}
          tabIndex={open ? 0 : -1}
        />
      </div>
    </div>
  );
}
