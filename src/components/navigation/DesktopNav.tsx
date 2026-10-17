// src/components/navigation/DesktopNav.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ShoppingCart,
  User,
  Package,
  LogOut,
  Search, // <-- Added Search icon
} from "lucide-react";

import CategoryMenu from "./CategoryMenu";
// REMOVED: import NavSearch from "./NavSearch";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import NotificationBell from "@/components/shared/NotificationBell";
import { primaryNavLinks, type CategoryNode } from "./navItems";
import { useHydration } from "@/lib/stores/useHydration";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useUIStore } from "@/lib/stores/useUIStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import styles from "./DesktopNav.module.css";

type Props = {
  categories: CategoryNode[];
};

export default function DesktopNav({ categories }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const hydrated = useHydration();
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useUIStore((s) => s.toggleCart);
  const setIsSearchOpen = useUIStore((s) => s.setIsSearchOpen); // <-- Added

  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);

  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logoutStore();
      setIsProfileOpen(false);
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className={styles.root}>
      <Link
        href={`/${locale}`}
        className={styles.logo}
        aria-label="Dorkari Jinish — Home"
      >
        <Image
          src="/logo/logo.png"
          alt=""
          width={48}
          height={48}
          className={styles.logoMark}
        />
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        <button
          type="button"
          className={styles.navLink}
          onMouseEnter={() => setCategoryOpen(true)}
          onClick={() => setCategoryOpen((v) => !v)}
          aria-expanded={categoryOpen}
          aria-haspopup="menu"
        >
          Category
          <ChevronDown
            size={14}
            className={styles.chevron}
            data-open={categoryOpen}
          />
        </button>

        {primaryNavLinks.map((link) => (
          <Link
            key={link.id}
            href={`/${locale}${link.href === "/" ? "" : link.href}`}
            className={styles.navLink}
            data-active={isActive(link.href)}
          >
            {link.label}
          </Link>
        ))}

        <CategoryMenu
          open={categoryOpen}
          categories={categories}
          onClose={() => setCategoryOpen(false)}
        />
      </nav>

      <div className={styles.actions}>
        {/* Replaced NavSearch with a button that opens the overlay */}
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Search"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={18} />
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Account"
            onClick={() => {
              if (!user) router.push(`/${locale}/login`);
              else setIsProfileOpen((v) => !v);
            }}
            aria-expanded={isProfileOpen}
          >
            <User size={18} />
          </button>

          {user && isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-56 origin-top-right rounded-2xl border border-brand-border bg-brand-surface p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="mb-2 border-b border-brand-border px-3 pb-3 pt-2">
                <p className="truncate text-sm font-semibold text-brand-text">
                  {user.name}
                </p>
                <p className="truncate text-xs text-brand-text-secondary">
                  {user.email || user.phone}
                </p>
              </div>
              <Link
                href={`/${locale}/profile`}
                onClick={() => setIsProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-text transition-colors hover:bg-brand-navbar"
              >
                <User className="h-4 w-4 text-brand-text-secondary" /> My
                Profile
              </Link>
              <Link
                href={`/${locale}/profile/orders`}
                onClick={() => setIsProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-text transition-colors hover:bg-brand-navbar"
              >
                <Package className="h-4 w-4 text-brand-text-secondary" /> My
                Orders
              </Link>
              <div className="my-1 border-t border-brand-border" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>

        <NotificationBell />

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Cart"
          onClick={toggleCart}
        >
          <ShoppingCart size={18} />
          {hydrated && totalItems > 0 && (
            <span className={styles.badge}>{totalItems}</span>
          )}
        </button>

        <LanguageSwitcher />
      </div>
    </div>
  );
}
