// src/components/navigation/CategoryMenu.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CategoryNode } from "./navItems";
import styles from "./CategoryMenu.module.css";

type Props = {
  open: boolean;
  categories: CategoryNode[];
  onClose: () => void;
};

export default function CategoryMenu({ open, categories, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape. Click-outside is handled by DesktopNav wrapper's onMouseLeave.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={styles.panel}
      data-open={open}
      onMouseLeave={onClose}
      role="menu"
      aria-hidden={!open}
    >
      <ul className={styles.list}>
        {categories.map((cat) => (
          <li key={cat.id} className={styles.item}>
            <Link href={cat.href} className={styles.itemLink} onClick={onClose}>
              <span>{cat.label}</span>
              {cat.children && cat.children.length > 0 && (
                <span className={styles.arrow} aria-hidden>
                  ›
                </span>
              )}
            </Link>

            {cat.children && cat.children.length > 0 && (
              <div className={styles.submenu} role="menu">
                <ul>
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className={styles.subLink}
                        onClick={onClose}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
