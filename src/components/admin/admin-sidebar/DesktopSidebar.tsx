// src/components/admin/admin-sidebar/DesktopSidebar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ChevronsLeft, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark, Tip } from "@/components/shared/admin";

import {
  NAV,
  EXPANDED_W,
  COLLAPSED_W,
  STORAGE_KEY,
  gradientBg,
  itemBase,
} from "./constants";
import {
  prefersReducedMotion,
  isActive,
  hover,
  logoutHover,
  press,
  useLogout,
} from "./helpers";

export function DesktopSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  const rootRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const isFirstIndicatorRun = useRef(true);
  const instantRef = useRef(true);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === "1") {
        return true;
      }

      if (saved === "0") {
        return false;
      }

      return window.matchMedia("(max-width: 1023px)").matches;
    } catch {
      return false;
    }
  });

  const activeIndex = NAV.findIndex(({ href }) => isActive(pathname, href));

  /**
   * Animate sidebar width, labels and chevrons
   * whenever the collapsed state changes.
   */
  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const width = collapsed ? COLLAPSED_W : EXPANDED_W;

    const labels = root.querySelectorAll("[data-collapsible]");
    const chevrons = root.querySelectorAll("[data-chevron]");

    const labelVars = {
      opacity: collapsed ? 0 : 1,
      width: collapsed ? 0 : "auto",
    };

    if (instantRef.current || prefersReducedMotion()) {
      gsap.set(root, { width });
      gsap.set(labels, labelVars);
      gsap.set(chevrons, {
        rotate: collapsed ? 180 : 0,
      });

      instantRef.current = false;

      return;
    }

    gsap.to(root, {
      width,
      duration: 0.4,
      ease: "power3.inOut",
    });

    gsap.to(labels, {
      ...labelVars,
      duration: collapsed ? 0.2 : 0.3,
      delay: collapsed ? 0 : 0.12,
      ease: "power2.out",
    });

    gsap.to(chevrons, {
      rotate: collapsed ? 180 : 0,
      duration: 0.4,
      ease: "power3.inOut",
    });
  }, [collapsed]);

  /**
   * Animate the sidebar contents on initial mount.
   */
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-sb='brand']", {
        y: -8,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });

      gsap.from("[data-sb='item']", {
        x: -14,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        delay: 0.1,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });

      gsap.from("[data-sb='footer']", {
        y: 8,
        opacity: 0,
        duration: 0.5,
        delay: 0.3,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  /**
   * Animate the active navigation indicator.
   */
  useEffect(() => {
    const indicator = indicatorRef.current;
    const target = itemRefs.current[activeIndex];

    if (!indicator) return;

    if (!target) {
      gsap.to(indicator, {
        opacity: 0,
        duration: 0.2,
      });

      return;
    }

    const vars = {
      y: target.offsetTop,
      height: target.offsetHeight,
      opacity: 1,
    };

    if (isFirstIndicatorRun.current || prefersReducedMotion()) {
      gsap.set(indicator, vars);
      isFirstIndicatorRun.current = false;
    } else {
      gsap.to(indicator, {
        ...vars,
        duration: 0.45,
        ease: "power3.out",
      });
    }
  }, [activeIndex]);

  function toggle() {
    const next = !collapsed;

    setCollapsed(next);

    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage may be unavailable.
    }
  }

  return (
    <aside
      ref={rootRef}
      className={cn(
        "relative z-20 hidden w-64 shrink-0 flex-col border-r border-white/10 md:flex",
        gradientBg,
      )}
    >
      <div
        data-sb="brand"
        className="flex items-center border-b border-white/10 p-4"
      >
        <BrandMark className="size-10 text-sm" />

        <div
          data-collapsible
          className="overflow-hidden whitespace-nowrap leading-tight"
        >
          <div className="pl-3 pr-3">
            <p className="font-heading text-base">Dorkari Admin</p>

            <p className="text-[11px] text-white/50">Management panel</p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 p-4">
        <p
          data-collapsible
          className="overflow-hidden whitespace-nowrap pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-white/40"
        >
          <span className="block px-1">Menu</span>
        </p>

        <div className="relative space-y-1">
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 rounded-md bg-brand-accent/10 opacity-0 ring-1 ring-brand-accent/20"
          >
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-accent" />
          </span>

          {NAV.map(({ href, label, icon: Icon }, i) => {
            const active = i === activeIndex;

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                data-sb="item"
                onMouseEnter={(e) => hover(e, true)}
                onMouseLeave={(e) => hover(e, false)}
                onPointerDown={(e) => press(e, true)}
                onPointerUp={(e) => press(e, false)}
                onPointerLeave={(e) => press(e, false)}
                className={cn(
                  itemBase,
                  "z-10",
                  active
                    ? "text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <span
                  data-icon
                  className={cn(
                    "grid size-10 shrink-0 place-items-center transition-colors",
                    active && "text-brand-accent",
                  )}
                >
                  <Icon className="size-4" />
                </span>

                <span
                  data-collapsible
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span data-label className="block pr-3">
                    {label}
                  </span>
                </span>

                <Tip show={collapsed}>{label}</Tip>
              </Link>
            );
          })}
        </div>
      </nav>

      <div data-sb="footer" className="space-y-1 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onPointerDown={(e) => press(e, true)}
          onPointerUp={(e) => press(e, false)}
          onPointerLeave={(e) => press(e, false)}
          className={cn(
            itemBase,
            "text-white/70 hover:bg-white/5 hover:text-white",
          )}
        >
          <span className="grid size-10 shrink-0 place-items-center">
            <ChevronsLeft data-chevron className="size-4" />
          </span>

          <span data-collapsible className="overflow-hidden whitespace-nowrap">
            <span className="block pr-3">Collapse</span>
          </span>

          <Tip show={collapsed}>Expand</Tip>
        </button>

        <button
          type="button"
          onClick={logout}
          aria-label="Logout"
          onMouseEnter={(e) => logoutHover(e, true)}
          onMouseLeave={(e) => logoutHover(e, false)}
          onPointerDown={(e) => press(e, true)}
          onPointerUp={(e) => press(e, false)}
          onPointerLeave={(e) => press(e, false)}
          className={cn(
            itemBase,
            "text-white/70 hover:bg-destructive/15 hover:text-red-300",
          )}
        >
          <span data-icon className="grid size-10 shrink-0 place-items-center">
            <LogOut className="size-4" />
          </span>

          <span data-collapsible className="overflow-hidden whitespace-nowrap">
            <span className="block pr-3">Logout</span>
          </span>

          <Tip show={collapsed}>Logout</Tip>
        </button>
      </div>
    </aside>
  );
}
