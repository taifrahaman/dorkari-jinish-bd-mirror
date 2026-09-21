// src/components/home/deals-of-the-week/dealsOfTheWeek.types.ts

// src/components/home/deals-of-the-week/dealsOfTheWeekData.ts

// src/components/home/deals-of-the-week/dealsOfTheWeek.types.ts

export type DealProduct = {
  id: string;

  name: {
    en: string;
    bn: string;
  };

  category: {
    en: string;
    bn: string;
  };

  description: {
    en: string;
    bn: string;
  };

  price: number;
  originalPrice: number;

  image: string;

  details: {
    label: {
      en: string;
      bn: string;
    };
    value: {
      en: string;
      bn: string;
    };
  }[];
};
