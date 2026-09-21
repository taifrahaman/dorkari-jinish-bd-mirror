// src/components/shared/Button.tsx

"use client";

import Link from "next/link";
import {
  forwardRef,
  type CSSProperties,
  type ReactNode,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type Ref,
} from "react";

import styles from "./Button.module.css";

/* ============================================================
   Types
   ============================================================ */

type CommonProps = {
  /** Icon rendered after the label (e.g. an arrow). */
  trailingIcon?: ReactNode;
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode;

  /**
   * Any valid CSS font-size: `"14px"`, `"1.1rem"`, `16` (→ px).
   * Defaults to the size defined in the CSS module (14px).
   */
  fontSize?: string | number;

  /** True → use `letter-spacing: 0` (recommended for Bangla). */
  bangla?: boolean;

  className?: string;

  children: ReactNode;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  external?: undefined;
} & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children" | "style"
  >;

type ButtonAsLink = CommonProps & {
  href: string;
  external?: boolean;
} & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "className" | "children" | "style" | "href"
  >;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/* ============================================================
   Component
   ============================================================ */

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    trailingIcon,
    leadingIcon,
    fontSize,
    bangla = false,
    className = "",
    children,
    ...rest
  } = props;

  const classes = [styles.button, bangla && styles.bangla, className]
    .filter(Boolean)
    .join(" ");

  /* Inline style only when a fontSize override is provided, so
       the CSS-module default (14px) is untouched otherwise. */
  const style: CSSProperties | undefined =
    fontSize !== undefined
      ? {
          fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize,
        }
      : undefined;

  const inner = (
    <>
      {leadingIcon && (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}

      <span>{children}</span>

      {trailingIcon && (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </>
  );

  /* ---------------------------- Link ---------------------------- */
  if ("href" in rest && rest.href) {
    const { href, external, ...anchorRest } = rest as ButtonAsLink;

    if (external) {
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          style={style}
          {...anchorRest}
        >
          {inner}
        </a>
      );
    }

    return (
      <Link
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        style={style}
        {...anchorRest}
      >
        {inner}
      </Link>
    );
  }

  /* --------------------------- Button --------------------------- */
  const buttonRest = rest as ButtonAsButton;

  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={buttonRest.type ?? "button"}
      className={classes}
      style={style}
      {...buttonRest}
    >
      {inner}
    </button>
  );
});

export default Button;
