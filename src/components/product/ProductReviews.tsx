// src/components/product/ProductReviews.tsx

"use client";

import { useMemo, useState } from "react";
import { Star, ThumbsUp } from "lucide-react";

import type { Locale } from "@/lib/shop/types";
import type { Review } from "@/lib/product/types";
import { useLoadMore } from "@/hooks/use-load-more";

type SortOption = "recent" | "helpful";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${size} ${i < Math.round(value) ? "fill-brand-accent text-brand-accent" : "text-brand-border"}`}
        />
      ))}
    </div>
  );
}

function WriteReviewForm({
  locale,
  onSubmit,
}: {
  locale: Locale;
  onSubmit: (review: Review) => void;
}) {
  const [rating, setRating] = useState(5);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit({
      id: `local-${Date.now()}`,
      author:
        author.trim() || (locale === "bn" ? "অতিথি ব্যবহারকারী" : "Guest user"),
      rating,
      date: new Date().toISOString(),
      verified: false,
      body: { en: body, bn: body },
      helpfulCount: 0,
    });
    setAuthor("");
    setBody("");
    setRating(5);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brand-border p-4"
    >
      <div className="mb-3 flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            aria-label={`${i + 1} ${locale === "bn" ? "তারা" : "stars"}`}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${i < rating ? "fill-brand-accent text-brand-accent" : "text-brand-border"}`}
            />
          </button>
        ))}
      </div>
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder={
          locale === "bn" ? "আপনার নাম (ঐচ্ছিক)" : "Your name (optional)"
        }
        className="mb-2 w-full rounded-xl border border-brand-border bg-transparent px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          locale === "bn"
            ? "আপনার অভিজ্ঞতা লিখুন..."
            : "Share your experience..."
        }
        rows={3}
        className="mb-3 w-full resize-none rounded-xl border border-brand-border bg-transparent px-3.5 py-2.5 text-sm text-brand-text outline-none focus:border-brand-primary"
      />
      <button
        type="submit"
        className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
      >
        {locale === "bn" ? "রিভিউ জমা দিন" : "Submit review"}
      </button>
    </form>
  );
}

export default function ProductReviews({
  rating,
  reviewCount,
  reviews: initialReviews,
  locale = "en",
}: {
  rating: number;
  reviewCount: number;
  reviews: Review[];
  locale?: Locale;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [sort, setSort] = useState<SortOption>("recent");
  const [showForm, setShowForm] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...reviews];
    return sort === "recent"
      ? copy.sort((a, b) => +new Date(b.date) - +new Date(a.date))
      : copy.sort((a, b) => b.helpfulCount - a.helpfulCount);
  }, [reviews, sort]);

  const { visible, hasMore, sentinelRef } = useLoadMore(
    sorted,
    `${sort}-${reviews.length}`,
    4,
  );

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-24"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            id="reviews-heading"
            className="mb-2 font-heading text-xl font-bold text-brand-text sm:text-2xl"
          >
            {locale === "bn" ? "রেটিং ও রিভিউ" : "Ratings & reviews"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-heading text-3xl font-bold text-brand-text">
              {rating.toFixed(1)}
            </span>
            <div>
              <Stars value={rating} />
              <p className="mt-0.5 text-xs text-brand-text-secondary">
                {reviewCount.toLocaleString(
                  locale === "bn" ? "bn-BD" : "en-US",
                )}{" "}
                {locale === "bn" ? "জন রেটিং দিয়েছেন" : "ratings"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label={locale === "bn" ? "রিভিউ সাজান" : "Sort reviews"}
            className="rounded-full border border-brand-border bg-brand-surface px-3.5 py-2 text-xs font-medium text-brand-text"
          >
            <option value="recent">
              {locale === "bn" ? "সাম্প্রতিক" : "Most recent"}
            </option>
            <option value="helpful">
              {locale === "bn" ? "উপকারী" : "Most helpful"}
            </option>
          </select>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-white"
          >
            {locale === "bn" ? "রিভিউ লিখুন" : "Write a review"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <WriteReviewForm
            locale={locale}
            onSubmit={(review) => {
              setReviews((prev) => [review, ...prev]);
              setShowForm(false);
            }}
          />
        </div>
      )}

      <div className="flex flex-col divide-y divide-brand-border">
        {visible.map((review) => (
          <article key={review.id} className="py-5 first:pt-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Stars value={review.rating} size="h-3.5 w-3.5" />
              {review.verified && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {locale === "bn" ? "যাচাইকৃত ক্রয়" : "Verified purchase"}
                </span>
              )}
            </div>
            {review.title && (
              <h3 className="mb-1 text-sm font-semibold text-brand-text">
                {review.title[locale]}
              </h3>
            )}
            <p className="mb-2 text-sm leading-relaxed text-brand-text-secondary">
              {review.body[locale]}
            </p>
            <div className="flex items-center justify-between text-xs text-brand-text-secondary">
              <span>
                {review.author} ·{" "}
                {new Date(review.date).toLocaleDateString(
                  locale === "bn" ? "bn-BD" : "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
              <button
                type="button"
                className="flex items-center gap-1 hover:text-brand-primary"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {review.helpfulCount}
              </button>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="pt-2 text-center">
          <span className="text-xs text-brand-text-secondary">
            {locale === "bn"
              ? "আরও রিভিউ লোড হচ্ছে..."
              : "Loading more reviews…"}
          </span>
        </div>
      )}
    </section>
  );
}
