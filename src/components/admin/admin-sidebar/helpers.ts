// src/components/admin/admin-sidebar/helpers.ts

"use client";

import type { MouseEvent, PointerEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { NAV, OPEN_SECTIONS_KEY, type NavItem } from "./constants";

/* ============================================================
 * Motion — unchanged
 * ============================================================ */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
 * Active checks
 * ============================================================ */

/** Top-level active check (prefix match for sub-routes). */
export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

/** Exact match for child links. */
export function isChildActive(pathname: string, href: string): boolean {
  return pathname === href;
}

/** Is this top-level item (link or section) currently active? */
export function isSectionActive(pathname: string, item: NavItem): boolean {
  if (item.href) return isActive(pathname, item.href);
  if (!item.children) return false;
  return item.children.some((c) => {
    if (pathname === c.href) return true;
    return pathname.startsWith(`${c.href}/`);
  });
}

/** Which section contains the current route? */
export function findActiveSectionId(pathname: string): string | null {
  for (const item of NAV) {
    if (!item.children) continue;
    if (isSectionActive(pathname, item)) return item.id;
  }
  return null;
}

/* ============================================================
 * Open-sections persistence
 * ============================================================ */

export function loadOpenSections(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OPEN_SECTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveOpenSections(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/* ============================================================
 * Auth / interaction — unchanged
 * ============================================================ */

export function useLogout() {
  const router = useRouter();
  return async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };
}

export function hover(e: MouseEvent<HTMLElement>, on: boolean) {
  if (prefersReducedMotion()) return;
  const el = e.currentTarget;
  gsap.to(el.querySelector("[data-label]"), {
    x: on ? 4 : 0,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto",
  });
  gsap.to(el.querySelector("[data-icon]"), {
    scale: on ? 1.15 : 1,
    rotate: on ? -6 : 0,
    duration: 0.3,
    ease: "back.out(2)",
    overwrite: "auto",
  });
}

export function logoutHover(e: MouseEvent<HTMLElement>, on: boolean) {
  if (prefersReducedMotion()) return;
  gsap.to(e.currentTarget.querySelector("[data-icon]"), {
    x: on ? 3 : 0,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto",
  });
}

export function press(e: PointerEvent<HTMLElement>, down: boolean) {
  if (prefersReducedMotion()) return;
  gsap.to(e.currentTarget, {
    scale: down ? 0.97 : 1,
    duration: 0.15,
    ease: "power2.out",
  });
}
