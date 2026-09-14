// src/components/navigation/mobile/announcement/MobileAnnouncement.tsx

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AnnouncementMessage from "./AnnouncementMessage";
import styles from "./MobileAnnouncement.module.css";
import { announcementMessages } from "../constants/announcementMessages";

export default function MobileAnnouncement() {
  const pathname = usePathname();

  const locale = pathname.startsWith("/en") ? "en" : "bn";

  const messages = announcementMessages[locale];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
  }, [locale]);

  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % messages.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [messages.length]);

  return (
    <section className={styles.announcement}>
      <AnnouncementMessage message={messages[activeIndex]} />

      <div className={styles.indicators}>
        {messages.map((_, index) => (
          <span
            key={index}
            className={`${styles.indicator} ${
              index === activeIndex ? styles.active : ""
            }`}
          />
        ))}
      </div>
    </section>
  );
}
