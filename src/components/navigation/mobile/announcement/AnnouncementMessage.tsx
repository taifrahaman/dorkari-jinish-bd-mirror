// src/components/navigation/mobile/announcement/AnnouncementMessage.tsx

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./MobileAnnouncement.module.css";

interface Announcement {
  title: string;
  subtitle: string;
}

interface AnnouncementMessageProps {
  message: Announcement;
}

export default function AnnouncementMessage({
  message,
}: AnnouncementMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.children;

    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 8,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.06,
        ease: "power2.out",
      },
    );
  }, [message]);

  return (
    <div ref={containerRef} className={styles.message}>
      <p className={styles.title}>{message.title}</p>
    </div>
  );
}
