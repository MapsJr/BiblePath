export {
  getPublishedDevotionBySlug,
  getPublishedDevotions,
} from "@/data/devotions";

export function parseDevotionContent(scripture: string) {
  const normalized = scripture.replace(/\r/g, "").trim();
  const sections = normalized.split(/\n\s*\n/).filter(Boolean);
  const verseText = sections[0]?.trim() ?? "";
  const bulletParts = sections
    .slice(1)
    .flatMap((section) => section.split(/\n\s*(?=- ✅)/))
    .map((part) => part.replace(/^- ✅\s*/, "").trim())
    .filter(Boolean);

  return {
    verseText,
    points: bulletParts,
  };
}
