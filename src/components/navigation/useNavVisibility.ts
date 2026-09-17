// src/components/navigation/useNavVisibility.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Navbar visibility driven purely by scroll position.
 * - scrollY <= threshold → visible
 * - scrollY >  threshold → hidden
 * rAF-throttled so mobile stays smooth.
 */
export function useNavVisibility(threshold = 8) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setVisible(window.scrollY <= threshold);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return visible;
}
