// src/lib/admin/pos/cart-store.ts

import { create } from "zustand";

/* ============================================================
 * Types
 * ============================================================ */

export type POSChannel = "walk-in" | "phone" | "facebook" | "whatsapp";

export type POSCartLine = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  stockAvailable: number;
};

export type POSCustomer = {
  customerId?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export type AddLineInput = {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  unitPrice: number;
  costPrice: number;
  stockAvailable: number;
  quantity?: number;
};

type POSCartState = {
  lines: POSCartLine[];
  customer: POSCustomer;
  channel: POSChannel;
  notes: string;

  addLine: (input: AddLineInput) => void;
  incrementLine: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setDiscount: (id: string, discount: number) => void;
  setUnitPrice: (id: string, price: number) => void;
  removeLine: (id: string) => void;

  setCustomer: (customer: POSCustomer) => void;
  setChannel: (channel: POSChannel) => void;
  setNotes: (notes: string) => void;

  clear: () => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampQuantity(qty: number, max: number): number {
  return Math.max(1, Math.min(qty, Math.max(1, max)));
}

function clampDiscount(discount: number, lineTotalBefore: number): number {
  return Math.max(0, Math.min(discount, lineTotalBefore));
}

/* ============================================================
 * Store
 * ============================================================ */

export const usePOSCart = create<POSCartState>((set) => ({
  lines: [],
  customer: {},
  channel: "walk-in",
  notes: "",

  addLine: (input) =>
    set((state) => {
      const qty = input.quantity ?? 1;

      const existingIdx = state.lines.findIndex(
        (l) => l.productId === input.productId && l.discount === 0,
      );

      if (existingIdx >= 0) {
        const line = state.lines[existingIdx];
        const merged = clampQuantity(line.quantity + qty, line.stockAvailable);
        const next = state.lines.slice();
        next[existingIdx] = { ...line, quantity: merged };
        return { lines: next };
      }

      const newLine: POSCartLine = {
        id: newLineId(),
        productId: input.productId,
        name: input.name,
        sku: input.sku,
        imageUrl: input.imageUrl,
        unitPrice: input.unitPrice,
        costPrice: input.costPrice,
        quantity: clampQuantity(qty, input.stockAvailable),
        discount: 0,
        stockAvailable: input.stockAvailable,
      };

      return { lines: [...state.lines, newLine] };
    }),

  incrementLine: (id) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id
          ? {
              ...l,
              quantity: clampQuantity(l.quantity + 1, l.stockAvailable),
            }
          : l,
      ),
    })),

  setQuantity: (id, quantity) =>
    set((state) => ({
      lines: state.lines.map((l) =>
        l.id === id
          ? { ...l, quantity: clampQuantity(quantity, l.stockAvailable) }
          : l,
      ),
    })),

  setDiscount: (id, discount) =>
    set((state) => ({
      lines: state.lines.map((l) => {
        if (l.id !== id) return l;
        const gross = l.unitPrice * l.quantity;
        return { ...l, discount: clampDiscount(discount, gross) };
      }),
    })),

  setUnitPrice: (id, price) =>
    set((state) => ({
      lines: state.lines.map((l) => {
        if (l.id !== id) return l;
        const safe = Math.max(0, price);
        const gross = safe * l.quantity;
        return {
          ...l,
          unitPrice: safe,
          discount: clampDiscount(l.discount, gross),
        };
      }),
    })),

  removeLine: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
    })),

  setCustomer: (customer) => set({ customer }),

  setChannel: (channel) => set({ channel }),

  setNotes: (notes) => set({ notes }),

  clear: () =>
    set({
      lines: [],
      customer: {},
      channel: "walk-in",
      notes: "",
    }),
}));

/* ============================================================
 * Derived totals
 * ============================================================ */

export type POSCartTotals = {
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  totalAmount: number;
  costTotal: number;
  profitTotal: number;
};

export function computeTotals(lines: POSCartLine[]): POSCartTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let costTotal = 0;

  for (const l of lines) {
    const gross = l.unitPrice * l.quantity;
    subtotal += gross;
    discountTotal += l.discount;
    costTotal += l.costPrice * l.quantity;
  }

  const totalAmount = Math.max(0, subtotal - discountTotal);
  const profitTotal = totalAmount - costTotal;

  return {
    itemCount: lines.reduce((acc, l) => acc + l.quantity, 0),
    subtotal,
    discountTotal,
    totalAmount,
    costTotal,
    profitTotal,
  };
}
