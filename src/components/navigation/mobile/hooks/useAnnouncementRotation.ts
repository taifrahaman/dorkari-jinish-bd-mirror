// src/components/navigation/mobile/hooks/useAnnouncementRotation.ts

"use client";

import { useEffect, useState } from "react";

interface UseAnnouncementRotationOptions {
  count: number;
  interval?: number;
}

export function useAnnouncementRotation({
  count,
  interval = 4500,
}: UseAnnouncementRotationOptions) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % count);
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [count, interval]);

  return {
    activeIndex,
    setActiveIndex,
  };
}
