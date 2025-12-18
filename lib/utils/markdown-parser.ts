/**
 * Markdown 内容解析工具
 * 用于将 Markdown 内容按照 H2 标题分割成多个部分
 */

export interface MarkdownSection {
  title: string
  content: string
  level: number // 2 for H2, 3 for H3, etc.
  subsections?: MarkdownSection[] // H3 子部分
}

/**
 * 解析 Markdown 内容，按照 H2 标题分割
 */
export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  if (!markdown || typeof markdown !== 'string') {
    return []
  }

  // 移除 H1（如果存在），因为 H1 已经在页面其他地方显示
  const withoutH1 = markdown.replace(/^#\s+.+$/m, '').trim()

  // 按照 H2 (##) 分割内容
  const h2Regex = /^##\s+(.+)$/gm
  const sections: MarkdownSection[] = []
  let match: RegExpExecArray | null

  // 找到所有 H2 标题的位置
  const h2Matches: Array<{ title: string; index: number }> = []
  while ((match = h2Regex.exec(withoutH1)) !== null) {
    h2Matches.push({
      title: match[1].trim(),
      index: match.index,
    })
  }

  // 如果没有 H2 标题，将整个内容作为一个部分
  if (h2Matches.length === 0) {
    return [
      {
        title: 'Overview',
        content: withoutH1,
        level: 2,
      },
    ]
  }

  // 处理每个 H2 部分
  for (let i = 0; i < h2Matches.length; i++) {
    const currentMatch = h2Matches[i]
    const nextMatch = h2Matches[i + 1]
    
    // 提取当前 H2 到下一个 H2 之间的内容
    const startIndex = currentMatch.index
    const endIndex = nextMatch ? nextMatch.index : withoutH1.length
    const sectionContent = withoutH1.substring(startIndex, endIndex).trim()

    // 移除 H2 标题行，获取纯内容
    const contentWithoutTitle = sectionContent.replace(/^##\s+.+$/m, '').trim()

    // 检查是否有 H3 子部分
    const h3Regex = /^###\s+(.+)$/gm
    const h3Matches: Array<{ title: string; index: number; endIndex: number }> = []
    let h3Match: RegExpExecArray | null

    // 在 sectionContent 中查找 H3
    const relativeContent = sectionContent
    while ((h3Match = h3Regex.exec(relativeContent)) !== null) {
      // 找到标题行的结束位置（换行符）
      const titleLineEnd = relativeContent.indexOf('\n', h3Match.index)
      const endIndex = titleLineEnd > 0 ? titleLineEnd : h3Match.index + h3Match[0].length
      
      h3Matches.push({
        title: h3Match[1].trim(),
        index: h3Match.index,
        endIndex,
      })
    }

    let subsections: MarkdownSection[] | undefined

    // 如果有 H3，分割成子部分
    if (h3Matches.length > 0) {
      subsections = []
      for (let j = 0; j < h3Matches.length; j++) {
        const currentH3 = h3Matches[j]
        const nextH3 = h3Matches[j + 1]
        
        // 提取 H3 标题后的内容（从标题行结束到下一个 H3 或 H2 之前）
        const h3ContentStart = currentH3.endIndex
        const h3ContentEnd = nextH3 ? nextH3.index : relativeContent.length
        
        const h3Content = relativeContent.substring(h3ContentStart, h3ContentEnd).trim()

        subsections.push({
          title: currentH3.title,
          content: h3Content,
          level: 3,
        })
      }
      
      // 如果有 H3 子部分，主内容应该只包含 H3 之前的内容
      const firstH3Index = h3Matches[0].index
      const mainContentBeforeH3 = relativeContent.substring(0, firstH3Index).replace(/^##\s+.+$/m, '').trim()
      
      sections.push({
        title: currentMatch.title,
        content: mainContentBeforeH3 || '', // 如果 H3 之前没有内容，则为空
        level: 2,
        subsections,
      })
    } else {
      // 没有 H3 子部分，直接使用整个内容
      sections.push({
        title: currentMatch.title,
        content: contentWithoutTitle,
        level: 2,
        subsections: undefined,
      })
    }
  }

  return sections
}

/**
 * 将 Markdown 转换为 HTML（简单版本，仅处理基本格式）
 * 注意：这是一个简化版本，复杂的 Markdown 应该使用专门的库如 marked 或 remark
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  let html = markdown

  // 处理段落（双换行）
  html = html.replace(/\n\n+/g, '</p><p>')
  html = `<p>${html}</p>`

  // 处理粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 处理斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 处理列表项（以 - 或 * 开头）
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
  // 将连续的 <li> 包裹在 <ul> 中
  html = html.replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/g, '<ul>$1</ul>')

  // 处理链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  return html
}

