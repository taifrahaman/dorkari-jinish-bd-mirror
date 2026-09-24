// src/components/footer/footerLinks.ts

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Shop",
    links: [
      {
        label: "Shop",
        href: "/shop",
      },
      {
        label: "Categories",
        href: "/categories",
      },
      {
        label: "New Arrivals",
        href: "/shop?filter=new",
      },
      {
        label: "Best Sellers",
        href: "/shop?filter=best-sellers",
      },
      {
        label: "Deals",
        href: "/shop?filter=deals",
      },
    ],
  },

  {
    title: "Customer Care",
    links: [
      {
        label: "FAQ",
        href: "/faq",
      },
      {
        label: "Shipping & Track Order",
        href: "/shipping",
      },
      {
        label: "Returns & Refunds",
        href: "/returns",
      },
      {
        label: "Terms & Policy",
        href: "/terms-policy",
      },
    ],
  },

  {
    title: "Company",
    links: [
      {
        label: "About Us",
        href: "/about",
      },
      {
        label: "Contact Us",
        href: "/contact",
      },
    ],
  },
];

export const footerSocialLinks = [
  {
    label: "Facebook",
    href: "#",
    eyebrow: "Follow us",
  },
  {
    label: "WhatsApp",
    href: "#",
    eyebrow: "Chat with us",
  },
] as const;
