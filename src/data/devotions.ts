export type PublishedDevotion = {
  slug: string;
  title: string;
  publishedDate: string;
  reference: string;
  scriptureText: string;
  reflectionPoints: string[];
  prayer?: string;
};

export const publishedDevotions: PublishedDevotion[] = [
  {
    slug: "god-is-the-creator-of-all-things",
    title: "God is the Creator of All Things",
    publishedDate: "2026-10-15",
    reference: "Genesis 1:1",
    scriptureText: "In the beginning God created the heavens and the earth.",
    reflectionPoints: [
      "This verse reminds us that God began everything. Before the world had shape, order, or life, God was already present and active.",
      "When life feels chaotic or uncertain, this truth anchors us: God is not a bystander. He is the source of all things and the one who brings order out of confusion.",
      "What part of your life needs to be surrendered back to God as Creator, trusting that He knows the beginning, the middle, and the end?",
    ],
    prayer:
      "Lord God, thank You for being the Creator of all things. When I feel overwhelmed, help me remember that You are in control and that Your wisdom is greater than my understanding. Amen.",
  },
];

export function getPublishedDevotions() {
  return publishedDevotions;
}

export function getPublishedDevotionBySlug(slug: string) {
  return publishedDevotions.find((devotion) => devotion.slug === slug) ?? null;
}
