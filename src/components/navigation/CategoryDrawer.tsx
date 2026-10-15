// src/components/navigation/CategoryDrawer.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { CategoryNode, NavLink } from "./navItems";
import styles from "./CategoryDrawer.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  links: NavLink[];
};

export default function CategoryDrawer({ open, onClose, categories }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={styles.backdrop}
        data-open={open}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={styles.drawer}
        data-open={open}
        aria-label="Menu"
        aria-hidden={!open}
      >
        <header className={styles.header}>
          <span className={styles.title}>Browse</span>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </header>

        <nav className={styles.body}>
          <p className={styles.sectionLabel} data-label="categories">
            Categories
          </p>
          <ul className={styles.list}>
            {categories.map((cat) => {
              const isOpen = expanded === cat.id;
              const hasChildren = !!cat.children?.length;
              return (
                <li key={cat.id} className={styles.item}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        className={styles.row}
                        onClick={() => setExpanded(isOpen ? null : cat.id)}
                        aria-expanded={isOpen}
                      >
                        <span>{cat.label}</span>
                        <ChevronDown
                          size={16}
                          className={styles.chev}
                          data-open={isOpen}
                        />
                      </button>
                      {isOpen && (
                        <ul className={styles.sublist}>
                          {cat.children!.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.href}
                                className={styles.sublink}
                                onClick={onClose}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={cat.href}
                      className={styles.row}
                      onClick={onClose}
                    >
                      {cat.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>,
    document.body,
  );
}
