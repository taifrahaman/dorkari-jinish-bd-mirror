// src/components/navigation/mobile/constants/mobileNavItems.ts

import { Home, Search, ShoppingCart, MessageCircle, User } from "lucide-react";

export const mobileNavItems = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    id: "search",
    label: "Search",
    href: "/search",
    icon: Search,
  },
  {
    id: "cart",
    label: "Cart",
    href: "/cart",
    icon: ShoppingCart,
  },
  {
    id: "message",
    label: "Messages",
    href: "/messages",
    icon: MessageCircle,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: User,
  },
] as const;
