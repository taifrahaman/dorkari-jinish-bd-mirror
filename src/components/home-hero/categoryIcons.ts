// src/components/home-hero/categoryIcons.ts
import {
  Gift,
  ShoppingBasket,
  UtensilsCrossed,
  ToyBrick,
  Fan,
  Lightbulb,
  PencilRuler,
  Cpu,
  Smartphone,
  Droplets,
  Wifi,
  Wrench,
  Keyboard,
  Package,
  type LucideIcon,
} from "lucide-react";

const RULES: Array<[RegExp, LucideIcon]> = [
  [/gift/, Gift],
  [/daily/, ShoppingBasket],
  [/cook|kitchen/, UtensilsCrossed],
  [/toy/, ToyBrick],
  [/appliance/, Fan],
  [/light|lamp|bulb/, Lightbulb],
  [/station/, PencilRuler],
  [/electronic/, Cpu],
  [/mobile|phone/, Smartphone],
  [/filter|purif/, Droplets],
  [/internet|network|wifi/, Wifi],
  [/tool/, Wrench],
  [/computer/, Keyboard],
];

export function iconForCategory(slug: string): LucideIcon {
  const s = slug.toLowerCase();
  for (const [re, icon] of RULES) if (re.test(s)) return icon;
  return Package;
}
