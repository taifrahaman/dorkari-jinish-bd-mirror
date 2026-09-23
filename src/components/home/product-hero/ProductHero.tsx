// src/components/product-hero/ProductHero.tsx

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

import gsap from "gsap";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { useLocale } from "next-intl";

import { productHeroSlides } from "./productHeroData";

import styles from "./ProductHero.module.css";

const TOTAL = productHeroSlides.length;
const COPIES = 3;
const MIDDLE_COPY_START = TOTAL;

type ProductHeroLocale = "en" | "bn";

const modulo = (value: number, length: number) => {
  return ((value % length) + length) % length;
};

export default function ProductHero() {
  const locale = useLocale() as ProductHeroLocale;
  const isBangla = locale === "bn";

  const [activeIndex, setActiveIndex] = useState(0);

  /* ==========================================================
       ROOT / TRACK
       ========================================================== */

  const rootRef = useRef<HTMLElement>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);

  /* ==========================================================
       PRODUCT CARD REFS
       ========================================================== */

  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /* ==========================================================
       PANEL REFS
       ========================================================== */

  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  const eyebrowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const descriptionRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  const offerRefs = useRef<Array<HTMLDivElement | null>>([]);

  const lineRefs = useRef<Array<Array<HTMLSpanElement | null>>>([]);

  /* ==========================================================
       BACKGROUNDS
       ========================================================== */

  const backgroundARef = useRef<HTMLDivElement>(null);

  const backgroundBRef = useRef<HTMLDivElement>(null);

  const currentBackgroundRef = useRef<0 | 1>(0);

  /* ==========================================================
       SLIDER STATE
       ========================================================== */

  const physicalIndexRef = useRef(MIDDLE_COPY_START);

  const activeIndexRef = useRef(0);

  const isAnimatingRef = useRef(false);

  /* ==========================================================
       DRAG
       ========================================================== */

  const draggingRef = useRef(false);

  const dragStartXRef = useRef(0);

  const dragStartTrackXRef = useRef(0);

  const dragMovedRef = useRef(false);

  /* ==========================================================
       GSAP
       ========================================================== */

  const trackSetterRef = useRef<((value: number) => void) | null>(null);

  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ==========================================================
       LOGICAL INDEX
       ========================================================== */

  const getLogicalIndex = useCallback((physicalIndex: number) => {
    return modulo(physicalIndex, TOTAL);
  }, []);

  /* ==========================================================
       BACKGROUND COLORS
       ========================================================== */

  const setBackgroundColors = useCallback(
    (element: HTMLDivElement | null, productIndex: number) => {
      if (!element) return;

      const atmosphere = productHeroSlides[productIndex].atmosphere;

      element.style.setProperty("--hero-base", atmosphere.base);

      element.style.setProperty("--hero-primary", atmosphere.primary);

      element.style.setProperty("--hero-secondary", atmosphere.secondary);

      element.style.setProperty("--hero-tertiary", atmosphere.tertiary);
    },
    [],
  );

  /* ==========================================================
       GET TARGET X
       ========================================================== */

  const getTargetX = useCallback((physicalIndex: number) => {
    const viewport = viewportRef.current;

    const card = cardRefs.current[physicalIndex];

    if (!viewport || !card) {
      return 0;
    }

    const viewportCenter = viewport.clientWidth / 2;

    const cardCenter = card.offsetLeft + card.offsetWidth / 2;

    return viewportCenter - cardCenter;
  }, []);

  /* ==========================================================
       SET TRACK X
       ========================================================== */

  const setTrackX = useCallback((x: number) => {
    const setter = trackSetterRef.current;

    if (setter) {
      setter(x);
      return;
    }

    const track = trackRef.current;

    if (!track) return;

    gsap.set(track, { x });
  }, []);

  /* ==========================================================
       FOCUS CARD
       ========================================================== */

  const focusCard = useCallback((physicalIndex: number, immediate = false) => {
    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      const focused = index === physicalIndex;

      const values = {
        scale: focused ? 1 : 0.78,

        opacity: focused ? 1 : 0.45,

        y: focused ? -6 : 8,
      };

      if (immediate) {
        gsap.set(card, values);
      } else {
        gsap.to(card, {
          ...values,
          duration: 0.55,
          ease: "power3.out",
          overwrite: true,
        });
      }
    });
  }, []);

  /* ==========================================================
       TRANSITION
       ========================================================== */

  const transitionTo = useCallback(
    (requestedPhysicalIndex: number) => {
      if (TOTAL === 0 || isAnimatingRef.current) {
        return;
      }

      const currentPhysical = physicalIndexRef.current;

      const nextPhysical = requestedPhysicalIndex;

      if (nextPhysical === currentPhysical) {
        const target = getTargetX(nextPhysical);

        gsap.to(trackRef.current, {
          x: target,
          duration: 0.35,
          ease: "power3.out",
          overwrite: true,
        });

        return;
      }

      const currentLogical = getLogicalIndex(currentPhysical);

      const nextLogical = getLogicalIndex(nextPhysical);

      const direction = nextPhysical > currentPhysical ? 1 : -1;

      const oldPanel = panelRefs.current[currentLogical];

      const newPanel = panelRefs.current[nextLogical];

      const oldEyebrow = eyebrowRefs.current[currentLogical];

      const newEyebrow = eyebrowRefs.current[nextLogical];

      const oldDescription = descriptionRefs.current[currentLogical];

      const newDescription = descriptionRefs.current[nextLogical];

      const oldOffer = offerRefs.current[currentLogical];

      const newOffer = offerRefs.current[nextLogical];

      const oldLines = lineRefs.current[currentLogical] ?? [];

      const newLines = lineRefs.current[nextLogical] ?? [];

      const track = trackRef.current;

      if (!track) return;

      isAnimatingRef.current = true;

      activeIndexRef.current = nextLogical;

      setActiveIndex(nextLogical);

      physicalIndexRef.current = nextPhysical;

      /* --------------------------------------------------------
               Incoming panel
               -------------------------------------------------------- */

      if (newPanel) {
        gsap.set(newPanel, {
          autoAlpha: 1,
          pointerEvents: "auto",
        });
      }

      gsap.set(newLines, {
        yPercent: direction * 105,
        opacity: 0,
      });

      gsap.set([newEyebrow, newDescription, newOffer], {
        y: direction * 16,
        opacity: 0,
      });

      /* --------------------------------------------------------
               Background
               -------------------------------------------------------- */

      const nextBackground =
        currentBackgroundRef.current === 0
          ? backgroundBRef.current
          : backgroundARef.current;

      const oldBackground =
        currentBackgroundRef.current === 0
          ? backgroundARef.current
          : backgroundBRef.current;

      setBackgroundColors(nextBackground, nextLogical);

      gsap.set(nextBackground, {
        autoAlpha: 0,
        scale: 1.04,
      });

      const targetX = getTargetX(nextPhysical);

      /* --------------------------------------------------------
               Timeline
               -------------------------------------------------------- */

      const tl = gsap.timeline({
        onComplete: () => {
          if (oldPanel) {
            gsap.set(oldPanel, {
              autoAlpha: 0,
              pointerEvents: "none",
            });
          }

          currentBackgroundRef.current =
            currentBackgroundRef.current === 0 ? 1 : 0;

          let resetPhysical = nextPhysical;

          if (nextPhysical < TOTAL) {
            resetPhysical = TOTAL + nextLogical;
          } else if (nextPhysical >= TOTAL * 2) {
            resetPhysical = TOTAL + nextLogical;
          }

          if (resetPhysical !== nextPhysical) {
            const resetX = getTargetX(resetPhysical);

            gsap.set(track, {
              x: resetX,
            });

            physicalIndexRef.current = resetPhysical;

            focusCard(resetPhysical, true);
          } else {
            focusCard(nextPhysical, true);
          }

          isAnimatingRef.current = false;
        },
      });

      /* ========================================================
               OUTGOING HEADLINE
               ======================================================== */

      tl.to(
        oldLines,
        {
          yPercent: direction * -110,
          opacity: 0,
          duration: 0.32,
          stagger: 0.035,
          ease: "power4.in",
        },
        0,
      );

      /* ========================================================
               OUTGOING SUPPORTING CONTENT
               ======================================================== */

      tl.to(
        [oldEyebrow, oldDescription, oldOffer],
        {
          y: direction * -15,
          opacity: 0,
          duration: 0.28,
          ease: "power3.in",
        },
        0.03,
      );

      /* ========================================================
               BACKGROUND
               ======================================================== */

      tl.to(
        oldBackground,
        {
          autoAlpha: 0,
          scale: 1.02,
          duration: 0.8,
          ease: "power2.inOut",
        },
        0,
      );

      tl.to(
        nextBackground,
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.9,
          ease: "power2.inOut",
        },
        0,
      );

      /* ========================================================
               PRODUCT TRACK
               ======================================================== */

      tl.to(
        track,
        {
          x: targetX,
          duration: 0.72,
          ease: "power4.inOut",
          overwrite: true,
        },
        0,
      );

      /* ========================================================
               PRODUCT CARDS
               ======================================================== */

      cardRefs.current.forEach((card, index) => {
        if (!card) return;

        const focused = index === nextPhysical;

        tl.to(
          card,
          {
            scale: focused ? 1 : 0.78,

            opacity: focused ? 1 : 0.45,

            y: focused ? -6 : 8,

            duration: 0.58,

            ease: "power3.out",

            overwrite: true,
          },
          0,
        );
      });

      /* ========================================================
               INCOMING HEADLINE
               ======================================================== */

      tl.to(
        newLines,
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power4.out",
        },
        0.3,
      );

      /* ========================================================
               INCOMING EYEBROW
               ======================================================== */

      tl.to(
        newEyebrow,
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
        },
        0.37,
      );

      /* ========================================================
               INCOMING DESCRIPTION
               ======================================================== */

      tl.to(
        newDescription,
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
        },
        0.42,
      );

      /* ========================================================
               INCOMING OFFER
               ======================================================== */

      tl.to(
        newOffer,
        {
          y: 0,
          opacity: 1,
          duration: 0.42,
          ease: "power3.out",
        },
        0.46,
      );
    },
    [focusCard, getLogicalIndex, getTargetX, setBackgroundColors],
  );

  /* ==========================================================
       NEXT
       ========================================================== */

  const nextSlide = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }

    transitionTo(physicalIndexRef.current + 1);
  }, [transitionTo]);

  /* ==========================================================
       PREVIOUS
       ========================================================== */

  const previousSlide = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }

    transitionTo(physicalIndexRef.current - 1);
  }, [transitionTo]);

  /* ==========================================================
       GO TO PRODUCT
       ========================================================== */

  const goToProduct = useCallback(
    (logicalIndex: number) => {
      if (isAnimatingRef.current) {
        return;
      }

      const current = physicalIndexRef.current;

      const candidates = [
        logicalIndex,
        logicalIndex + TOTAL,
        logicalIndex + TOTAL * 2,
      ];

      let closest = candidates[0];

      let distance = Math.abs(closest - current);

      candidates.forEach((candidate) => {
        const candidateDistance = Math.abs(candidate - current);

        if (candidateDistance < distance) {
          closest = candidate;

          distance = candidateDistance;
        }
      });

      transitionTo(closest);
    },
    [transitionTo],
  );

  /* ==========================================================
       FIND CLOSEST CARD
       ========================================================== */

  const findClosestCard = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return physicalIndexRef.current;
    }

    const viewportRect = viewport.getBoundingClientRect();

    const center = viewportRect.left + viewportRect.width / 2;

    let closest = physicalIndexRef.current;

    let smallestDistance = Infinity;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      const rect = card.getBoundingClientRect();

      const cardCenter = rect.left + rect.width / 2;

      const distance = Math.abs(cardCenter - center);

      if (distance < smallestDistance) {
        smallestDistance = distance;

        closest = index;
      }
    });

    return closest;
  }, []);

  /* ==========================================================
       POINTER DOWN
       ========================================================== */

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) {
      return;
    }

    const track = trackRef.current;

    if (!track) return;

    draggingRef.current = true;

    dragMovedRef.current = false;

    dragStartXRef.current = event.clientX;

    dragStartTrackXRef.current = Number(gsap.getProperty(track, "x")) || 0;

    gsap.killTweensOf(track);

    track.setPointerCapture(event.pointerId);
  };

  /* ==========================================================
       POINTER MOVE
       ========================================================== */

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    const delta = event.clientX - dragStartXRef.current;

    if (Math.abs(delta) > 5) {
      dragMovedRef.current = true;
    }

    setTrackX(dragStartTrackXRef.current + delta);
  };

  /* ==========================================================
       POINTER UP
       ========================================================== */

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (!track) return;

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }

    draggingRef.current = false;

    if (!dragMovedRef.current) {
      return;
    }

    const closest = findClosestCard();

    transitionTo(closest);

    dragMovedRef.current = false;
  };

  /* ==========================================================
       WHEEL
       ========================================================== */

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) {
      return;
    }

    let delta = event.deltaX;

    if (Math.abs(delta) < Math.abs(event.deltaY) && event.shiftKey) {
      delta = event.deltaY;
    }

    if (Math.abs(delta) < 0.5) {
      return;
    }

    event.preventDefault();

    const track = trackRef.current;

    if (!track) return;

    gsap.killTweensOf(track);

    const currentX = Number(gsap.getProperty(track, "x")) || 0;

    setTrackX(currentX - delta);

    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current);
    }

    wheelTimeoutRef.current = setTimeout(() => {
      const closest = findClosestCard();

      transitionTo(closest);
    }, 100);
  };

  /* ==========================================================
       INITIALIZATION
       ========================================================== */

  useLayoutEffect(() => {
    if (!TOTAL) return;

    const track = trackRef.current;

    if (!track) return;

    trackSetterRef.current = gsap.quickSetter(track, "x", "px") as (
      value: number,
    ) => void;

    setBackgroundColors(backgroundARef.current, 0);

    setBackgroundColors(backgroundBRef.current, TOTAL > 1 ? 1 : 0);

    gsap.set(backgroundARef.current, {
      autoAlpha: 1,
      scale: 1,
    });

    gsap.set(backgroundBRef.current, {
      autoAlpha: 0,
      scale: 1.04,
    });

    panelRefs.current.forEach((panel, index) => {
      if (!panel) return;

      const visible = index === 0;

      gsap.set(panel, {
        autoAlpha: visible ? 1 : 0,

        pointerEvents: visible ? "auto" : "none",
      });

      if (visible) {
        gsap.set(lineRefs.current[index] ?? [], {
          yPercent: 0,
          opacity: 1,
        });

        gsap.set(
          [
            eyebrowRefs.current[index],

            descriptionRefs.current[index],

            offerRefs.current[index],
          ],
          {
            y: 0,
            opacity: 1,
          },
        );
      }
    });

    const frame = requestAnimationFrame(() => {
      const startX = getTargetX(MIDDLE_COPY_START);

      gsap.set(track, {
        x: startX,
      });

      focusCard(MIDDLE_COPY_START, true);
    });

    return () => {
      cancelAnimationFrame(frame);

      gsap.killTweensOf(track);
    };
  }, [focusCard, getTargetX, setBackgroundColors]);

  /* ==========================================================
       LOCALE CHANGE
       ========================================================== */

  useEffect(() => {
    const currentLogical = activeIndexRef.current;

    const currentPanel = panelRefs.current[currentLogical];

    if (!currentPanel) {
      return;
    }

    gsap.set(currentPanel, {
      autoAlpha: 1,
      pointerEvents: "auto",
    });
  }, [locale]);

  /* ==========================================================
       RESIZE
       ========================================================== */

  useEffect(() => {
    const handleResize = () => {
      if (isAnimatingRef.current) {
        return;
      }

      const physical = physicalIndexRef.current;

      const target = getTargetX(physical);

      gsap.to(trackRef.current, {
        x: target,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [getTargetX]);

  /* ==========================================================
       KEYBOARD
       ========================================================== */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        nextSlide();
      }

      if (event.key === "ArrowLeft") {
        previousSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextSlide, previousSlide]);

  /* ==========================================================
       EMPTY STATE
       ========================================================== */

  if (!TOTAL) {
    return null;
  }

  /* ==========================================================
       LOCALE CLASS HELPERS
       ========================================================== */

  const banglaClass = isBangla ? styles.banglaText : "";

  /* ==========================================================
       RENDER
       ========================================================== */

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-label={locale === "bn" ? "নির্বাচিত পণ্যসমূহ" : "Featured products"}
    >
      <div ref={backgroundARef} className={styles.backgroundLayer} />

      <div ref={backgroundBRef} className={styles.backgroundLayer} />

      <div className={styles.backgroundVignette} />

      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.copyViewport}>
            {productHeroSlides.map((product, index) => {
              const title = product.title[locale];

              return (
                <div
                  key={product.id}
                  ref={(element) => {
                    panelRefs.current[index] = element;
                  }}
                  className={styles.copyPanel}
                >
                  {/* EYEBROW */}

                  <div
                    ref={(element) => {
                      eyebrowRefs.current[index] = element;
                    }}
                    className={`${styles.eyebrow} ${banglaClass}`}
                  >
                    <span className={styles.eyebrowDot} />

                    {product.eyebrow[locale]}
                  </div>

                  {/* HEADLINE */}

                  <h2 className={`${styles.headline} ${banglaClass}`}>
                    {title.split("\n").map((line, lineIndex) => (
                      <span
                        key={`${product.id}-${locale}-${lineIndex}`}
                        className={`${styles.lineMask} ${
                          isBangla ? styles.banglaLineMask : ""
                        }`}
                      >
                        <span
                          ref={(element) => {
                            if (!lineRefs.current[index]) {
                              lineRefs.current[index] = [];
                            }

                            lineRefs.current[index][lineIndex] = element;
                          }}
                          className={`${styles.headlineLine} ${banglaClass}`}
                        >
                          {line}
                        </span>
                      </span>
                    ))}
                  </h2>

                  {/* DESCRIPTION */}

                  <p
                    ref={(element) => {
                      descriptionRefs.current[index] = element;
                    }}
                    className={`${styles.description} ${banglaClass}`}
                  >
                    {product.description[locale]}
                  </p>

                  {/* OFFER */}

                  <div
                    ref={(element) => {
                      offerRefs.current[index] = element;
                    }}
                    className={styles.offer}
                  >
                    <div className={styles.priceBlock}>
                      <span className={`${styles.priceLabel} ${banglaClass}`}>
                        {locale === "bn" ? "শুরু হচ্ছে" : "STARTING FROM"}
                      </span>

                      <strong className={`${styles.price} ${banglaClass}`}>
                        {product.price[locale]}
                      </strong>
                    </div>

                    <a
                      href={product.href}
                      className={`${styles.cta} ${banglaClass}`}
                    >
                      {locale === "bn" ? "এখনই কিনুন" : "SHOP NOW"}

                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PRODUCTS */}

        <div className={styles.showcase}>
          <div
            ref={viewportRef}
            className={styles.productViewport}
            onWheel={handleWheel}
          >
            <div
              ref={trackRef}
              className={styles.track}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {Array.from(
                {
                  length: TOTAL * COPIES,
                },
                (_, physicalIndex) => {
                  const logicalIndex = getLogicalIndex(physicalIndex);

                  const product = productHeroSlides[logicalIndex];

                  const productName = product.shortName[locale];

                  const productPrice = product.price[locale];

                  return (
                    <button
                      key={`${product.id}-${physicalIndex}`}
                      ref={(element) => {
                        cardRefs.current[physicalIndex] = element;
                      }}
                      type="button"
                      className={styles.card}
                      onClick={() => {
                        if (dragMovedRef.current) {
                          return;
                        }

                        goToProduct(logicalIndex);
                      }}
                      aria-label={
                        locale === "bn"
                          ? `${productName} দেখুন`
                          : `View ${productName}`
                      }
                    >
                      <span className={styles.productCircle}>
                        <span className={styles.circleGlow} />

                        {product.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={productName}
                            className={styles.productImage}
                            draggable={false}
                          />
                        )}
                      </span>

                      <span className={styles.productMeta}>
                        <span
                          className={`${styles.productName} ${banglaClass}`}
                        >
                          {productName}
                        </span>
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* CONTROLS */}

          <div className={styles.controls}>
            <button
              type="button"
              className={styles.navButton}
              onClick={previousSlide}
              aria-label={locale === "bn" ? "আগের পণ্য" : "Previous product"}
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.counter}>
              <span>{String(activeIndex + 1).padStart(2, "0")}</span>

              <i />

              <span>{String(TOTAL).padStart(2, "0")}</span>
            </div>

            <button
              type="button"
              className={styles.navButton}
              onClick={nextSlide}
              aria-label={locale === "bn" ? "পরের পণ্য" : "Next product"}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
