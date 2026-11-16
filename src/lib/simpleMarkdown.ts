/**
 * Markdown đơn giản cho cộng đồng → cây dữ liệu (AST). Không sinh HTML chuỗi:
 * component React render từng node như text, nên thẻ <script> hay onerror="" chỉ hiện ra là chữ.
 * Hỗ trợ: tiêu đề #/##/###, đoạn văn, danh sách -, 1., trích dẫn >, khối code ```lang,
 * `code` nội dòng, **đậm**, *nghiêng*, [liên kết](https://...) (chỉ http/https).
 */

export type MdInline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'em'; children: MdInline[] }
  | { type: 'link'; href: string; text: string }

export type MdBlock =
  | { type: 'heading'; level: 1 | 2 | 3; children: MdInline[] }
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'list'; ordered: boolean; items: MdInline[][] }
  | { type: 'quote'; children: MdInline[] }

export const MARKDOWN_MAX_LENGTH = 10000

/** Chỉ giữ liên kết http(s); trả null với javascript:, data:, đường dẫn tương đối lạ. */
export function safeLinkHref(raw: string): string | null {
  try {
    const url = new URL(raw.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

const INLINE_PATTERN = /`([^`\n]+)`|\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/g

export function parseInline(source: string, depth = 0): MdInline[] {
  const out: MdInline[] = []
  let last = 0
  const pushText = (text: string) => {
    if (!text) return
    const previous = out[out.length - 1]
    if (previous?.type === 'text') previous.text += text
    else out.push({ type: 'text', text })
  }
  for (const match of source.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0
    pushText(source.slice(last, index))
    last = index + match[0].length
    if (match[1] !== undefined) out.push({ type: 'code', text: match[1] })
    else if (match[2] !== undefined) out.push(depth < 3 ? { type: 'strong', children: parseInline(match[2], depth + 1) } : { type: 'text', text: match[2] })
    else if (match[3] !== undefined) out.push(depth < 3 ? { type: 'em', children: parseInline(match[3], depth + 1) } : { type: 'text', text: match[3] })
    else {
      const href = safeLinkHref(match[5] ?? '')
      if (href) out.push({ type: 'link', href, text: match[4] ?? href })
      else pushText(match[0])
    }
  }
  pushText(source.slice(last))
  return out
}

export function parseMarkdown(input: string): MdBlock[] {
  const lines = input.slice(0, MARKDOWN_MAX_LENGTH).replace(/\r\n?/g, '\n').split('\n')
  const blocks: MdBlock[] = []
  let paragraph: string[] = []
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) })
    paragraph = []
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fence = /^\s*```\s*([\w+#.-]{0,20})\s*$/.exec(line)
    if (fence) {
      flush()
      const code: string[] = []
      i += 1
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i += 1 }
      blocks.push({ type: 'code', lang: fence[1].toLowerCase(), text: code.join('\n') })
      continue
    }
    if (!line.trim()) { flush(); continue }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      flush()
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, children: parseInline(heading[2].trim()) })
      continue
    }
    const listMatch = /^\s*(?:([-*])|(\d{1,3})[.)])\s+(.*)$/.exec(line)
    if (listMatch) {
      flush()
      const ordered = listMatch[2] !== undefined
      const items: MdInline[][] = [parseInline(listMatch[3])]
      while (i + 1 < lines.length) {
        const next = /^\s*(?:([-*])|(\d{1,3})[.)])\s+(.*)$/.exec(lines[i + 1])
        if (!next || (next[2] !== undefined) !== ordered) break
        items.push(parseInline(next[3]))
        i += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }
    if (/^\s*>\s?/.test(line)) {
      flush()
      const quote = [line.replace(/^\s*>\s?/, '')]
      while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) { quote.push(lines[i + 1].replace(/^\s*>\s?/, '')); i += 1 }
      blocks.push({ type: 'quote', children: parseInline(quote.join('\n')) })
      continue
    }
    paragraph.push(line)
  }
  flush()
  return blocks
}

/** Văn bản thuần (dùng cho đoạn trích trong danh sách bài). */
export function markdownExcerpt(input: string, max = 160): string {
  const plain = input
    .replace(/```[\s\S]*?(```|$)/g, ' [code] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*(?:#{1,3}|>|[-*]|\d{1,3}[.)])\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain
}
