// src/components/layout/StickyFooterShell.tsx

import styles from "./StickyFooterShell.module.css";

type Props = {
  /** Everything above the footer — your page's normal content. */
  children: React.ReactNode;
  /** The <Footer /> itself. */
  footer: React.ReactNode;
};

/**
 * The "sticky reveal" footer, done the documented way: no measured
 * negative margin, no ResizeObserver, no scroll-driven animation at
 * all. `pageWrapper` and `footerSticky` are plain siblings —
 * `footerSticky` is `position: sticky; bottom: 0` with a lower
 * z-index, so it's pinned at the bottom of the viewport for the
 * *entire* scroll (sticky has nothing after it to stop it), and
 * simply stays hidden behind pageWrapper's opaque, rounded-corner
 * box until that box scrolls up far enough to uncover it. See
 * https://piccalil.li/blog/sticky-revealing-footer/ for the same
 * z-index-stacking idea.
 *
 * There used to be a GSAP ScrollTrigger layer here that shrank
 * pageWrapper (scale + border-radius) as it scrolled away, as an
 * extra depth cue. It's gone: a plain `scale` shrinks WIDTH as well
 * as height, which opened gaps on the left/right edges of the page,
 * and scaling live text via a CSS transform blurs it slightly as the
 * browser rasterizes the layer. The reveal itself doesn't need it —
 * this plain version has no server/client boundary either, since
 * there's nothing left to animate.
 */
export default function StickyFooterShell({ children, footer }: Props) {
  return (
    <>
      <div className={styles.pageWrapper}>{children}</div>

      <div className={styles.footerSticky}>{footer}</div>
    </>
  );
}
