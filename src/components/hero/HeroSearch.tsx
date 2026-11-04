// src/components/hero/HeroSearch.tsx

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Search } from "lucide-react";

import { heroSearchPlaceholder, type SupportedLocale } from "./messages";
import styles from "./HeroSearch.module.css";

export default function HeroSearch() {
  const router = useRouter();
  const locale = useLocale() as SupportedLocale;

  const placeholder = heroSearchPlaceholder[locale] ?? heroSearchPlaceholder.en;

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/${locale}/search${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form className={styles.root} onSubmit={submit} role="search">
      <div className={styles.bar}>
        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={placeholder}
        />

        <button type="submit" className={styles.submit} aria-label="Search">
          <Search size={20} strokeWidth={2.4} />
        </button>
      </div>
    </form>
  );
}
