// src/components/home/deals-of-the-week/dealsOfTheWeekData.ts

import type { DealProduct } from "./dealsOfTheWeek.types";

export const dealsOfTheWeek: DealProduct[] = [
  {
    id: "weekly-deal-01",

    name: {
      en: "Smart Air Fryer",
      bn: "স্মার্ট এয়ার ফ্রায়ার",
    },

    category: {
      en: "Kitchen Appliance",
      bn: "কিচেন অ্যাপ্লায়েন্স",
    },

    description: {
      en: "Crispy results with less oil and less effort.",
      bn: "কম তেল ও কম পরিশ্রমে তৈরি করুন মজাদার খাবার।",
    },

    price: 8990,
    originalPrice: 10990,

    image: "/products/air-fryer.png",

    details: [
      {
        label: {
          en: "Capacity",
          bn: "ধারণক্ষমতা",
        },
        value: {
          en: "6.5 L",
          bn: "৬.৫ লিটার",
        },
      },
      {
        label: {
          en: "Power",
          bn: "পাওয়ার",
        },
        value: {
          en: "1500 W",
          bn: "১৫০০ ওয়াট",
        },
      },
    ],
  },

  {
    id: "weekly-deal-02",

    name: {
      en: "Digital Rice Cooker",
      bn: "ডিজিটাল রাইস কুকার",
    },

    category: {
      en: "Kitchen Appliance",
      bn: "কিচেন অ্যাপ্লায়েন্স",
    },

    description: {
      en: "Simple cooking with smart everyday convenience.",
      bn: "প্রতিদিনের রান্নায় সহজ ও স্মার্ট সুবিধা।",
    },

    price: 5490,
    originalPrice: 6990,

    image: "/products/rice-cooker.png",

    details: [
      {
        label: {
          en: "Capacity",
          bn: "ধারণক্ষমতা",
        },
        value: {
          en: "1.8 L",
          bn: "১.৮ লিটার",
        },
      },
      {
        label: {
          en: "Power",
          bn: "পাওয়ার",
        },
        value: {
          en: "700 W",
          bn: "৭০০ ওয়াট",
        },
      },
    ],
  },
];
