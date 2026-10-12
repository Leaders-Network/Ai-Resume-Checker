interface PdfTextItem {
  str: string
  hasEOL?: boolean
  transform?: number[]
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return typeof item === "object"
    && item !== null
    && "str" in item
    && typeof (item as { str?: unknown }).str === "string"
}

/** Reconstruct readable lines from PDF.js text items using their baselines. */
export function formatPdfTextItems(items: readonly unknown[]) {
  const lines: string[] = []
  let currentLine = ""
  let currentY: number | undefined

  const flushLine = () => {
    const line = currentLine.replace(/\s+/g, " ").trim()
    if (line) lines.push(line)
    currentLine = ""
    currentY = undefined
  }

  for (const item of items) {
    if (!isPdfTextItem(item)) continue

    const value = item.str.trim()
    const y = Array.isArray(item.transform) && typeof item.transform[5] === "number"
      ? item.transform[5]
      : undefined

    // A noticeable baseline change represents a new visual line even when the
    // PDF author did not include an explicit end-of-line marker.
    if (currentLine && currentY !== undefined && y !== undefined && Math.abs(y - currentY) > 2.5) {
      flushLine()
    }

    if (value) {
      const needsSpace = currentLine.length > 0
        && !/[\s/(\-]$/.test(currentLine)
        && !/^[,.;:!?%)]/.test(value)
      currentLine += `${needsSpace ? " " : ""}${value}`
    }
    if (y !== undefined) currentY = y
    if (item.hasEOL) flushLine()
  }

  flushLine()
  return lines.join("\n")
}
