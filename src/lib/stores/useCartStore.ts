// src/lib/stores/useCartStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Hard cap per cart line. Real stock validation happens server-side
 * on order placement — this is a soft UX cap so customers can't build
 * a 99-unit cart they won't be able to buy.
 */
export const MAX_QTY_PER_LINE = 10;

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
  colorName?: string;
  colorHex?: string;
  originalPrice?: number;
  stock?: "in-stock" | "low-stock" | "out-of-stock";
  stockCount?: number;
};

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  mergeGuestCart: (guestItems: CartItem[]) => void;
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

/**
 * Single helper for derived totals — used by every mutation so the
 * three fields can never drift apart.
 */
function recomputeTotals(items: CartItem[]): {
  totalItems: number;
  totalPrice: number;
} {
  return {
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

function clampQty(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  return Math.min(MAX_QTY_PER_LINE, Math.floor(quantity));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (item) => {
        const { productId, quantity = 1, ...rest } = item;
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.productId === productId);

        let newItems: CartItem[];
        if (existing) {
          newItems = currentItems.map((i) =>
            i.productId === productId
              ? { ...i, quantity: clampQty(i.quantity + quantity) }
              : i,
          );
        } else {
          newItems = [
            ...currentItems,
            { ...rest, productId, quantity: clampQty(quantity) },
          ];
        }

        set({ items: newItems, ...recomputeTotals(newItems) });
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        set({ items: newItems, ...recomputeTotals(newItems) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const clamped = clampQty(quantity);
        const newItems = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity: clamped } : i,
        );
        set({ items: newItems, ...recomputeTotals(newItems) });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      mergeGuestCart: (guestItems) => {
        const currentItems = get().items;
        const merged = [...currentItems];
        guestItems.forEach((guestItem) => {
          const idx = merged.findIndex(
            (i) => i.productId === guestItem.productId,
          );
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              quantity: clampQty(merged[idx].quantity + guestItem.quantity),
            };
          } else {
            merged.push({
              ...guestItem,
              quantity: clampQty(guestItem.quantity),
            });
          }
        });

        set({ items: merged, ...recomputeTotals(merged) });
      },
    }),
    {
      name: "dorkari-cart",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
