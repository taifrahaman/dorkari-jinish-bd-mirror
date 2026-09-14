// src/lib/stores/useUIStore.ts
import { create } from "zustand";

interface UIState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartOpen: false,
  isSearchOpen: false,

  setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
}));
