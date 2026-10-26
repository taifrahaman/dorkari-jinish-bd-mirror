// src/components/admin/admin-sidebar/MobileSidebar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ChevronRight, Menu, X, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shared/admin";

import { type NavItem } from "./constants";
import { useFilteredNav } from "@/hooks/admin/use-filtered-nav";
import {
  prefersReducedMotion,
  isActive,
  isChildActive,
  isSectionActive,
  findActiveSectionId,
  loadOpenSections,
  saveOpenSections,
  press,
  useLogout,
} from "./helpers";

export function MobileSidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const filteredNav = useFilteredNav();

  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const drawerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevOpen = useRef<boolean | null>(null);

  /* ----------------------------------------------------------
   * Open sections hydration + auto-expand active
   * ---------------------------------------------------------- */

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

  /* ----------------------------------------------------------
   * Drawer animation — unchanged
   * ---------------------------------------------------------- */

  useEffect(() => {
    const drawer = drawerRef.current;
    const overlay = overlayRef.current;
    if (!drawer || !overlay) return;

    const first = prevOpen.current === null;
    if (!first && prevOpen.current === open) return;
    prevOpen.current = open;

    const instant = first || prefersReducedMotion();
    const items = drawer.querySelectorAll("[data-m='item']");
    gsap.killTweensOf([drawer, overlay, items]);

    if (open) {
      if (instant) {
        gsap.set(overlay, { autoAlpha: 1 });
        gsap.set(drawer, { xPercent: 0, autoAlpha: 1 });
      } else {
        gsap.to(overlay, { autoAlpha: 1, duration: 0.25, ease: "power1.out" });
        gsap.to(drawer, {
          xPercent: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: "power3.out",
        });
        gsap.fromTo(
          items,
          { x: -12, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.12,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
      }
    } else if (instant) {
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(drawer, { xPercent: -100, autoAlpha: 0 });
    } else {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.2, ease: "power1.in" });
      gsap.to(drawer, {
        xPercent: -100,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
          gsap.set(drawer, { autoAlpha: 0 });
        },
      });
    }

    if (!first) (open ? closeBtnRef : openBtnRef).current?.focus();
  }, [open]);

  /* ----------------------------------------------------------
   * Body scroll lock + Esc — unchanged
   * ---------------------------------------------------------- */

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Close on desktop breakpoint — unchanged */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Close on route change */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-brand-primary px-4 text-white md:hidden">
        <div className="flex items-center gap-3">
          <BrandMark className="size-8 text-xs" />
          <span className="font-heading text-base">Dorkari Admin</span>
        </div>
        <button
          ref={openBtnRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-95"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <div
        ref={overlayRef}
        aria-hidden
        onClick={() => setOpen(false)}
        className="invisible fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
      />

      <aside
        ref={drawerRef}
        id="admin-mobile-drawer"
        aria-label="Admin navigation"
        className={cn(
          "invisible fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl md:hidden",
          "bg-linear-to-b from-brand-primary to-brand-primary-dark text-white",
        )}
      >
        {/* Header — unchanged */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <BrandMark className="size-10 text-sm" />
            <div className="leading-tight">
              <p className="font-heading text-base">Dorkari Admin</p>
              <p className="text-[11px] text-white/50">Management panel</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="grid size-10 place-items-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4">
          <p className="px-1 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
            Menu
          </p>
          <div className="space-y-1">
            {filteredNav.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                pathname={pathname}
                open={openSections.includes(item.id)}
                onToggleSection={() => toggleSection(item.id)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </nav>

        {/* Footer — unchanged */}
        <div
          data-m="item"
          className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={logout}
            onPointerDown={(e) => press(e, true)}
            onPointerUp={(e) => press(e, false)}
            onPointerLeave={(e) => press(e, false)}
            className="flex h-11 w-full items-center rounded-md text-[15px] text-white/70 transition-colors hover:bg-destructive/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          >
            <span className="grid size-11 shrink-0 place-items-center">
              <LogOut className="size-[18px]" />
            </span>
            <span className="pr-3">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ============================================================
 * Mobile nav item
 * ============================================================ */

function MobileNavItem({
  item,
  pathname,
  open,
  onToggleSection,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  open: boolean;
  onToggleSection: () => void;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active = isSectionActive(pathname, item);

  /* Direct link */
  if (item.href) {
    return (
      <Link
        href={item.href}
        data-m="item"
        onClick={onNavigate}
        onPointerDown={(e) => press(e, true)}
        onPointerUp={(e) => press(e, false)}
        onPointerLeave={(e) => press(e, false)}
        className={cn(
          "relative flex h-11 items-center rounded-md text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          active
            ? "bg-brand-accent/10 text-white ring-1 ring-brand-accent/20"
            : "text-white/70 hover:bg-white/5 hover:text-white",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-accent" />
        )}
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center",
            active && "text-brand-accent",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="pr-3">{item.label}</span>
      </Link>
    );
  }

  /* Section */
  return (
    <div>
      <button
        type="button"
        data-m="item"
        aria-expanded={open}
        onClick={onToggleSection}
        onPointerDown={(e) => press(e, true)}
        onPointerUp={(e) => press(e, false)}
        onPointerLeave={(e) => press(e, false)}
        className={cn(
          "relative flex h-11 w-full items-center rounded-md text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          active
            ? "bg-brand-accent/10 text-white ring-1 ring-brand-accent/20"
            : "text-white/70 hover:bg-white/5 hover:text-white",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-accent" />
        )}
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center",
            active && "text-brand-accent",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="flex-1 pr-3 text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            "mr-3 size-4 shrink-0 text-white/50 transition-transform",
            open && "rotate-90",
          )}
          aria-hidden="true"
        />
      </button>

      {open && item.children && (
        <ul className="mt-1 space-y-0.5 pl-4">
          {item.children.map((child) => {
            const childActive = isChildActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex h-9 items-center rounded-md px-3 text-[13px] transition-colors",
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
}
