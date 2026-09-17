// src/components/shared/NotificationBell.tsx
"use client";

import { Bell } from "lucide-react";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  return (
    <button type="button" className={styles.button} aria-label="Notifications">
      <Bell size={18} />
      <span className={styles.dot} aria-hidden />
    </button>
  );
}
