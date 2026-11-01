// src/components/home/bazaar/TrustStrip.tsx
import { Banknote, Phone, Truck, type LucideIcon } from "lucide-react";
import type { Lang } from "@/components/home-hero/heroCollections";
import { swatchVars } from "./bazaarPalette";
import styles from "./TrustStrip.module.css";

const COPY: Record<Lang, { delivery: string; cod: string; call: string }> = {
  bn: {
    delivery: "সারা দেশে ডেলিভারি",
    cod: "ক্যাশ অন ডেলিভারি",
    call: "ফোনে অর্ডার করুন",
  },
  en: {
    delivery: "Delivery across Bangladesh",
    cod: "Cash on delivery",
    call: "Order by phone",
  },
};

type Props = {
  locale: Lang;
  /** Optional. When given, a tappable phone item is added. e.g. "+8801XXXXXXXXX" */
  supportPhone?: string;
};

export default function TrustStrip({ locale, supportPhone }: Props) {
  const copy = COPY[locale];
  const items: Array<{ icon: LucideIcon; text: string; href?: string }> = [
    { icon: Truck, text: copy.delivery },
    { icon: Banknote, text: copy.cod },
  ];
  if (supportPhone) {
    items.push({ icon: Phone, text: copy.call, href: `tel:${supportPhone}` });
  }

  return (
    <section className={styles.strip}>
      <ul className={styles.list}>
        {items.map(({ icon: Icon, text, href }, i) => {
          const inner = (
            <>
              <span className={styles.icon} style={swatchVars(i + 1)}>
                <Icon size={22} strokeWidth={2} />
              </span>
              <span>{text}</span>
            </>
          );
          return (
            <li key={text} className={styles.item}>
              {href ? (
                <a href={href} className={styles.link}>
                  {inner}
                </a>
              ) : (
                <span className={styles.link}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
