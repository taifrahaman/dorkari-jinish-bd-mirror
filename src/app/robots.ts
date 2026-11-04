// src/app/robots.ts

import type { MetadataRoute } from "next";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorkarijinish.bd"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/*/cart",
        "/*/checkout",
        "/*/profile",
        "/*/login",
        "/*/register",
        "/*/wishlist",
        "/*/search",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
