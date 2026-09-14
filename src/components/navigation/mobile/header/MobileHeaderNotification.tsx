// src/components/navigation/mobile/header/MobileHeaderNotification.tsx

"use client";

import { Bell } from "lucide-react";
import styles from "./MobileHeader.module.css";

export default function MobileHeaderNotification() {
  const handleNotificationClick = () => {
    console.log("Notifications clicked");
  };

  return (
    <button
      type="button"
      className={styles.iconButton}
      onClick={handleNotificationClick}
      aria-label="Notifications"
    >
      <Bell size={21} strokeWidth={2} />

      <span className={styles.notificationDot} />
    </button>
  );
}
