// src/components/product/ProductGallery.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ZoomIn } from "lucide-react";

import type { LocalizedText, ProductImage } from "@/lib/product/types";
import type { Locale } from "@/lib/shop/types";

type ProductGalleryProps = {
  images: ProductImage[];
  productName: LocalizedText;
  locale?: Locale;
};

export default function ProductGallery({
  images,
  productName,
  locale = "en",
}: ProductGalleryProps) {
  const imageSetKey = images.map((image) => image.id).join("|");

  return (
    <ProductGalleryInner
      key={imageSetKey}
      images={images}
      productName={productName}
      locale={locale}
    />
  );
}

function ProductGalleryInner({
  images,
  productName,
  locale = "en",
}: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const thumbRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const indicatorRef = useRef<HTMLDivElement>(null);
  const prevIndex = useRef(0);
  const firstRun = useRef(true);

  const active = images[index] ?? images[0];

  useEffect(() => {
    const img = imgRef.current;
    const thumb = thumbRefs.current.get(index);
    const indicator = indicatorRef.current;

    if (firstRun.current) {
      firstRun.current = false;

      if (thumb && indicator) {
        gsap.set(indicator, {
          x: thumb.offsetLeft,
          y: thumb.offsetTop,
          width: thumb.offsetWidth,
          height: thumb.offsetHeight,
        });
      }

      return;
    }

    const dir = index >= prevIndex.current ? 1 : -1;
    prevIndex.current = index;

    if (img) {
      gsap.fromTo(
        img,
        {
          opacity: 0,
          x: 14 * dir,
          scale: 1.02,
        },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.4,
          ease: "power3.out",
        },
      );
    }

    if (thumb && indicator) {
      gsap.to(indicator, {
        x: thumb.offsetLeft,
        y: thumb.offsetTop,
        width: thumb.offsetWidth,
        height: thumb.offsetHeight,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [index]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) return;

    setPos({
      x: Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
      ),
    });
  };

  if (!active) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {/* Thumbnails: horizontal scroll on mobile, vertical rail on desktop */}
      <div className="relative order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:w-20 sm:flex-none sm:flex-col sm:overflow-visible sm:pb-0">
        <div
          ref={indicatorRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-0 rounded-xl ring-2 ring-brand-primary transition-none"
          style={{
            width: 0,
            height: 0,
          }}
        />

        {images.map((img, i) => (
          <button
            key={img.id}
            ref={(el) => {
              if (el) {
                thumbRefs.current.set(i, el);
              } else {
                thumbRefs.current.delete(i);
              }
            }}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={img.alt[locale]}
            aria-current={i === index}
            className="relative z-[1] h-16 w-16 flex-none overflow-hidden rounded-xl bg-brand-navbar"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Main stage */}
      <div className="order-1 flex-1 sm:order-2">
        <div
          ref={stageRef}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMove}
          className="group relative aspect-square overflow-hidden rounded-3xl bg-brand-navbar"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={active.src}
            alt={active.alt[locale] || productName[locale]}
            className="h-full w-full object-cover"
          />

          {/* Zoom lens */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-150 sm:block"
            style={{
              backgroundImage: `url(${active.src})`,
              backgroundSize: "220%",
              backgroundPosition: `${pos.x}% ${pos.y}%`,
              opacity: zoomed ? 1 : 0,
            }}
          />

          <span className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white sm:flex">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            {locale === "bn" ? "হভার করে জুম করুন" : "Hover to zoom"}
          </span>
        </div>

        {/* Dots for mobile */}
        <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={img.alt[locale]}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-brand-primary" : "w-1.5 bg-brand-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
