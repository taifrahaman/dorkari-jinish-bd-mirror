// src/components/admin/admin-sidebar/DesktopSidebar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ChevronRight, ChevronsLeft, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark, Tip } from "@/components/shared/admin";

import {
  NAV,
  EXPANDED_W,
  COLLAPSED_W,
  STORAGE_KEY,
  gradientBg,
  itemBase,
  type NavItem,
} from "./constants";
import { useFilteredNav } from "@/hooks/admin/use-filtered-nav";

import {
  prefersReducedMotion,
  isActive,
  isChildActive,
  isSectionActive,
  findActiveSectionId,
  loadOpenSections,
  saveOpenSections,
  hover,
  logoutHover,
  press,
  useLogout,
} from "./helpers";

export function DesktopSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const filteredNav = useFilteredNav();

  const rootRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const isFirstIndicatorRun = useRef(true);
  const instantRef = useRef(true);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved === "1") return true;
      if (saved === "0") return false;

      return window.matchMedia("(max-width: 1023px)").matches;
    } catch {
      return false;
    }
  });

  /* ----------------------------------------------------------
   * Open sections — hydrated from localStorage, then auto-managed
   * ---------------------------------------------------------- */

  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadOpenSections();
    const activeId = findActiveSectionId(pathname);
    const merged = new Set(saved ?? []);
    if (activeId) merged.add(activeId);
    setOpenSections(Array.from(merged));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const activeId = findActiveSectionId(pathname);
    if (!activeId) return;
    setOpenSections((prev) => {
      if (prev.includes(activeId)) return prev;
      const next = [...prev, activeId];
      saveOpenSections(next);
      return next;
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      saveOpenSections(next);
      return next;
    });
  };

  const handleSectionClick = (id: string) => {
    // When collapsed, expand the sidebar first.
    if (collapsed) {
      setCollapsed(false);
      try {
        localStorage.setItem(STORAGE_KEY, "0");
      } catch {}
      return;
    }
    toggleSection(id);
  };

  /* ----------------------------------------------------------
   * Which top-level item is active? (link or section)
   * ---------------------------------------------------------- */

  const activeIndex = filteredNav.findIndex((item) =>
    isSectionActive(pathname, item),
  );

  /* ----------------------------------------------------------
   * Animate sidebar width on collapse toggle — unchanged
   * ---------------------------------------------------------- */

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
      gsap.set(chevrons, { rotate: collapsed ? 180 : 0 });

      instantRef.current = false;
      return;
    }

    gsap.to(root, { width, duration: 0.4, ease: "power3.inOut" });
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

  /* ----------------------------------------------------------
   * Mount animation — unchanged
   * ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
   * Active indicator — re-fires when openSections changes too
   * (children shift the offsetTop of subsequent items)
   * ---------------------------------------------------------- */

  useEffect(() => {
    const indicator = indicatorRef.current;
    const target = itemRefs.current[activeIndex];
    if (!indicator) return;

    if (!target) {
      gsap.to(indicator, { opacity: 0, duration: 0.2 });
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
      gsap.to(indicator, { ...vars, duration: 0.45, ease: "power3.out" });
    }
  }, [activeIndex, openSections]);

  /* ----------------------------------------------------------
   * Collapse toggle — unchanged
   * ---------------------------------------------------------- */

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {}
  }

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <aside
      ref={rootRef}
      className={cn(
        "relative z-20 hidden w-64 shrink-0 flex-col border-r border-white/10 md:flex",
        gradientBg,
      )}
    >
      {/* Brand */}
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

      {/* Nav */}
      <nav className="relative flex-1 p-4">
        <p
          data-collapsible
          className="overflow-hidden whitespace-nowrap pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-white/40"
        >
          <span className="block px-1">Menu</span>
        </p>

        <div className="relative space-y-1">
          {/* Sliding indicator */}
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 rounded-md bg-brand-accent/10 opacity-0 ring-1 ring-brand-accent/20"
          >
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-accent" />
          </span>

          {filteredNav.map((item, i) => {
            const active = i === activeIndex;

            /* ---------- Direct link (Dashboard) ---------- */
            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-label={item.label}
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
                    <item.icon className="size-4" />
                  </span>

                  <span
                    data-collapsible
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <span data-label className="block pr-3">
                      {item.label}
                    </span>
                  </span>

                  <Tip show={collapsed}>{item.label}</Tip>
                </Link>
              );
            }

            /* ---------- Section (Products, Categories, Colors) ---------- */
            const open = openSections.includes(item.id);

            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-label={item.label}
                  aria-expanded={open}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  data-sb="item"
                  onClick={() => handleSectionClick(item.id)}
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
                    <item.icon className="size-4" />
                  </span>

                  <span
                    data-collapsible
                    className="flex flex-1 items-center overflow-hidden whitespace-nowrap"
                  >
                    <span data-label className="block flex-1 pr-2 text-left">
                      {item.label}
                    </span>

                    <ChevronRight
                      className={cn(
                        "mr-3 size-3.5 shrink-0 text-white/50 transition-transform duration-200",
                        open && "rotate-90",
                      )}
                      aria-hidden="true"
                    />
                  </span>

                  <Tip show={collapsed}>{item.label}</Tip>
                </button>

                {/* Children */}
                {open && !collapsed && item.children && (
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {item.children.map((child) => {
                      const childActive = isChildActive(pathname, child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block truncate rounded-md px-3 py-1.5 text-[13px] transition-colors",
                              childActive
                                ? "bg-white/15 font-medium text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white",
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer — unchanged */}
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
