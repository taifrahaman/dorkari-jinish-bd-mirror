// src/components/home/bazaar/StallBand.tsx
import CategoryRail, {
  type CategoryRailProps,
} from "@/components/home/category-rail/CategoryRail";
import { swatchVars } from "./bazaarPalette";
import styles from "./StallBand.module.css";

type Props = {
  rail: Pick<CategoryRailProps, "title" | "shopHref" | "products" | "palette">;
  locale: "en" | "bn";
  /** index into the bazaar palette */
  swatch: number;
  /** short painted-sign text on the awning */
  sign: { en: string; bn: string };
};

/** One stall = coloured awning on top + tinted wall behind a product rail. */
export default function StallBand({ rail, locale, swatch, sign }: Props) {
  return (
    <div className={styles.band} style={swatchVars(swatch)}>
      <span className={styles.awning} aria-hidden />
      <span className={styles.sign}>{sign[locale]}</span>
      <CategoryRail
        bare
        locale={locale}
        palette={rail.palette}
        title={rail.title}
        shopHref={rail.shopHref}
        products={rail.products}
      />
    </div>
  );
}
