import './legal.css'
import privacyMarkdown from '../../../../PRIVACY.md?raw'

export default function Privacy() {
  const content = privacyMarkdown

  // Convert markdown to HTML
  let html = content
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Links [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

  // Lists - process line by line
  const lines = html.split('\n')
  const processed: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.match(/^- (.+)$/)) {
      if (!inList) {
        processed.push('<ul>')
        inList = true
      }
      processed.push(line.replace(/^- (.+)$/, '<li>$1</li>'))
    } else {
      if (inList) {
        processed.push('</ul>')
        inList = false
      }
      processed.push(line)
    }
  }

  if (inList) {
    processed.push('</ul>')
  }

  html = processed.join('\n')

  // Paragraphs
  html = html
    .split('\n\n')
    .map(block => {
      block = block.trim()
      if (!block) return ''
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('</ul>')) {
        return block
      }
      return `<p>${block.replace(/\n/g, ' ')}</p>`
    })
    .join('\n')

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <a href="/" className="back-link">← Back to App</a>
        </div>
        <article
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
