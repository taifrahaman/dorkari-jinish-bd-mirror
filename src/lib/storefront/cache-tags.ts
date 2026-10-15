// src/lib/storefront/cache-tags.ts

/**
 * Cache tags for storefront data.
 * Mutating a resource should call revalidateTag() with the matching tag.
 */
export const STOREFRONT_CATEGORIES_TAG = "storefront:categories";
export const STOREFRONT_PRODUCTS_TAG = "storefront:products";
export const STOREFRONT_SETTINGS_TAG = "storefront:settings";
export const STOREFRONT_FAQS_TAG = "storefront:faqs";
export const STOREFRONT_REVIEWS_TAG = "storefront:reviews";
