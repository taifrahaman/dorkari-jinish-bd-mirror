// src/lib/stores/useCartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---- 1. Type Definitions ----
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string; // for quick navigation
  // Added for color-variant support:
  colorName?: string;
  colorHex?: string;
  originalPrice?: number;
  stock?: "in-stock" | "low-stock" | "out-of-stock";
  stockCount?: number;
};

type CartState = {
  items: CartItem[];
  totalItems: number; // derived count (sum of quantities)
  totalPrice: number; // derived total
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  mergeGuestCart: (guestItems: CartItem[]) => void; // for login flow
};

// ---- 2. Custom storage object for Next.js SSR safety ----
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

// ---- 3. Zustand Store with Persist ----
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      // ---- Add item (or increment if exists) ----
      addItem: (item) => {
        const { productId, quantity = 1, ...rest } = item;
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.productId === productId);

        let newItems: CartItem[];
        if (existing) {
          newItems = currentItems.map((i) =>
            i.productId === productId
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        } else {
          newItems = [...currentItems, { ...rest, productId, quantity }];
        }

        // Recalculate totals
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );

        set({ items: newItems, totalItems, totalPrice });
      },

      // ---- Remove item entirely ----
      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );
        set({ items: newItems, totalItems, totalPrice });
      },

      // ---- Update specific item quantity ----
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const newItems = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        );
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );
        set({ items: newItems, totalItems, totalPrice });
      },

      // ---- Clear cart (used after checkout or logout) ----
      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      // ---- Merge guest cart after login (deduplicate by productId) ----
      mergeGuestCart: (guestItems) => {
        const currentItems = get().items;
        // Simple merge: if product exists in current, keep the higher quantity or sum them?
        // Industry standard: sum quantities.
        const merged = [...currentItems];
        guestItems.forEach((guestItem) => {
          const existing = merged.find(
            (i) => i.productId === guestItem.productId,
          );
          if (existing) {
            existing.quantity += guestItem.quantity;
          } else {
            merged.push(guestItem);
          }
        });

        const totalItems = merged.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = merged.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );
        set({ items: merged, totalItems, totalPrice });
      },
    }),
    {
      name: "dorkari-cart", // key in localStorage
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
