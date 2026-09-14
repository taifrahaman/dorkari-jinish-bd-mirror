// src/components/navigation/mobile/constants/announcementMessages.ts

export const announcementMessages = {
  en: [
    {
      title: "Better Living, Every Day",
      subtitle: "Smart products for a simpler, more comfortable life.",
    },
    {
      title: "Smart Solutions for Modern Homes",
      subtitle: "Thoughtfully selected products for modern living.",
    },
    {
      title: "Designed to Make Life Easier",
      subtitle:
        "Practical solutions that fit naturally into your everyday life.",
    },
    {
      title: "Comfort and Convenience",
      subtitle: "Everything you need to make your home life easier.",
    },
  ],

  bn: [
    {
      title: "প্রতিদিনের জীবন আরও সহজ",
      subtitle: "সহজ ও স্বাচ্ছন্দ্যময় জীবনের জন্য স্মার্ট পণ্য।",
    },
    {
      title: "আধুনিক ঘরের জন্য স্মার্ট সমাধান",
      subtitle: "আধুনিক জীবনযাপনের জন্য বাছাই করা প্রয়োজনীয় পণ্য।",
    },
    {
      title: "জীবনকে আরও সহজ করে",
      subtitle: "আপনার দৈনন্দিন জীবনের জন্য ব্যবহারিক ও স্মার্ট সমাধান।",
    },
    {
      title: "প্রতিটি ঘরে আরাম ও সুবিধা",
      subtitle: "ঘরের জীবনকে আরও সহজ করতে প্রয়োজনীয় সবকিছু একসাথে।",
    },
  ],
} as const;

// Static brand mark — not part of the rotation.
export const brandName = {
  en: "DORKARI JINISH",
  bn: "দরকারি জিনিস",
} as const;

export type SupportedLocale = keyof typeof brandName;
