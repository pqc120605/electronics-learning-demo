import { Fragment, useMemo, type ReactNode } from 'react'
import { parseMarkdown, type MdInline } from '../../lib/simpleMarkdown'

/** Render AST markdown thành phần tử React. Không chèn HTML thô vào DOM. */
function renderInline(nodes: MdInline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`
    switch (node.type) {
      case 'text': return <Fragment key={key}>{node.text}</Fragment>
      case 'code': return <code key={key}>{node.text}</code>
      case 'strong': return <strong key={key}>{renderInline(node.children, key)}</strong>
      case 'em': return <em key={key}>{renderInline(node.children, key)}</em>
      case 'link': return <a key={key} href={node.href} target="_blank" rel="noopener noreferrer nofollow ugc">{node.text}</a>
    }
  })
}

export function MarkdownView({ source, className = '' }: { source: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source])
  return (
    <div className={`community-markdown ${className}`.trim()}>
      {blocks.map((block, index) => {
        const key = `b${index}`
        switch (block.type) {
          case 'heading': {
            // Tiêu đề trong bài luôn thấp hơn h2 của trang để giữ cấu trúc heading.
            const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5'
            return <Tag key={key}>{renderInline(block.children, key)}</Tag>
          }
          case 'paragraph': return <p key={key}>{renderInline(block.children, key)}</p>
          case 'quote': return <blockquote key={key}>{renderInline(block.children, key)}</blockquote>
          case 'list': {
            const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>)
            return block.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>
          }
          case 'code':
            return (
              <figure key={key} className="community-code">
                {block.lang && <figcaption>{block.lang}</figcaption>}
                <pre tabIndex={0} aria-label={block.lang ? `Khối code ${block.lang}` : 'Khối code'}><code>{block.text}</code></pre>
              </figure>
            )
        }
      })}
    </div>
  )
}
