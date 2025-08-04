// This is a simple keyword extractor that uses regex patterns to identify potential keywords in a resume
// In a real implementation, you would use a more sophisticated NLP approach or an AI model

export interface ExtractedKeywords {
  skills: string[]
  experience: string[]
  location: string[]
  certification: string[]
}

export function extractKeywords(text: string): ExtractedKeywords {
  const normalizedText = text.toLowerCase()
  
  // Extract skills (programming languages, tools, frameworks, etc.)
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
  ]

//
