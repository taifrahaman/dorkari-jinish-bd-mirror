// src/components/navigation/useNavVisibility.ts

"use client";

import { useEffect, useRef, useState } from "react";

type NavState = {
  visible: boolean;
  scrolledUp: boolean;
};

export function useNavVisibility(): NavState {
  const [state, setState] = useState<NavState>({
    visible: true,
    scrolledUp: false,
  });

  const lastScrollY = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    const updateNavbar = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollY.current;

      /*
       * ==========================================
       * AT THE TOP
       * ==========================================
       *
       * Always restore the original glass navbar.
       */
      if (currentScrollY <= 0) {
        setState({
          visible: true,
          scrolledUp: false,
        });

        lastScrollY.current = 0;
        ticking.current = false;

        return;
      }

      const difference = currentScrollY - previousScrollY;

      /*
       * Ignore tiny movements caused by trackpads,
       * touchpads, or browser scroll noise.
       */
      if (Math.abs(difference) >= 3) {
        if (difference > 0) {
          /*
           * ========================================
           * SCROLLING DOWN
           * ========================================
           *
           * Hide the navbar while actively scrolling.
           */
          setState({
            visible: false,
            scrolledUp: false,
          });
        } else {
          /*
           * ========================================
           * SCROLLING UP
           * ========================================
           *
           * Show the navbar immediately.
           * Because we're away from the top, it is white.
           */
          setState({
            visible: true,
            scrolledUp: true,
          });
        }

        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      /*
       * Every scroll event means the user is still moving.
       * Restart the stop timer.
       */
      if (stopTimer.current !== null) {
        clearTimeout(stopTimer.current);
      }

      /*
       * Update direction/visibility once per animation frame.
       */
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(updateNavbar);
      }

      /*
       * ==========================================
       * SCROLL STOP DETECTION
       * ==========================================
       *
       * If no scroll event happens for 160ms,
       * consider scrolling stopped.
       */
      stopTimer.current = setTimeout(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY <= 0) {
          /*
           * We reached the top.
           * Restore glass navbar.
           */
          setState({
            visible: true,
            scrolledUp: false,
          });
        } else {
          /*
           * Scrolling has stopped somewhere below
           * the top.
           *
           * ALWAYS show the navbar and make it WHITE.
           *
           * This is the important part.
           */
          setState({
            visible: true,
            scrolledUp: true,
          });
        }
      }, 280);
    };

    /*
     * Initial scroll position.
     */
    lastScrollY.current = window.scrollY;

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (stopTimer.current !== null) {
        clearTimeout(stopTimer.current);
      }
    };
  }, []);

  return state;
}
