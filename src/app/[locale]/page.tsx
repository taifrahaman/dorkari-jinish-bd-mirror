// src/app/[locale]/page.tsx
import Hero from "@/components/hero/Hero";
import { ProductHero } from "@/components/product-hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProductHero />
      {/* Temporary spacer so you can scroll and test the sticky navbar */}
      <section
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          padding: "80px 24px",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Product grid goes here next
        </h2>
      </section>
    </main>
  );
}
