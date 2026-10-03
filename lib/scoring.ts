export interface KeywordCategory { skills: string[]; experience: string[]; location: string[]; certification: string[]; }
const experiencePatterns: Record<string, RegExp> = {
  "1-3 years": /\b([1-3]|one|two|three)[\s-]*(year|yr)s?\b|\b([1-3]|one|two|three)[\s-]*to[\s-]*([1-3]|one|two|three)[\s-]*(year|yr)s?\b/i,
  "3-5 years": /\b([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b([3-5]|three|four|five)[\s-]*to[\s-]*([3-5]|three|four|five)[\s-]*(year|yr)s?\b|\b(3|three)\+[\s-]*(year|yr)s?\b/i,
  "5+ years": /\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)[\s-]*(year|yr)s?\b|\b([5-9]|[1-9][0-9]+|five|six|seven|eight|nine|ten)\+[\s-]*(year|yr)s?\b/i,
  "0-1 years": /\b(0|1|zero|one)[\s-]*(year|yr)s?\b|\b(0|zero)[\s-]*to[\s-]*(1|one)[\s-]*(year|yr)s?\b|\bless than (1|one)[\s-]*(year|yr)s?\b/i,
};
export function scoreCV(content: string, keywords: KeywordCategory) {
  const contains = (keyword: string) => content.toLowerCase().includes(keyword.toLowerCase());
  const experienceMatch = (keyword: string) => experiencePatterns[keyword]?.test(content) ?? contains(keyword);
  const all = [...keywords.skills, ...keywords.experience, ...keywords.location, ...keywords.certification];
  // Preserve experience-category precedence for duplicate keywords.
  const matches = all.filter(keyword => keywords.experience.includes(keyword) ? experienceMatch(keyword) : contains(keyword));
  const categoryScore = (items: string[], check: (keyword: string) => boolean) => items.filter(check).length / Math.max(1, items.length) * 100;
  return { matches, missing: all.filter(keyword => !matches.includes(keyword)), score: matches.length / all.length * 100 || 0,
    categoryScores: { skills: categoryScore(keywords.skills, contains), experience: categoryScore(keywords.experience, experienceMatch), location: categoryScore(keywords.location, contains), certification: categoryScore(keywords.certification, contains) } };
}
