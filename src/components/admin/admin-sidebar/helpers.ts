// src/components/admin/admin-sidebar/helpers.ts

"use client";

import type { MouseEvent, PointerEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

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
