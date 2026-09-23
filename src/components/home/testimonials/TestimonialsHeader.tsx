// src/components/home/testimonials/TestimonialsHeader.tsx

type Props = {
  locale: "en" | "bn";
};

const content = {
  en: {
    eyebrow: "CUSTOMER STORIES",
    title: "Loved by customers",
    description:
      "Real experiences from people who shop for everyday essentials with us.",
  },
  bn: {
    eyebrow: "কাস্টমার স্টোরি",
    title: "কাস্টমারদের পছন্দের শপিং",
    description:
      "আমাদের সাথে দৈনন্দিন প্রয়োজনীয় পণ্য কেনা কাস্টমারদের অভিজ্ঞতা।",
  },
};

export default function TestimonialsHeader({ locale }: Props) {
  const copy = content[locale];

  return (
    <header className="max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#fba705]">
        {copy.eyebrow}
      </p>

      <h2 className="text-3xl font-semibold tracking-tight text-[#172642] sm:text-4xl lg:text-5xl">
        {copy.title}
      </h2>

      <p className="mt-4 max-w-xl text-sm leading-7 text-black/55 sm:text-[15px]">
        {copy.description}
      </p>
    </header>
  );
}
