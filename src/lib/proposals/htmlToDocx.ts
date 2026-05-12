// Minimal HTML → DOCX converter for proposal export.
// Handles the subset of formatting that TipTap StarterKit produces:
// h1/h2/h3, p, strong/b, em/i, u, ul/ol/li, br, links.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ExternalHyperlink,
} from "docx"

interface RunStyle {
  bold?: boolean
  italics?: boolean
  underline?: boolean
}

interface BuiltRun {
  type: "text" | "link"
  text: string
  style: RunStyle
  href?: string
}

/** Walk a DOM node and emit text runs with cumulative formatting. */
function collectRuns(node: Node, style: RunStyle = {}): BuiltRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ""
    if (!text) return []
    return [{ type: "text", text, style }]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const el = node as Element
  const tag = el.tagName.toLowerCase()
  let nextStyle = style

  if (tag === "strong" || tag === "b") nextStyle = { ...nextStyle, bold: true }
  if (tag === "em" || tag === "i")     nextStyle = { ...nextStyle, italics: true }
  if (tag === "u")                     nextStyle = { ...nextStyle, underline: true }

  if (tag === "br") return [{ type: "text", text: "\n", style: nextStyle }]

  if (tag === "a") {
    const href = (el as HTMLAnchorElement).getAttribute("href") ?? ""
    const inner: BuiltRun[] = []
    for (const child of Array.from(el.childNodes)) {
      inner.push(...collectRuns(child, { ...nextStyle, underline: true }))
    }
    return inner.map((r) => ({ ...r, type: "link", href }))
  }

  const runs: BuiltRun[] = []
  for (const child of Array.from(el.childNodes)) {
    runs.push(...collectRuns(child, nextStyle))
  }
  return runs
}

function runsToTextRuns(runs: BuiltRun[]): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = []
  for (const r of runs) {
    const parts = r.text.split("\n")
    const tRuns: TextRun[] = []
    parts.forEach((part, i) => {
      if (part) {
        tRuns.push(
          new TextRun({
            text: part,
            bold: r.style.bold,
            italics: r.style.italics,
            underline: r.style.underline ? {} : undefined,
          })
        )
      }
      if (i < parts.length - 1) {
        tRuns.push(new TextRun({ text: "", break: 1 }))
      }
    })

    if (r.type === "link" && r.href) {
      out.push(new ExternalHyperlink({ link: r.href, children: tRuns }))
    } else {
      out.push(...tRuns)
    }
  }
  return out
}

function elementToParagraphs(el: Element): Paragraph[] {
  const tag = el.tagName.toLowerCase()

  if (tag === "h1") {
    return [new Paragraph({
      children: runsToTextRuns(collectRuns(el)),
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
    })]
  }
  if (tag === "h2") {
    return [new Paragraph({
      children: runsToTextRuns(collectRuns(el)),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    })]
  }
  if (tag === "h3") {
    return [new Paragraph({
      children: runsToTextRuns(collectRuns(el)),
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 240, after: 120 },
    })]
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(el.querySelectorAll(":scope > li"))
    return items.map((li, idx) =>
      new Paragraph({
        children: runsToTextRuns(collectRuns(li)),
        bullet: tag === "ul" ? { level: 0 } : undefined,
        numbering: tag === "ol"
          ? { reference: "ordered-list", level: 0 }
          : undefined,
        spacing: { after: 80 },
      })
    )
    // (numbering reference needs to be defined in Document config below)
  }
  if (tag === "blockquote") {
    return [new Paragraph({
      children: runsToTextRuns(collectRuns(el)),
      indent: { left: 720 },
      spacing: { after: 120 },
    })]
  }
  // Default: treat as paragraph
  return [new Paragraph({
    children: runsToTextRuns(collectRuns(el)),
    alignment: AlignmentType.LEFT,
    spacing: { after: 120 },
  })]
}

export async function htmlToDocxBlob(html: string): Promise<Blob> {
  // Parse HTML in browser
  const wrapper = document.createElement("div")
  wrapper.innerHTML = html

  const paragraphs: Paragraph[] = []
  for (const child of Array.from(wrapper.children)) {
    paragraphs.push(...elementToParagraphs(child))
  }

  // Fall back if HTML had no element children — treat as plain text
  if (paragraphs.length === 0 && wrapper.textContent) {
    for (const line of wrapper.textContent.split("\n")) {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: line })] }))
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            { level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { size: 22, font: "Calibri" } }, // 11pt
      },
    },
    sections: [{ properties: {}, children: paragraphs }],
  })

  return Packer.toBlob(doc)
}
