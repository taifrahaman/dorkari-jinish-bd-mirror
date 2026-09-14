// src/components/navigation/mobile/bottom-nav/BottomNavItem.tsx

"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "./MobileBottomNav.module.css";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

interface BottomNavItemProps {
  item: NavItem;
  pathname: string;
}

export default function BottomNavItem({ item, pathname }: BottomNavItemProps) {
  const Icon = item.icon;

  const isActive =
    item.id === "home"
      ? pathname === "/bn" || pathname === "/en"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={`${styles.item} ${isActive ? styles.active : ""}`}
    >
      <span className={styles.iconWrapper}>
        <Icon size={21} strokeWidth={isActive ? 2.3 : 1.8} />
      </span>

      <span className={styles.label}>{item.label}</span>
    </Link>
  );
}
