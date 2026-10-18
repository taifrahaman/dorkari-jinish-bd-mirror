// src/components/shop/categoryGlow.ts

/** "r,g,b" of the hero light for a category. Same palette family as the home hero. */
export const DEFAULT_GLOW = "251,167,5";

const RULES: Array<[RegExp, string]> = [
  [/cook|kitchen/, "251,167,5"],
  [/appliance|fan/, "96,190,255"],
  [/light|lamp|bulb/, "255,226,80"],
  [/gift/, "255,138,170"],
  [/toy/, "94,214,160"],
  [/daily/, "255,160,100"],
  [/station/, "160,140,255"],
  [/electronic/, "90,205,230"],
  [/mobile|phone/, "120,160,255"],
  [/filter|purif/, "80,200,190"],
  [/internet|network|wifi|computer/, "140,150,255"],
  [/tool/, "170,180,195"],
];

export function glowForCategory(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_GLOW;
  const s = slug.toLowerCase();
  for (const [re, rgb] of RULES) if (re.test(s)) return rgb;
  return DEFAULT_GLOW;
}
