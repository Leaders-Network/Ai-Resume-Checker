import textrank from "textrank"

/**
 * Summarize the resume text using TextRank.
 */
export function summarizeText(text: string, sentenceCount: number = 3): string {
  if (!text || typeof text !== "string") return "No valid resume content found."

  // ✅ Use textrank's summarize method
  const summary = textrank(text, sentenceCount)
  return summary.join("\n")
}