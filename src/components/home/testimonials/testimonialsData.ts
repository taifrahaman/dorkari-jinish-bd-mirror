// src/components/home/testimonials/testimonialsData.ts

export type Testimonial = {
  id: string;
  name: string;
  city: string;
  quote: string;
  rating: 4 | 5;
  verified?: boolean;
  /** Tailwind-safe palette key, used for the initials avatar. */
  palette: "cream" | "sage" | "neutral" | "amber" | "clay";
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Nusrat Jahan",
    city: "Dhaka",
    quote:
      "The electric kettle arrived exactly as shown. It heats water quickly and feels much better built than I expected for the price.",
    rating: 5,
    verified: true,
    palette: "cream",
  },
  {
    id: "t2",
    name: "তানভীর আহমেদ",
    city: "চট্টগ্রাম",
    quote:
      "রাইস কুকারটা খুব ভালো পেয়েছি। প্যাকেজিং সুন্দর ছিল, সময়মতো ডেলিভারি পেয়েছি এবং এখন পর্যন্ত খুব ভালো কাজ করছে।",
    rating: 5,
    verified: true,
    palette: "sage",
  },
  {
    id: "t3",
    name: "Farhana Akter",
    city: "Sylhet",
    quote:
      "The air fryer has made everyday cooking much easier. It works just like the description and the controls are very simple to use.",
    rating: 5,
    verified: true,
    palette: "amber",
  },
  {
    id: "t4",
    name: "রাকিবুল ইসলাম",
    city: "খুলনা",
    quote:
      "অর্ডার করার আগে আয়রন নিয়ে একটা প্রশ্ন ছিল। হোয়াটসঅ্যাপে খুব দ্রুত রিপ্লাই পেয়েছি। প্রোডাক্টও ভালো কাজ করছে।",
    rating: 5,
    verified: true,
    palette: "neutral",
  },
  {
    id: "t5",
    name: "Sabrina Chowdhury",
    city: "Rajshahi",
    quote:
      "Bought a kitchen appliance for my mother. The packaging was neat, delivery was faster than expected, and everything arrived safely.",
    rating: 5,
    verified: false,
    palette: "clay",
  },
  {
    id: "t6",
    name: "ইমরান হোসেন",
    city: "কুমিল্লা",
    quote:
      "পণ্যের ডিটেইলস আর স্পেসিফিকেশন খুব পরিষ্কার ছিল, তাই কোনটা কিনব সেটা বুঝতে সুবিধা হয়েছে। হাতে পাওয়া প্রোডাক্টও ছবির মতোই ছিল।",
    rating: 4,
    verified: true,
    palette: "sage",
  },
  {
    id: "t7",
    name: "Mim Akhtar",
    city: "Barishal",
    quote:
      "I compared a few stores before ordering and found the price very reasonable here. The appliance arrived well packed and in perfect condition.",
    rating: 5,
    verified: true,
    palette: "cream",
  },
  {
    id: "t8",
    name: "শাকিল রানা",
    city: "রংপুর",
    quote:
      "এই সাইটে প্রথমবার অর্ডার করেছিলাম, তাই একটু চিন্তা ছিল। কিন্তু প্রোডাক্ট ঠিক ছবির মতোই পেয়েছি। আবার এখান থেকেই কিনব।",
    rating: 5,
    verified: false,
    palette: "amber",
  },
];
