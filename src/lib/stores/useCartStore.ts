// src/lib/stores/useCartStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useUIStore } from "./useUIStore";

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
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        } else {
          newItems = [...currentItems, { ...rest, productId, quantity }];
        }

        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );

        set({ items: newItems, totalItems, totalPrice });
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((i) => i.productId !== productId);
        const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalPrice = newItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );
        set({ items: newItems, totalItems, totalPrice });
      },

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

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      mergeGuestCart: (guestItems) => {
        const currentItems = get().items;
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
      name: "dorkari-cart",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
