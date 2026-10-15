// src/components/navigation/navItems.ts

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export type CategoryNode = {
  id: string;
  slug: string;
  label: string;
  href: string;
  children?: { id: string; slug: string; label: string; href: string }[];
};

/** Top-level links (desktop nav + mobile drawer footer) */
export const primaryNavLinks: NavLink[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "shop", label: "Shop All", href: "/shop" },
  { id: "deals", label: "Deals", href: "/deals" },
  { id: "support", label: "Support", href: "/support" },
];

/** Mobile bottom nav — glass, stays 5 items. */
export const bottomNavItems = [
  { id: "home", label: "Home", href: "/", icon: "Home" },
  { id: "search", label: "Search", href: "/search", icon: "Search" },
  { id: "cart", label: "Cart", href: "/cart", icon: "ShoppingCart" },
  { id: "chat", label: "Chat", href: "/chat", icon: "MessageCircle" },
  { id: "account", label: "Account", href: "/account", icon: "User" },
] as const;

/** Dummy appliance / electrical categories — swap for backend later. */
// export const categoryTree: CategoryNode[] = [
//   {
//     id: "kitchen",
//     label: "Kitchen Appliances",
//     href: "/c/kitchen",
//     children: [
//       {
//         id: "refrigerators",
//         label: "Refrigerators",
//         href: "/c/kitchen/refrigerators",
//       },
//       {
//         id: "microwaves",
//         label: "Microwave Ovens",
//         href: "/c/kitchen/microwaves",
//       },
//       {
//         id: "blenders",
//         label: "Blenders & Mixers",
//         href: "/c/kitchen/blenders",
//       },
//       {
//         id: "rice-cookers",
//         label: "Rice Cookers",
//         href: "/c/kitchen/rice-cookers",
//       },
//       { id: "kettles", label: "Electric Kettles", href: "/c/kitchen/kettles" },
//     ],
//   },
//   {
//     id: "cooling",
//     label: "Cooling & Air",
//     href: "/c/cooling",
//     children: [
//       { id: "ac", label: "Air Conditioners", href: "/c/cooling/ac" },
//       { id: "fans", label: "Fans", href: "/c/cooling/fans" },
//       { id: "coolers", label: "Air Coolers", href: "/c/cooling/coolers" },
//     ],
//   },
//   {
//     id: "lighting",
//     label: "Lighting",
//     href: "/c/lighting",
//     children: [
//       { id: "led-bulbs", label: "LED Bulbs", href: "/c/lighting/led-bulbs" },
//       {
//         id: "tube-lights",
//         label: "Tube Lights",
//         href: "/c/lighting/tube-lights",
//       },
//       { id: "ceiling", label: "Ceiling Lights", href: "/c/lighting/ceiling" },
//       { id: "smart", label: "Smart Lights", href: "/c/lighting/smart" },
//     ],
//   },
//   {
//     id: "wiring",
//     label: "Wiring & Switches",
//     href: "/c/wiring",
//     children: [
//       {
//         id: "switches",
//         label: "Switches & Sockets",
//         href: "/c/wiring/switches",
//       },
//       { id: "wires", label: "Wires & Cables", href: "/c/wiring/wires" },
//       { id: "breakers", label: "Circuit Breakers", href: "/c/wiring/breakers" },
//     ],
//   },
//   {
//     id: "heating",
//     label: "Water & Heating",
//     href: "/c/heating",
//     children: [
//       {
//         id: "water-heaters",
//         label: "Water Heaters",
//         href: "/c/heating/water-heaters",
//       },
//       {
//         id: "room-heaters",
//         label: "Room Heaters",
//         href: "/c/heating/room-heaters",
//       },
//     ],
//   },
// ];
