export interface ExtractedKeywords {
  skills: string[];
  experience: string[];
  location: string[];
  certification: string[];
}

export function extractKeywords(text: string): ExtractedKeywords {
  const normalizedText = text.toLowerCase();

  // Helper: run multiple regexes and flatten results
  const runPatterns = (patterns: RegExp[]): string[] => {
    const results: string[] = [];
    patterns.forEach((pattern) => {
      const matches = normalizedText.match(pattern);
      if (matches) results.push(...matches);
    });
    return [...new Set(results)]; // dedupe
  };

  // Extract skills
  const skillsPatterns = [
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|php|swift|kotlin|go|rust)\b/g,
    /\b(react|angular|vue|svelte|node\.js|express|django|flask|spring|laravel)\b/g,
    /\b(aws|azure|gcp|docker|kubernetes|terraform|jenkins|git|github|gitlab)\b/g,
    /\b(sql|mysql|postgresql|mongodb|redis|elasticsearch|graphql|rest api)\b/g,
    /\b(html|css|sass|less|tailwind|bootstrap|material-ui|styled-components)\b/g,
    /\b(agile|scrum|kanban|jira|confluence|trello|asana|slack)\b/g,
    /\b(machine learning|deep learning|ai|artificial intelligence|data science|nlp)\b/g,
    /\b(excel|word|powerpoint|tableau|power bi|looker|google analytics)\b/g,
    /\b(photoshop|illustrator|indesign|figma|sketch|adobe xd|premiere|after effects)\b/g,
  ];

  // Placeholder regexes for other categories (you’ll need to refine these)
  const experiencePatterns = [/\b(\d+\+?\s?(years?|yrs?)\s+of\s+experience)\b/g];
  const locationPatterns = [/\b(new york|london|berlin|lagos|remote|hybrid)\b/g];
  const certificationPatterns = [/\b(certified|certification|aws certified|pmp|cissp|cfa)\b/g];

  return {
    skills: runPatterns(skillsPatterns),
    experience: runPatterns(experiencePatterns),
    location: runPatterns(locationPatterns),
    certification: runPatterns(certificationPatterns),
  };
}
