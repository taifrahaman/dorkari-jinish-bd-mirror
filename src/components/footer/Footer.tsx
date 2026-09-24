// src/components/footer/Footer.tsx

"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, MessageCircle } from "lucide-react";

import { footerLinkGroups, footerSocialLinks } from "./footerLinks";
import BackToTopButton from "./BackToTopButton";

import styles from "./Footer.module.css";

const TICKER_ITEMS = [
  "Cash on Delivery",
  "Fast Delivery Across Bangladesh",
  "Easy 7-Day Returns",
  "100% Genuine Products",
  "Secure Checkout",
];

const TICKER_SET = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

type SocialVisual = {
  icon: ReactNode;
  badge: string;
  accent: string;
};

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="currentColor"
      >
        f
      </text>
    </svg>
  );
}

function getSocialVisual(label: string): SocialVisual {
  const key = label.trim().toLowerCase();

  if (key.includes("whatsapp")) {
    return {
      icon: <MessageCircle className={styles.socialIconSvg} />,
      badge: "#25d366",
      accent: "#25d366",
    };
  }

  if (key.includes("facebook")) {
    return {
      icon: <FacebookGlyph className={styles.socialIconSvg} />,
      badge: "#1877f2",
      accent: "#1877f2",
    };
  }

  return {
    icon: <ExternalLink className={styles.socialIconSvg} />,
    badge: "var(--color-brand-teal)",
    accent: "var(--color-brand-teal)",
  };
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      // Defer so we don't call setState synchronously inside the effect body.
      queueMicrotask(() => setRevealed(true));
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <footer ref={footerRef} className={styles.footer}>
      <div className={styles.ticker} aria-hidden="true">
        <div className={styles.tickerTrack}>
          {[...TICKER_SET, ...TICKER_SET].map((item, i) => {
            return (
              <span key={i} className={styles.tickerItem}>
                {item}
              </span>
            );
          })}
        </div>
      </div>

      <div className={styles.container}>
        <div className={`${styles.top} ${revealed ? styles.revealed : ""}`}>
          <div className={styles.brandCol}>
            <Link
              href="/"
              className={styles.brandLockup}
              aria-label="Dorkari Jinish home"
            >
              <span className={styles.logoBadge}>
                <span className={styles.logoBadgeInner}>
                  <Image
                    src="/logo/logo.png"
                    alt=""
                    width={42}
                    height={42}
                    className={styles.logoMark}
                  />
                </span>
              </span>

              <span className={styles.brandTextStack}>
                <span className={styles.brandName}>Dorkari Jinish</span>
                <span className={styles.brandAccentBar} aria-hidden="true" />
              </span>
            </Link>

            <p className={styles.brandDescription}>
              Useful things for everyday life.
            </p>
          </div>

          <div className={styles.navigation}>
            {footerLinkGroups.map((group) => {
              return (
                <div className={styles.linkGroup} key={group.title}>
                  <span className={styles.groupTitle}>{group.title}</span>

                  <nav
                    className={styles.links}
                    aria-label={`${group.title} links`}
                  >
                    {group.links.map((link) => {
                      return (
                        <Link
                          href={link.href}
                          className={styles.footerLink}
                          key={link.label}
                        >
                          <span>{link.label}</span>
                          <ArrowUpRight
                            className={styles.linkArrow}
                            aria-hidden="true"
                          />
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.socialShowcase}>
          {footerSocialLinks.map((social) => {
            const visual = getSocialVisual(social.label);
            const cardStyle = {
              "--social-badge": visual.badge,
              "--social-accent": visual.accent,
            } as CSSProperties;

            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialCard}
                style={cardStyle}
                aria-label={`${social.eyebrow} — ${social.label}`}
              >
                <span className={styles.socialCardIcon}>{visual.icon}</span>

                <span className={styles.socialCardText}>
                  <span className={styles.socialCardEyebrow}>
                    {social.eyebrow}
                  </span>
                  <span className={styles.socialCardLabel}>{social.label}</span>
                </span>

                <ArrowUpRight
                  className={styles.socialCardArrow}
                  aria-hidden="true"
                />
              </a>
            );
          })}
        </div>

        <div className={styles.signature} aria-hidden="true">
          <div className={styles.signatureTrack}>
            {Array.from({ length: 8 }, (_, i) => {
              return (
                <span key={i} className={styles.signatureWord}>
                  Dorkari Jinish
                  <span className={styles.signatureDot}>✦</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className={styles.bottomBar}>
          <span className={styles.bottomBrand}>
            <Image
              src="/logo/logo.png"
              alt=""
              width={16}
              height={16}
              className={styles.bottomLogo}
            />
            © {new Date().getFullYear()} Dorkari Jinish
          </span>

          <span className={styles.bottomTagline}>
            Made for everyday living.
          </span>

          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
