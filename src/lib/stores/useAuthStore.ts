// src/lib/stores/useAuthStore.ts

import { create } from "zustand";

export type UserAddress = {
  _id?: string;
  label: string;
  address: string;
  phone: string;
  isDefault: boolean;
};

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin" | "moderator";
  addresses?: UserAddress[];
  wishlist?: string[];
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));
