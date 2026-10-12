export interface CandidateResumeExport {
  fileName: string
  content: string
  matches: string[]
  score: number
}

export interface CandidateKeywordCategories {
  experience?: string[]
  location?: string[]
  certification?: string[]
}

const ROLE_PATTERN = /\b(?:software|frontend|front-end|backend|back-end|full[ -]?stack|mobile|web|data|cloud|devops|network|security|qa|product|project|program|sales|marketing|operations|finance|human resources|hr|customer success)\s+(?:engineer|developer|analyst|scientist|architect|designer|manager|specialist|consultant|administrator|officer|lead)\b/i
const CERTIFICATION_PATTERN = /\b(?:AWS Certified[^,;|]{0,60}|Microsoft Certified[^,;|]{0,60}|Google Cloud Certified[^,;|]{0,60}|Oracle Certified[^,;|]{0,60}|Cisco Certified[^,;|]{0,60}|Salesforce Certified[^,;|]{0,60}|Red Hat Certified[^,;|]{0,60}|PMP|PRINCE2|CISSP|CISM|CISA|CompTIA(?:\s+[A-Za-z+]+)?|CCNA|CCNP|CFA|CPA|ACA)\b/gi
const NAME_TOKEN = "[\\p{L}][\\p{L}'’.-]*"
const UPPERCASE_NAME_TOKEN = "[\\p{Lu}][\\p{Lu}\\p{M}'’.-]*"

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function getLabelValue(content: string, labels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/\s+/g, "\\s*")).join("|")
  const match = content.match(new RegExp(`(?:^|[|•\\n\\r])\\s*(?:${labelPattern})\\s*[:\\-]\\s*([^|•\\n\\r]{2,100})`, "i"))
  return match ? normalize(match[1]) : ""
}

function nameFromFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
  const withoutDocumentWords = baseName
    .replace(/\b(?:curriculum vitae|resume|cv)\b.*$/i, "")
    .replace(ROLE_PATTERN, "")
  return normalize(withoutDocumentWords) || normalize(baseName)
}

function isCredibleName(value: string) {
  const words = value.split(/\s+/)
  const disallowed = /\b(?:resume|curriculum|vitae|profile|summary|objective|experience|education|skills|contact)\b/i
  return words.length >= 2
    && words.length <= 6
    && !disallowed.test(value)
    && words.every((word) => new RegExp(`^${NAME_TOKEN}$`, "u").test(word))
}

function nameFromContent(content: string) {
  const text = normalize(content)
  if (!text) return ""

  // PDF text is usually flattened into one line. Stop an explicitly labelled
  // name at the next common contact field or detected professional title.
  const explicitNamePattern = new RegExp(
    `\\b(?:full\\s*name|candidate\\s*name|name)\\s*[:\\-]\\s*(${NAME_TOKEN}(?:\\s+${NAME_TOKEN}){1,5}?)(?=\\s+(?:${ROLE_PATTERN.source}|e-?mail|phone|mobile|telephone|tel|location|address|linkedin|github|https?:|www\\.)\\b|$)`,
    "iu",
  )
  const explicitName = normalize(text.match(explicitNamePattern)?.[1] ?? "")
  if (isCredibleName(explicitName)) return explicitName

  // Most CVs begin with the candidate's name followed by their role or contact
  // details. Use that boundary so those details are not included in the name.
  const boundaryPatterns = [
    ROLE_PATTERN,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\b(?:e-?mail|phone|mobile|telephone|tel|location|address|linkedin|github)\b/i,
    /\+?\d[\d().-]*(?:\s+[\d().-]+){0,4}/,
    /https?:\/\/|www\./i,
  ]
  const boundaryIndexes = boundaryPatterns
    .map((pattern) => text.search(pattern))
    .filter((index) => index > 0)
  const boundary = boundaryIndexes.length > 0 ? Math.min(...boundaryIndexes) : -1

  if (boundary > 0 && boundary <= 140) {
    const headerName = normalize(text.slice(0, boundary)
      .replace(/^(?:resume|curriculum\s+vitae|cv)\b\s*[:\-]?\s*/i, "")
      .replace(/^(?:full\s*name|candidate\s*name|name)\s*[:\-]\s*/i, "")
      .replace(/^[^\p{L}]+|[^\p{L}.'’\-]+$/gu, ""))
    if (isCredibleName(headerName)) return headerName
  }

  // Preserve an all-caps name at the start even when the role is uncommon and
  // therefore cannot provide a reliable boundary.
  const uppercaseName = normalize(text.match(new RegExp(`^(?:resume|curriculum\\s+vitae|cv)?\\s*(${UPPERCASE_NAME_TOKEN}(?:\\s+${UPPERCASE_NAME_TOKEN}){1,5})(?=\\s+[A-Z][a-z])`, "u"))?.[1] ?? "")
  return isCredibleName(uppercaseName) ? uppercaseName : ""
}

function uniqueMatches(content: string, pattern: RegExp) {
  const matches = content.match(pattern) ?? []
  return [...new Set(matches.map(normalize))]
}

function matchedCategoryValues(resume: CandidateResumeExport, values: string[] = []) {
  const matches = new Set(resume.matches.map((match) => match.toLocaleLowerCase()))
  return values.filter((value) => matches.has(value.toLocaleLowerCase())).join("; ")
}

function extractFullName(resume: CandidateResumeExport) {
  const labeledName = getLabelValue(resume.content, ["full name", "candidate name", "name"])
  if (isCredibleName(labeledName)) return labeledName

  const headerName = resume.content
    .split(/\r?\n/)
    .map(normalize)
    .filter(Boolean)
    .slice(0, 8)
    .find((line) => isCredibleName(line) && !ROLE_PATTERN.test(line))

  return headerName || nameFromContent(resume.content) || nameFromFileName(resume.fileName)
}

function extractRole(content: string) {
  const labeledRole = getLabelValue(content, ["current role", "job title", "professional title", "role", "position"])
  if (labeledRole) return labeledRole
  return normalize(content.match(ROLE_PATTERN)?.[0] ?? "")
}

function extractPhone(content: string) {
  const labeledPhone = getLabelValue(content, ["phone", "mobile", "telephone", "tel"])
  if (labeledPhone) {
    const labeledMatch = labeledPhone.match(/(?:\+?\d[\d().\s-]{7,}\d)/)
    if (labeledMatch) return normalize(labeledMatch[0])
  }
  const candidates = content.match(/\+?\d[\d().-]*(?:\s+[\d().-]+){0,4}/g) ?? []
  return normalize(candidates.find((candidate) => {
    const digitCount = candidate.replace(/\D/g, "").length
    return digitCount >= 10 && digitCount <= 15
  }) ?? "")
}

function extractExperience(resume: CandidateResumeExport, categories: CandidateKeywordCategories) {
  return uniqueMatches(resume.content, /\b\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?experience\b/gi).join("; ")
    || matchedCategoryValues(resume, categories.experience)
}

function extractEmail(content: string) {
  return content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ""
}

function extractLocation(resume: CandidateResumeExport, categories: CandidateKeywordCategories) {
  return getLabelValue(resume.content, ["location", "address", "based in"])
    || matchedCategoryValues(resume, categories.location)
    || normalize(resume.content.match(/\b(?:Lagos|Abuja|Port Harcourt|Ibadan|Kano|London|Berlin|New York|Remote|Hybrid)\b/i)?.[0] ?? "")
}

function extractCertifications(resume: CandidateResumeExport, categories: CandidateKeywordCategories) {
  const labeled = getLabelValue(resume.content, ["certifications", "certification", "certificates"])
  if (labeled) return labeled
  return uniqueMatches(resume.content, CERTIFICATION_PATTERN).join("; ")
    || matchedCategoryValues(resume, categories.certification)
}

function extractLinks(content: string) {
  const links = uniqueMatches(content, /(?:(?:https?:\/\/|www\.)[^\s<>()\[\]{}"']+|(?:linkedin\.com|github\.com)\/[^\s<>()\[\]{}"']+)/gi)
    .map((link) => link.replace(/[.,;:]+$/, ""))
  return links.join("; ")
}

// Quoting every field gives predictable output, and the prefix prevents CSV
// values from being interpreted as formulas by spreadsheet applications.
function csvCell(value: string | number) {
  let text = String(value ?? "")
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function createCandidateCsv(resumes: CandidateResumeExport[], categories: CandidateKeywordCategories = {}) {
  const headers = [
    "Fullname",
    "Role",
    "Phone",
    "Experience",
    "Email",
    "Location",
    "Certification",
    "Match Score",
    "Keywords",
    "Links",
  ]

  const rows = resumes.map((resume) => [
    extractFullName(resume),
    extractRole(resume.content),
    extractPhone(resume.content),
    extractExperience(resume, categories),
    extractEmail(resume.content),
    extractLocation(resume, categories),
    extractCertifications(resume, categories),
    `${Math.round(resume.score)}%`,
    resume.matches.join("; "),
    extractLinks(resume.content),
  ])

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
}
