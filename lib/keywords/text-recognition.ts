/**
 * 文本识别和解析工具
 * 用于从结构化文本中提取字段信息并自动填充表单
 */

export interface ParsedKeywordData {
  keyword?: string
  intent?: string
  page_style?: 'default' | 'christmas' | 'official'
  page_slug?: string
  status?: 'draft' | 'published'
  product?: string
  service?: string
  region?: string
  pain_point?: string
  search_volume?: string
  competition_score?: string
  priority?: string
  title?: string
  h1?: string
  meta_description?: string
  intro_paragraph?: string
  steps?: Array<{ title: string; description?: string }>
  faq?: Array<{ question: string; answer: string }>
}

/**
 * 检测文本是否为备注/解释行
 * 支持多种语言的备注格式
 */
function isRemarkLine(line: string): boolean {
  const trimmed = line.trim()
  
  // 匹配各种语言的备注格式
  const remarkPatterns = [
    /^\/\/\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)/i,
    /^#\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)/i,
    /^\/\*\s*(中文解释|解释|备注|说明)/i,
    /^\*\s*(中文解释|解释|备注|说明)/i,
  ]
  
  return remarkPatterns.some((pattern) => pattern.test(trimmed))
}

/**
 * 移除行尾的备注
 * 支持多种语言的备注格式，特别针对中文解释
 */
function removeInlineRemark(line: string): string {
  // 优先匹配中文解释格式：// 中文解释：...
  const chineseRemarkPattern = /\s*\/\/\s*中文解释[:：]\s*.*$/i
  if (chineseRemarkPattern.test(line)) {
    return line.replace(chineseRemarkPattern, '').trim()
  }
  
  // 匹配行尾的备注：内容 // 备注内容 或 内容 # 备注内容
  const inlineRemarkPatterns = [
    /\s*\/\/\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)[:：]?.*$/i,
    /\s*#\s*(中文解释|解释|备注|说明|comment|explanation|note|remark|หมายเหตุ|คำอธิบาย|شرح|تعليق|комментарий|объяснение|примечание)[:：]?.*$/i,
  ]
  
  let cleaned = line
  for (const pattern of inlineRemarkPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned.trim()
}

/**
 * 检测是否为纯标签行（不包含实际内容）
 */
function isLabelOnlyLine(line: string): boolean {
  const trimmed = line.trim()
  
  // 如果行很短（少于10个字符）且只包含标签字符，可能是纯标签
  if (trimmed.length < 10) {
    // 检查是否只包含标签相关的字符（中文、英文、数字、标点）
    const labelPattern = /^[\u4e00-\u9fa5a-zA-Z0-9\s\/\-_()：:]+$/
    if (labelPattern.test(trimmed)) {
      // 常见标签列表（支持多语言）
      const commonLabels = [
        // 中文标签
        '关键词', 'URL别名', '产品', '服务功能', '服务/功能', '搜索量', '竞争度', '优先级',
        '页面标题', 'H1标题', '元描述', '意图类型', '地区', '痛点/场景', '痛点', '场景',
        '介绍段落', '步骤', '常见问题', 'FAQ', '左边字段', '右边内容',
        // 英文标签
        'keyword', 'keywords', 'product', 'service', 'region', 'title', 'h1', 'meta description',
        'intent', 'status', 'priority', 'search volume', 'competition score',
        // 其他语言的常见标签（可以根据需要扩展）
      ]
      
      // 如果整行匹配某个标签，或者是标签的变体
      if (commonLabels.some((label) => trimmed.toLowerCase().includes(label.toLowerCase()))) {
        return true
      }
    }
  }
  
  return false
}

/**
 * 过滤掉备注和表单标签
 * 支持多语言（中文、英文、泰语、阿拉伯语、俄语等）
 * 特别过滤掉所有中文解释和表单抬头
 */
function filterRemarksAndLabels(text: string): string {
  // 表单抬头列表（需要过滤掉的标签行）
  const formHeaders = [
    '左边字段', '右边内容', '左边字段（中文）', '右边内容（英文 + 中文解释）',
    '常见问题', '步骤', 'FAQ', 'Part', '部分',
  ]
  
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      
      // 如果是备注行，直接移除
      if (isRemarkLine(trimmed)) {
        return ''
      }
      
      // 如果是表单抬头，移除
      if (formHeaders.some((header) => trimmed === header || trimmed.startsWith(header + '（') || trimmed.startsWith(header + '('))) {
        return ''
      }
      
      // 移除行尾的备注
      return removeInlineRemark(line)
    })
    .filter((line) => {
      const trimmed = line.trim()
      
      // 过滤空行
      if (!trimmed) return false
      
      // 过滤纯标签行
      if (isLabelOnlyLine(trimmed)) return false
      
      // 再次检查是否包含中文解释（可能有多行格式）
      if (trimmed.includes('// 中文解释：') || trimmed.includes('// 中文解释:')) {
        return false
      }
      
      return true
    })
    .join('\n')
    .trim()
}

/**
 * 清理值中的备注（支持多语言）
 */
function cleanValue(value: string): string {
  // 移除各种语言的备注格式
  return removeInlineRemark(value)
}

/**
 * 识别字段标签并提取对应的值
 * 支持多语言标签识别
 */
function extractFieldValue(text: string, fieldLabels: string[]): string | null {
  for (const label of fieldLabels) {
    // 转义特殊字符用于正则表达式
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 匹配格式：标签: 值 或 标签 (任何语言): 值
    // 支持多种分隔符：: :：| \t
    const patterns = [
      // 标准格式：标签: 值
      new RegExp(`^${escapedLabel}\\s*[:：]\\s*(.+)$`, 'im'),
      // 带括号说明：标签 (说明): 值
      new RegExp(`^${escapedLabel}\\s*\\([^)]+\\)\\s*[:：]\\s*(.+)$`, 'im'),
      // 表格格式：标签 | 值
      new RegExp(`^${escapedLabel}\\s*[|\\t]\\s*(.+)$`, 'im'),
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const value = match[1].trim()
        const cleaned = cleanValue(value)
        if (cleaned && cleaned.length > 0) {
          return cleaned
        }
      }
    }
    
    // 匹配多行格式：标签在行首，值在下一行或同一行
    // 使用更灵活的匹配，不依赖特定标签列表
    const multilinePattern = new RegExp(
      `^${escapedLabel}\\s*[:：]?\\s*\\n?\\s*(.+?)(?=\\n\\s*[\\u4e00-\\u9fa5a-zA-Z]+\\s*[:：]|$)`,
      'ims'
    )
    const multilineMatch = text.match(multilinePattern)
    if (multilineMatch && multilineMatch[1]) {
      const value = multilineMatch[1].trim()
      const cleaned = cleanValue(value)
      if (cleaned && cleaned.length > 0) {
        return cleaned
      }
    }
  }
  return null
}

/**
 * 识别关键词字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractKeyword(text: string): string | null {
  // 支持多种语言的"关键词"标签
  const labels = [
    // 中文、英文
    '关键词', 'keyword', 'Keywords', 'Keyword',
    // 亚洲语言
    'คำสำคัญ', // 泰语
    'कीवर्ड', // 印地语
    'كلمة مفتاحية', // 阿拉伯语
    'ключевое слово', 'ключевые слова', // 俄语
    // 欧洲语言
    'ključna beseda', 'ključne besede', // 斯洛文尼亚语
    'cuvânt cheie', 'cuvinte cheie', // 罗马尼亚语
    'palabra clave', 'palabras clave', // 西班牙语
    'mot-clé', 'mots-clés', // 法语
    'Schlüsselwort', 'Schlüsselwörter', // 德语
    'parola chiave', 'parole chiave', // 意大利语
    'palavra-chave', 'palavras-chave', // 葡萄牙语
    'sleutelwoord', 'sleutelwoorden', // 荷兰语
    'słowo kluczowe', 'słowa kluczowe', // 波兰语
    'klíčové slovo', 'klíčová slova', // 捷克语
    'kulcsszó', 'kulcsszavak', // 匈牙利语
    'λέξη-κλειδί', 'λέξεις-κλειδιά', // 希腊语
    'nyckelord', // 瑞典语
    'nøkkelord', // 挪威语
    'avainsana', 'avainsanat', // 芬兰语
    'ключова дума', 'ключови думи', // 保加利亚语
    'ključna riječ', 'ključne riječi', // 克罗地亚语
    'ključna reč', 'ključne reči', // 塞尔维亚语
  ]
  let value = extractFieldValue(text, labels)
  
  // 如果没有找到，尝试从文本开头提取（可能是第一行就是关键词）
  if (!value) {
    const firstLine = text.split('\n')[0]?.trim()
    if (firstLine && firstLine.length > 10) {
      // 检查是否包含分隔符（冒号、竖线等）
      const hasSeparator = /[:：|\\t]/.test(firstLine)
      if (!hasSeparator) {
        // 如果第一行很长且不包含分隔符，可能是关键词
        value = cleanValue(firstLine)
      }
    }
  }
  
  return value
}

/**
 * 识别产品字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractProduct(text: string): string | null {
  const labels = [
    // 中文、英文
    '产品', 'product', 'Product',
    // 亚洲语言
    'ผลิตภัณฑ์', // 泰语
    'उत्पाद', // 印地语
    'منتج', // 阿拉伯语
    'продукт', 'товар', // 俄语
    // 欧洲语言
    'izdelek', 'proizvod', // 斯洛文尼亚语
    'produs', 'produse', // 罗马尼亚语
    'producto', 'productos', // 西班牙语
    'produit', 'produits', // 法语
    'Produkt', 'Produkte', // 德语
    'prodotto', 'prodotti', // 意大利语
    'produto', 'produtos', // 葡萄牙语
    'product', 'producten', // 荷兰语
    'produkt', 'produkty', // 波兰语
    'produkt', 'produkty', // 捷克语
    'termék', 'termékek', // 匈牙利语
    'προϊόν', 'προϊόντα', // 希腊语
    'produkt', // 瑞典语
    'produkt', // 挪威语
    'tuote', 'tuotteet', // 芬兰语
    'продукт', 'продукти', // 保加利亚语
    'proizvod', 'proizvodi', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别服务/功能字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractService(text: string): string | null {
  const labels = [
    // 中文、英文
    '服务/功能', '服务功能', 'service', 'Service', 'Service Features',
    // 亚洲语言
    'บริการ', // 泰语
    'सेवा', // 印地语
    'خدمة', // 阿拉伯语
    'услуга', 'сервис', // 俄语
    // 欧洲语言
    'storitev', 'storitve', 'funkcija', 'funkcije', // 斯洛文尼亚语
    'serviciu', 'servicii', 'funcție', 'funcții', // 罗马尼亚语
    'servicio', 'servicios', 'función', 'funciones', // 西班牙语
    'service', 'services', 'fonction', 'fonctions', // 法语
    'Service', 'Dienst', 'Dienste', 'Funktion', 'Funktionen', // 德语
    'servizio', 'servizi', 'funzione', 'funzioni', // 意大利语
    'serviço', 'serviços', 'função', 'funções', // 葡萄牙语
    'service', 'diensten', 'functie', 'functies', // 荷兰语
    'usługa', 'usługi', 'funkcja', 'funkcje', // 波兰语
    'služba', 'služby', 'funkce', 'funkce', // 捷克语
    'szolgáltatás', 'szolgáltatások', 'funkció', 'funkciók', // 匈牙利语
    'υπηρεσία', 'υπηρεσίες', 'λειτουργία', 'λειτουργίες', // 希腊语
    'tjänst', 'tjänster', 'funktion', 'funktioner', // 瑞典语
    'tjeneste', 'tjenester', 'funksjon', 'funksjoner', // 挪威语
    'palvelu', 'palvelut', 'toiminto', 'toiminnot', // 芬兰语
    'услуга', 'услуги', 'функция', 'функции', // 保加利亚语
    'usluga', 'usluge', 'funkcija', 'funkcije', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别地区字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractRegion(text: string): string | null {
  const labels = [
    // 中文、英文
    '地区', 'region', 'Region',
    // 亚洲语言
    'ภูมิภาค', // 泰语
    'क्षेत्र', // 印地语
    'منطقة', // 阿拉伯语
    'регион', 'область', // 俄语
    // 欧洲语言
    'regija', 'regije', // 斯洛文尼亚语
    'regiune', 'regiuni', // 罗马尼亚语
    'región', 'regiones', // 西班牙语
    'région', 'régions', // 法语
    'Region', 'Gebiet', 'Gebiete', // 德语
    'regione', 'regioni', // 意大利语
    'região', 'regiões', // 葡萄牙语
    'regio', 'regio\'s', 'gebied', 'gebieden', // 荷兰语
    'region', 'regiony', // 波兰语
    'region', 'oblast', 'oblasti', // 捷克语
    'régió', 'régiók', // 匈牙利语
    'περιοχή', 'περιοχές', // 希腊语
    'region', 'regioner', // 瑞典语
    'region', 'regioner', // 挪威语
    'alue', 'alueet', // 芬兰语
    'регион', 'област', 'области', // 保加利亚语
    'regija', 'regije', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别痛点/场景字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractPainPoint(text: string): string | null {
  const labels = [
    // 中文、英文
    '痛点/场景', '痛点', '场景', 'pain_point', 'Pain Point', 'Pain Point/Scenario',
    // 亚洲语言
    'จุดเจ็บปวด', // 泰语
    'दर्द बिंदु', // 印地语
    'نقطة الألم', // 阿拉伯语
    'болевая точка', 'сценарий', // 俄语
    // 欧洲语言
    'točka bolečine', 'scenarij', // 斯洛文尼亚语
    'punct de durere', 'scenariu', // 罗马尼亚语
    'punto de dolor', 'escenario', // 西班牙语
    'point de douleur', 'scénario', // 法语
    'Schmerzpunkt', 'Szenario', // 德语
    'punto di dolore', 'scenario', // 意大利语
    'ponto de dor', 'cenário', // 葡萄牙语
    'pijnpunt', 'scenario', // 荷兰语
    'punkt bólu', 'scenariusz', // 波兰语
    'bolestivý bod', 'scénář', // 捷克语
    'fájdalom pont', 'forgatókönyv', // 匈牙利语
    'σημείο πόνου', 'σενάριο', // 希腊语
    'smärtpunkt', 'scenario', // 瑞典语
    'smertepunkt', 'scenario', // 挪威语
    'kivun kohta', 'skenaario', // 芬兰语
    'точка на болка', 'сценарий', // 保加利亚语
    'točka boli', 'scenarij', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别搜索量字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractSearchVolume(text: string): string | null {
  const labels = [
    // 中文、英文
    '搜索量', 'search_volume', 'Search Volume',
    // 亚洲语言
    'ปริมาณการค้นหา', // 泰语
    'खोज मात्रा', // 印地语
    'حجم البحث', // 阿拉伯语
    'объем поиска', // 俄语
    // 欧洲语言
    'obseg iskanja', // 斯洛文尼亚语
    'volum căutări', // 罗马尼亚语
    'volumen de búsqueda', // 西班牙语
    'volume de recherche', // 法语
    'Suchvolumen', // 德语
    'volume di ricerca', // 意大利语
    'volume de pesquisa', // 葡萄牙语
    'zoekvolume', // 荷兰语
    'wolumen wyszukiwań', // 波兰语
    'objem vyhledávání', // 捷克语
    'keresési mennyiség', // 匈牙利语
    'όγκος αναζήτησης', // 希腊语
    'sökvolym', // 瑞典语
    'søkevolum', // 挪威语
    'hakumäärä', // 芬兰语
    'обем на търсене', // 保加利亚语
    'obim pretrage', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    // 提取数字部分（支持各种数字格式）
    const match = value.match(/(\d+)/)
    return match ? match[1] : null
  }
  return null
}

/**
 * 识别竞争度字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractCompetitionScore(text: string): string | null {
  const labels = [
    // 中文、英文
    '竞争度', 'competition_score', 'Competition Score', 'Competitiveness',
    // 亚洲语言
    'ระดับการแข่งขัน', // 泰语
    'प्रतिस्पर्धा स्कोर', // 印地语
    'درجة المنافسة', // 阿拉伯语
    'уровень конкуренции', // 俄语
    // 欧洲语言
    'stopnja konkurence', // 斯洛文尼亚语
    'scor competiție', // 罗马尼亚语
    'puntuación de competencia', // 西班牙语
    'score de concurrence', // 法语
    'Wettbewerbsbewertung', // 德语
    'punteggio di competizione', // 意大利语
    'pontuação de competição', // 葡萄牙语
    'concurrentiescore', // 荷兰语
    'wynik konkurencji', // 波兰语
    'skóre konkurence', // 捷克语
    'versenypontszám', // 匈牙利语
    'βαθμός ανταγωνισμού', // 希腊语
    'konkurrenspoäng', // 瑞典语
    'konkurransescore', // 挪威语
    'kilpailupisteet', // 芬兰语
    'резултат на конкуренция', // 保加利亚语
    'rezultat konkurencije', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    // 提取 0-1 之间的数字（支持各种小数格式）
    const match = value.match(/(0?\.\d+|1\.0|0|1)/)
    return match ? match[1] : null
  }
  return null
}

/**
 * 识别优先级字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractPriority(text: string): string | null {
  const labels = [
    // 中文、英文
    '优先级', 'priority', 'Priority',
    // 亚洲语言
    'ลำดับความสำคัญ', // 泰语
    'प्राथमिकता', // 印地语
    'الأولوية', // 阿拉伯语
    'приоритет', // 俄语
    // 欧洲语言
    'prioriteta', // 斯洛文尼亚语
    'prioritate', // 罗马尼亚语
    'prioridad', // 西班牙语
    'priorité', // 法语
    'Priorität', // 德语
    'priorità', // 意大利语
    'prioridade', // 葡萄牙语
    'prioriteit', // 荷兰语
    'priorytet', // 波兰语
    'priorita', // 捷克语
    'prioritás', // 匈牙利语
    'προτεραιότητα', // 希腊语
    'prioritet', // 瑞典语
    'prioritet', // 挪威语
    'prioriteetti', // 芬兰语
    'приоритет', // 保加利亚语
    'prioritet', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    // 提取数字部分
    const match = value.match(/(\d+)/)
    return match ? match[1] : null
  }
  return null
}

/**
 * 识别页面标题字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractTitle(text: string): string | null {
  const labels = [
    // 中文、英文
    '页面标题', 'title', 'Title', 'Page Title',
    // 亚洲语言
    'หัวข้อหน้า', // 泰语
    'शीर्षक', // 印地语
    'عنوان الصفحة', // 阿拉伯语
    'заголовок страницы', 'название', // 俄语
    // 欧洲语言
    'naslov strani', 'naslov', // 斯洛文尼亚语
    'titlu pagină', 'titlu', // 罗马尼亚语
    'título de página', 'título', // 西班牙语
    'titre de page', 'titre', // 法语
    'Seitentitel', 'Titel', // 德语
    'titolo pagina', 'titolo', // 意大利语
    'título da página', 'título', // 葡萄牙语
    'paginatitel', 'titel', // 荷兰语
    'tytuł strony', 'tytuł', // 波兰语
    'název stránky', 'název', // 捷克语
    'oldal címe', 'cím', // 匈牙利语
    'τίτλος σελίδας', 'τίτλος', // 希腊语
    'sidtitel', 'titel', // 瑞典语
    'sidetittel', 'tittel', // 挪威语
    'sivun otsikko', 'otsikko', // 芬兰语
    'заглавие на страница', 'заглавие', // 保加利亚语
    'naslov stranice', 'naslov', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别H1标题字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractH1(text: string): string | null {
  const labels = [
    // 中文、英文
    'H1标题', 'H1', 'h1', 'Main heading',
    // 亚洲语言
    'หัวข้อหลัก', // 泰语
    'मुख्य शीर्षक', // 印地语
    'العنوان الرئيسي', // 阿拉伯语
    'главный заголовок', // 俄语
    // 欧洲语言
    'glavni naslov', 'H1 naslov', // 斯洛文尼亚语
    'titlu principal', 'H1 titlu', // 罗马尼亚语
    'encabezado principal', 'H1 encabezado', // 西班牙语
    'titre principal', 'H1 titre', // 法语
    'Hauptüberschrift', 'H1 Überschrift', // 德语
    'intestazione principale', 'H1 intestazione', // 意大利语
    'cabeçalho principal', 'H1 cabeçalho', // 葡萄牙语
    'hoofdkop', 'H1 kop', // 荷兰语
    'nagłówek główny', 'H1 nagłówek', // 波兰语
    'hlavní nadpis', 'H1 nadpis', // 捷克语
    'főcím', 'H1 cím', // 匈牙利语
    'κύριος τίτλος', 'H1 τίτλος', // 希腊语
    'huvudrubrik', 'H1 rubrik', // 瑞典语
    'hovedoverskrift', 'H1 overskrift', // 挪威语
    'pääotsikko', 'H1 otsikko', // 芬兰语
    'главно заглавие', 'H1 заглавие', // 保加利亚语
    'glavni naslov', 'H1 naslov', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别元描述字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractMetaDescription(text: string): string | null {
  const labels = [
    // 中文、英文
    '元描述', 'meta_description', 'Meta Description',
    // 亚洲语言
    'คำอธิบาย', // 泰语
    'मेटा विवरण', // 印地语
    'الوصف التعريفي', // 阿拉伯语
    'мета-описание', // 俄语
    // 欧洲语言
    'meta opis', 'opis', // 斯洛文尼亚语
    'meta descriere', 'descriere', // 罗马尼亚语
    'meta descripción', 'descripción', // 西班牙语
    'meta description', 'description', // 法语
    'Meta-Beschreibung', 'Beschreibung', // 德语
    'meta descrizione', 'descrizione', // 意大利语
    'meta descrição', 'descrição', // 葡萄牙语
    'meta beschrijving', 'beschrijving', // 荷兰语
    'meta opis', 'opis', // 波兰语
    'meta popis', 'popis', // 捷克语
    'meta leírás', 'leírás', // 匈牙利语
    'meta περιγραφή', 'περιγραφή', // 希腊语
    'meta beskrivning', 'beskrivning', // 瑞典语
    'meta beskrivelse', 'beskrivelse', // 挪威语
    'meta kuvaus', 'kuvaus', // 芬兰语
    'meta описание', 'описание', // 保加利亚语
    'meta opis', 'opis', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别介绍段落字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractIntroParagraph(text: string): string | null {
  const labels = [
    // 中文、英文
    '介绍段落', 'intro_paragraph', 'Introduction Paragraph', 'Overview',
    // 亚洲语言
    'ย่อหน้าแนะนำ', // 泰语
    'परिचय', // 印地语
    'فقرة المقدمة', // 阿拉伯语
    'вводный абзац', 'введение', // 俄语
    // 欧洲语言
    'uvodni odstavek', 'uvod', // 斯洛文尼亚语
    'paragraf introductiv', 'introducere', // 罗马尼亚语
    'párrafo de introducción', 'introducción', // 西班牙语
    'paragraphe d\'introduction', 'introduction', // 法语
    'Einführungsabsatz', 'Einführung', 'Überblick', // 德语
    'paragrafo introduttivo', 'introduzione', // 意大利语
    'parágrafo introdutório', 'introdução', // 葡萄牙语
    'inleidende paragraaf', 'inleiding', 'overzicht', // 荷兰语
    'akapit wprowadzający', 'wprowadzenie', 'przegląd', // 波兰语
    'úvodní odstavec', 'úvod', 'přehled', // 捷克语
    'bevezető bekezdés', 'bevezetés', 'áttekintés', // 匈牙利语
    'εισαγωγική παράγραφος', 'εισαγωγή', 'επισκόπηση', // 希腊语
    'introduktionsstycke', 'introduktion', 'översikt', // 瑞典语
    'innledningsavsnitt', 'innledning', 'oversikt', // 挪威语
    'johdantokappale', 'johdanto', 'yleiskatsaus', // 芬兰语
    'въвеждащ параграф', 'въведение', 'преглед', // 保加利亚语
    'uvodni odlomak', 'uvod', 'pregled', // 克罗地亚语/塞尔维亚语
  ]
  return extractFieldValue(text, labels)
}

/**
 * 识别URL别名字段
 * 支持多语言标签（包括欧洲语言）
 */
function extractPageSlug(text: string): string | null {
  const labels = [
    // 中文、英文
    'URL别名', 'page_slug', 'Page Slug', 'URL Alias',
    // 亚洲语言
    'นามแฝง URL', // 泰语
    'URL उपनाम', // 印地语
    'اسم URL', // 阿拉伯语
    'URL псевдоним', // 俄语
    // 欧洲语言
    'URL vzdevek', // 斯洛文尼亚语
    'alias URL', // 罗马尼亚语
    'alias de URL', // 西班牙语
    'alias URL', // 法语
    'URL-Alias', // 德语
    'alias URL', // 意大利语
    'alias de URL', // 葡萄牙语
    'URL alias', // 荷兰语
    'alias URL', // 波兰语
    'URL alias', // 捷克语
    'URL álneve', // 匈牙利语
    'ψευδώνυμο URL', // 希腊语
    'URL-alias', // 瑞典语
    'URL-alias', // 挪威语
    'URL-aliaksen', // 芬兰语
    'URL псевдоним', // 保加利亚语
    'URL alias', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    // 移除可能的路径前缀和各种语言的备注
    return cleanValue(value)
      .replace(/^\/keywords\//, '')
      .replace(/^keywords-/, '')
      .trim()
  }
  return null
}

/**
 * 识别意图类型字段
 * 支持多语言标签和值（包括欧洲语言）
 */
function extractIntent(text: string): string | null {
  const labels = [
    // 中文、英文
    '意图类型', 'intent', 'Intent', 'Intent Type',
    // 亚洲语言
    'ประเภทความตั้งใจ', // 泰语
    'इरादा प्रकार', // 印地语
    'نوع النية', // 阿拉伯语
    'тип намерения', // 俄语
    // 欧洲语言
    'vrsta namena', // 斯洛文尼亚语
    'tip intenție', // 罗马尼亚语
    'tipo de intención', // 西班牙语
    'type d\'intention', // 法语
    'Absichtstyp', // 德语
    'tipo di intenzione', // 意大利语
    'tipo de intenção', // 葡萄牙语
    'intentietype', // 荷兰语
    'typ intencji', // 波兰语
    'typ záměru', // 捷克语
    'szándék típusa', // 匈牙利语
    'τύπος πρόθεσης', // 希腊语
    'avsiktstyp', // 瑞典语
    'intensjonstype', // 挪威语
    'aikomus tyyppi', // 芬兰语
    'тип намерение', // 保加利亚语
    'tip namjere', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    // 标准化意图值（支持多语言关键词，包括欧洲语言）
    const normalized = value.toLowerCase().trim()
    
    // 检查是否包含混合意图的关键词（多语言，包括欧洲语言）
    const hasInformational = normalized.includes('informational') || normalized.includes('信息') || 
      normalized.includes('ข้อมูล') || normalized.includes('معلومات') ||
      normalized.includes('informativno') || normalized.includes('informativ') || // 斯洛文尼亚语/罗马尼亚语
      normalized.includes('informativo') || normalized.includes('informatif') || // 西班牙语/法语
      normalized.includes('informativ') || normalized.includes('informativo') || // 德语/意大利语
      normalized.includes('informatief') || normalized.includes('informacyjne') || // 荷兰语/波兰语
      normalized.includes('informační') || normalized.includes('tájékoztató') || // 捷克语/匈牙利语
      normalized.includes('ενημερωτικό') || normalized.includes('informativt') || // 希腊语/瑞典语
      normalized.includes('informativt') || normalized.includes('informatiivinen') || // 挪威语/芬兰语
      normalized.includes('информационно') || normalized.includes('informativno') // 保加利亚语/塞尔维亚语
    
    const hasComparison = normalized.includes('comparison') || normalized.includes('对比') || 
      normalized.includes('เปรียบเทียบ') || normalized.includes('مقارنة') ||
      normalized.includes('primerjava') || normalized.includes('comparare') || // 斯洛文尼亚语/罗马尼亚语
      normalized.includes('comparación') || normalized.includes('comparaison') || // 西班牙语/法语
      normalized.includes('Vergleich') || normalized.includes('confronto') || // 德语/意大利语
      normalized.includes('comparação') || normalized.includes('vergelijking') || // 葡萄牙语/荷兰语
      normalized.includes('porównanie') || normalized.includes('srovnání') || // 波兰语/捷克语
      normalized.includes('összehasonlítás') || normalized.includes('σύγκριση') || // 匈牙利语/希腊语
      normalized.includes('jämförelse') || normalized.includes('sammenligning') || // 瑞典语/挪威语
      normalized.includes('vertailu') || normalized.includes('сравнение') || // 芬兰语/保加利亚语
      normalized.includes('poređenje') // 塞尔维亚语
    
    const hasTransactional = normalized.includes('transactional') || normalized.includes('交易') || 
      normalized.includes('ธุรกรรม') || normalized.includes('معاملة') ||
      normalized.includes('transakcijsko') || normalized.includes('tranzacțional') || // 斯洛文尼亚语/罗马尼亚语
      normalized.includes('transaccional') || normalized.includes('transactionnel') || // 西班牙语/法语
      normalized.includes('transaktional') || normalized.includes('transazionale') || // 德语/意大利语
      normalized.includes('transacional') || normalized.includes('transactioneel') || // 葡萄牙语/荷兰语
      normalized.includes('transakcyjne') || normalized.includes('transakční') || // 波兰语/捷克语
      normalized.includes('tranzakciós') || normalized.includes('συναλλακτικό') || // 匈牙利语/希腊语
      normalized.includes('transaktionell') || normalized.includes('transaksjonell') || // 瑞典语/挪威语
      normalized.includes('transaktio') || normalized.includes('транзакционен') || // 芬兰语/保加利亚语
      normalized.includes('transakcioni') // 塞尔维亚语
    
    if (hasInformational && hasComparison && hasTransactional) {
      return 'information_comparison_transaction'
    }
    if (hasInformational) return 'information'
    if (hasComparison) return 'comparison'
    if (hasTransactional) return 'transaction'
  }
  return null
}

/**
 * 识别页面风格字段
 * 支持多语言标签和值（包括欧洲语言）
 */
function extractPageStyle(text: string): 'default' | 'christmas' | 'official' | null {
  const labels = [
    // 中文、英文
    '页面风格', 'page_style', 'Page Style',
    // 亚洲语言
    'สไตล์หน้า', // 泰语
    'पृष्ठ शैली', // 印地语
    'نمط الصفحة', // 阿拉伯语
    'стиль страницы', // 俄语
    // 欧洲语言
    'slog strani', // 斯洛文尼亚语
    'stil pagină', // 罗马尼亚语
    'estilo de página', // 西班牙语
    'style de page', // 法语
    'Seitenstil', // 德语
    'stile pagina', // 意大利语
    'estilo da página', // 葡萄牙语
    'pagina stijl', // 荷兰语
    'styl strony', // 波兰语
    'styl stránky', // 捷克语
    'oldal stílus', // 匈牙利语
    'στυλ σελίδας', // 希腊语
    'sidstil', // 瑞典语
    'sidestil', // 挪威语
    'sivun tyyli', // 芬兰语
    'стил на страница', // 保加利亚语
    'stil stranice', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    const normalized = value.toLowerCase().trim()
    // 支持多语言的圣诞节关键词（包括欧洲语言）
    if (normalized.includes('christmas') || normalized.includes('圣诞') || 
        normalized.includes('คริสต์มาส') || normalized.includes('عيد الميلاد') ||
        normalized.includes('рождество') || normalized.includes('božič') || // 斯洛文尼亚语
        normalized.includes('crăciun') || normalized.includes('navidad') || // 罗马尼亚语/西班牙语
        normalized.includes('noël') || normalized.includes('weihnachten') || // 法语/德语
        normalized.includes('natale') || normalized.includes('natal') || // 意大利语/葡萄牙语
        normalized.includes('kerst') || normalized.includes('święta') || // 荷兰语/波兰语
        normalized.includes('vánoce') || normalized.includes('karácsony') || // 捷克语/匈牙利语
        normalized.includes('χριστούγεννα') || normalized.includes('jul') || // 希腊语/瑞典语
        normalized.includes('jul') || normalized.includes('joulu') || // 挪威语/芬兰语
        normalized.includes('коледа') || normalized.includes('božić')) { // 保加利亚语/塞尔维亚语
      return 'christmas'
    }
    // 支持多语言的官网关键词（包括欧洲语言）
    if (normalized.includes('official') || normalized.includes('官网') ||
        normalized.includes('อย่างเป็นทางการ') || normalized.includes('رسمي') ||
        normalized.includes('официальный') || normalized.includes('uradno') || // 斯洛文尼亚语
        normalized.includes('oficial') || normalized.includes('oficial') || // 罗马尼亚语/西班牙语
        normalized.includes('officiel') || normalized.includes('offiziell') || // 法语/德语
        normalized.includes('ufficiale') || normalized.includes('oficial') || // 意大利语/葡萄牙语
        normalized.includes('officieel') || normalized.includes('oficjalny') || // 荷兰语/波兰语
        normalized.includes('oficiální') || normalized.includes('hivatalos') || // 捷克语/匈牙利语
        normalized.includes('επίσημο') || normalized.includes('officiell') || // 希腊语/瑞典语
        normalized.includes('offisiell') || normalized.includes('virallinen') || // 挪威语/芬兰语
        normalized.includes('официален') || normalized.includes('zvanično')) { // 保加利亚语/塞尔维亚语
      return 'official'
    }
    return 'default'
  }
  return null
}

/**
 * 识别状态字段
 * 支持多语言标签和值（包括欧洲语言）
 */
function extractStatus(text: string): 'draft' | 'published' | null {
  const labels = [
    // 中文、英文
    '状态', 'status', 'Status',
    // 亚洲语言
    'สถานะ', // 泰语
    'स्थिति', // 印地语
    'الحالة', // 阿拉伯语
    'статус', // 俄语
    // 欧洲语言
    'status', // 斯洛文尼亚语
    'stare', // 罗马尼亚语
    'estado', // 西班牙语
    'statut', // 法语
    'Status', // 德语
    'stato', // 意大利语
    'status', 'estado', // 葡萄牙语
    'status', // 荷兰语
    'status', // 波兰语
    'stav', // 捷克语
    'állapot', // 匈牙利语
    'κατάσταση', // 希腊语
    'status', // 瑞典语
    'status', // 挪威语
    'tila', // 芬兰语
    'статус', // 保加利亚语
    'status', // 克罗地亚语/塞尔维亚语
  ]
  const value = extractFieldValue(text, labels)
  if (value) {
    const normalized = value.toLowerCase().trim()
    // 支持多语言的"已发布"关键词（包括欧洲语言）
    if (normalized.includes('published') || normalized.includes('发布') ||
        normalized.includes('เผยแพร่') || normalized.includes('प्रकाशित') ||
        normalized.includes('منشور') || normalized.includes('опубликовано') ||
        normalized.includes('objavljeno') || normalized.includes('publicat') || // 斯洛文尼亚语/罗马尼亚语
        normalized.includes('publicado') || normalized.includes('publié') || // 西班牙语/法语
        normalized.includes('veröffentlicht') || normalized.includes('pubblicato') || // 德语/意大利语
        normalized.includes('publicado') || normalized.includes('gepubliceerd') || // 葡萄牙语/荷兰语
        normalized.includes('opublikowane') || normalized.includes('zveřejněno') || // 波兰语/捷克语
        normalized.includes('közzétéve') || normalized.includes('δημοσιευμένο') || // 匈牙利语/希腊语
        normalized.includes('publicerad') || normalized.includes('publisert') || // 瑞典语/挪威语
        normalized.includes('julkaistu') || normalized.includes('публикувано') || // 芬兰语/保加利亚语
        normalized.includes('objavljeno')) { // 塞尔维亚语
      return 'published'
    }
    return 'draft'
  }
  return null
}

/**
 * 识别步骤字段
 * 支持多语言格式（包括欧洲语言）
 * 特别支持：步骤1标题、步骤1描述 格式
 */
function extractSteps(text: string): Array<{ title: string; description?: string }> {
  const steps: Array<{ title: string; description?: string }> = []
  
  // 首先尝试匹配"步骤X标题"和"步骤X描述"格式
  const stepTitlePattern = /步骤\s*(\d+)\s*标题[：:]\s*([^\n]+)/gi
  const stepDescPattern = /步骤\s*(\d+)\s*描述[：:]\s*([\s\S]+?)(?=步骤\s*\d+|$)/gi
  
  const titleMatches = [...text.matchAll(stepTitlePattern)]
  const descMatches = [...text.matchAll(stepDescPattern)]
  
  // 创建步骤映射
  const stepMap = new Map<number, { title?: string; description?: string }>()
  
  titleMatches.forEach((m) => {
    const stepNum = parseInt(m[1], 10)
    const title = cleanValue(m[2].trim())
    if (title) {
      if (!stepMap.has(stepNum)) {
        stepMap.set(stepNum, {})
      }
      stepMap.get(stepNum)!.title = title
    }
  })
  
  descMatches.forEach((m) => {
    const stepNum = parseInt(m[1], 10)
    const description = cleanValue(m[2].trim())
    if (description) {
      if (!stepMap.has(stepNum)) {
        stepMap.set(stepNum, {})
      }
      stepMap.get(stepNum)!.description = description
    }
  })
  
  // 将映射转换为数组
  if (stepMap.size > 0) {
    const sortedSteps = Array.from(stepMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, step]) => step)
      .filter((step) => step.title || step.description)
    
    if (sortedSteps.length > 0) {
      return sortedSteps.map((step) => ({
        title: step.title || step.description?.split('\n')[0] || 'Step',
        description: step.description && step.title ? step.description : undefined,
      }))
    }
  }
  
  // 匹配步骤格式：支持多种语言的"步骤"标签
  // 步骤1、Step 1、ขั้นตอนที่ 1、шаг 1、korak 1、pas 1 等
  // 使用 [\s\S] 代替 . 以匹配包括换行符在内的所有字符（兼容 ES2017）
  const stepPattern = /(?:步骤|Step|ขั้นตอน|चरण|خطوة|шаг|step|korak|koraki|pas|pași|paso|pasos|étape|étapes|Schritt|Schritte|passo|passi|stap|stappen|krok|kroki|krok|kroky|lépés|lépések|βήμα|βήματα|steg|steg|askel|askeleet|стъпка|стъпки)\s*(\d+)[.:]?\s*([\s\S]+?)(?=(?:步骤|Step|ขั้นตอน|चरण|خطوة|шаг|step|korak|koraki|pas|pași|paso|pasos|étape|étapes|Schritt|Schritte|passo|passi|stap|stappen|krok|kroki|krok|kroky|lépés|lépések|βήμα|βήματα|steg|steg|askel|askeleet|стъпка|стъпки)\s*\d+|$)/gi
  let match
  
  while ((match = stepPattern.exec(text)) !== null) {
    const stepContent = match[2].trim()
    // 移除各种语言的备注
    const cleanedContent = cleanValue(stepContent)
    // 分离标题和描述（通常第一行是标题，后续是描述）
    const lines = cleanedContent.split('\n').filter((l) => {
      const trimmed = l.trim()
      return trimmed && !isRemarkLine(trimmed) && !trimmed.includes('// 中文解释')
    })
    if (lines.length > 0) {
      const title = lines[0].replace(/^[\d.]+\s*/, '').trim()
      const description = lines.slice(1).join('\n').trim() || undefined
      if (title) {
        steps.push({ title, description })
      }
    }
  }
  
  // 如果没有找到步骤，尝试匹配编号列表（如 1.1, 1.2, 2.1 等）
  // 这种格式是通用的，不依赖语言
  // 使用 [\s\S] 代替 . 以匹配包括换行符在内的所有字符（兼容 ES2017）
  if (steps.length === 0) {
    const numberedPattern = /^\s*(\d+\.\d+|\d+)[.)]\s*([\s\S]+?)(?=^\s*\d+[.)]|$)/gim
    const numberedMatches = [...text.matchAll(numberedPattern)]
    if (numberedMatches.length > 0) {
      numberedMatches.forEach((m) => {
        const content = m[2].trim()
        // 移除各种语言的备注
        const cleanedContent = cleanValue(content)
        const lines = cleanedContent.split('\n').filter((l) => {
          const trimmed = l.trim()
          return trimmed && !isRemarkLine(trimmed) && !trimmed.includes('// 中文解释')
        })
        if (lines.length > 0) {
          const title = lines[0].trim()
          const description = lines.slice(1).join('\n').trim() || undefined
          if (title && title.length > 3) {
            steps.push({ title, description })
          }
        }
      })
    }
  }
  
  return steps
}

/**
 * 识别FAQ字段
 * 支持多语言格式（包括欧洲语言）
 * 特别支持：问题1、回答1 格式
 */
function extractFaq(text: string): Array<{ question: string; answer: string }> {
  const faq: Array<{ question: string; answer: string }> = []
  
  // 首先尝试匹配"问题X"和"回答X"格式
  const questionPattern = /问题\s*(\d+)[：:]\s*([^\n]+)/gi
  const answerPattern = /回答\s*(\d+)[：:]\s*([\s\S]+?)(?=问题\s*\d+|常见问题|FAQ|$)/gi
  
  const questionMatches = [...text.matchAll(questionPattern)]
  const answerMatches = [...text.matchAll(answerPattern)]
  
  // 创建FAQ映射
  const faqMap = new Map<number, { question?: string; answer?: string }>()
  
  questionMatches.forEach((m) => {
    const faqNum = parseInt(m[1], 10)
    const question = cleanValue(m[2].trim())
    if (question) {
      if (!faqMap.has(faqNum)) {
        faqMap.set(faqNum, {})
      }
      faqMap.get(faqNum)!.question = question
    }
  })
  
  answerMatches.forEach((m) => {
    const faqNum = parseInt(m[1], 10)
    const answer = cleanValue(m[2].trim())
    if (answer) {
      if (!faqMap.has(faqNum)) {
        faqMap.set(faqNum, {})
      }
      faqMap.get(faqNum)!.answer = answer
    }
  })
  
  // 将映射转换为数组
  if (faqMap.size > 0) {
    const sortedFaq = Array.from(faqMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, faq]) => faq)
      .filter((item) => item.question && item.answer)
    
    if (sortedFaq.length > 0) {
      return sortedFaq.map((item) => ({
        question: item.question!,
        answer: item.answer!,
      }))
    }
  }
  
  // 匹配FAQ格式：支持多种语言的"常见问题"标签
  // 常见问题、FAQ、คำถามที่พบบ่อย、सामान्य प्रश्न、الأسئلة الشائعة、часто задаваемые вопросы、pogosta vprašanja、întrebări frecvente 等
  // 使用 [\s\S] 代替 . 以匹配包括换行符在内的所有字符（兼容 ES2017）
  const faqPattern = /(?:常见问题|FAQ|Question|Q|คำถามที่พบบ่อย|सामान्य प्रश्न|الأسئلة الشائعة|часто задаваемые вопросы|faq|pogosta vprašanja|întrebări frecvente|preguntas frecuentes|questions fréquentes|häufig gestellte Fragen|domande frequenti|perguntas frequentes|veelgestelde vragen|często zadawane pytania|časté otázky|gyakori kérdések|συχνές ερωτήσεις|vanliga frågor|vanlige spørsmål|usein kysytyt kysymykset|често задавани въпроси|često postavljana pitanja)[\s:：]*([\s\S]+?)(?=(?:常见问题|FAQ|Question|Q|คำถามที่พบบ่อย|सामान्य प्रश्न|الأسئلة الشائعة|часто задаваемые вопросы|faq|pogosta vprašanja|întrebări frecvente|preguntas frecuentes|questions fréquentes|häufig gestellte Fragen|domande frequenti|perguntas frequentes|veelgestelde vragen|często zadawane pytania|časté otázky|gyakori kérdések|συχνές ερωτήσεις|vanliga frågor|vanlige spørsmål|usein kysytyt kysymykset|често задавани въпроси|često postavljana pitanja)[\s:：]|$)/gi
  let match
  
  while ((match = faqPattern.exec(text)) !== null) {
    let faqContent = match[1].trim()
    // 移除各种语言的备注
    faqContent = cleanValue(faqContent)
    // 分离问题和答案（通常以问号结尾的是问题）
    // 支持多种语言的问号：? ？ ؟
    // 使用 [\s\S] 代替 . 以匹配包括换行符在内的所有字符（兼容 ES2017）
    const questionMatch = faqContent.match(/^([\s\S]+[?？؟])\s*([\s\S]+)$/)
    if (questionMatch) {
      const question = cleanValue(questionMatch[1].trim())
      const answer = cleanValue(questionMatch[2].trim())
      if (question && answer) {
        faq.push({ question, answer })
      }
    }
  }
  
  // 如果没有找到，尝试匹配以问号结尾的行作为问题（支持多种问号）
  // 使用 [\s\S] 代替 . 以匹配包括换行符在内的所有字符（兼容 ES2017）
  if (faq.length === 0) {
    const questionPattern = /^([\s\S]+[?？؟])\s*\n([\s\S]+?)(?=^[\s\S]+[?？؟]|$)/gim
    const questionMatches = [...text.matchAll(questionPattern)]
    if (questionMatches.length > 0) {
      questionMatches.forEach((m) => {
        const question = cleanValue(m[1].trim())
        const answer = cleanValue(m[2].trim())
        if (question && answer) {
          faq.push({ question, answer })
        }
      })
    }
  }
  
  return faq
}

/**
 * 处理表格格式的文本（左边字段，右边内容）
 * 支持多语言字段名
 */
function parseTableFormat(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = text.split('\n')
  
  // 多语言字段名列表（可以根据需要扩展）
  const fieldNames = [
    // 中文
    '关键词', 'URL别名', '产品', '服务功能', '服务/功能', '搜索量', '竞争度', '优先级',
    '页面标题', 'H1标题', '元描述', '意图类型', '地区', '痛点/场景', '痛点', '场景', '介绍段落',
    // 英文
    'keyword', 'keywords', 'product', 'service', 'region', 'title', 'h1', 'meta description',
    'intent', 'status', 'priority', 'search volume', 'competition score', 'page slug',
    // 亚洲语言
    'คำสำคัญ', 'ผลิตภัณฑ์', 'บริการ', 'ภูมิภาค', // 泰语
    'कीवर्ड', 'उत्पाद', 'सेवा', 'क्षेत्र', // 印地语
    'كلمة مفتاحية', 'منتج', 'خدمة', 'منطقة', // 阿拉伯语
    'ключевое слово', 'продукт', 'услуга', 'регион', // 俄语
    // 欧洲语言 - 斯洛文尼亚语
    'ključna beseda', 'izdelek', 'storitev', 'regija', 'naslov', 'opis',
    // 欧洲语言 - 罗马尼亚语
    'cuvânt cheie', 'produs', 'serviciu', 'regiune', 'titlu', 'descriere',
    // 欧洲语言 - 西班牙语
    'palabra clave', 'producto', 'servicio', 'región', 'título', 'descripción',
    // 欧洲语言 - 法语
    'mot-clé', 'produit', 'service', 'région', 'titre', 'description',
    // 欧洲语言 - 德语
    'Schlüsselwort', 'Produkt', 'Service', 'Region', 'Titel', 'Beschreibung',
    // 欧洲语言 - 意大利语
    'parola chiave', 'prodotto', 'servizio', 'regione', 'titolo', 'descrizione',
    // 欧洲语言 - 葡萄牙语
    'palavra-chave', 'produto', 'serviço', 'região', 'título', 'descrição',
    // 欧洲语言 - 荷兰语
    'sleutelwoord', 'product', 'service', 'regio', 'titel', 'beschrijving',
    // 欧洲语言 - 波兰语
    'słowo kluczowe', 'produkt', 'usługa', 'region', 'tytuł', 'opis',
    // 欧洲语言 - 捷克语
    'klíčové slovo', 'produkt', 'služba', 'region', 'název', 'popis',
    // 欧洲语言 - 匈牙利语
    'kulcsszó', 'termék', 'szolgáltatás', 'régió', 'cím', 'leírás',
    // 欧洲语言 - 希腊语
    'λέξη-κλειδί', 'προϊόν', 'υπηρεσία', 'περιοχή', 'τίτλος', 'περιγραφή',
    // 欧洲语言 - 瑞典语
    'nyckelord', 'produkt', 'tjänst', 'region', 'titel', 'beskrivning',
    // 欧洲语言 - 挪威语
    'nøkkelord', 'produkt', 'tjeneste', 'region', 'tittel', 'beskrivelse',
    // 欧洲语言 - 芬兰语
    'avainsana', 'tuote', 'palvelu', 'alue', 'otsikko', 'kuvaus',
    // 欧洲语言 - 保加利亚语
    'ключова дума', 'продукт', 'услуга', 'регион', 'заглавие', 'описание',
    // 欧洲语言 - 克罗地亚语/塞尔维亚语
    'ključna riječ', 'proizvod', 'usluga', 'regija', 'naslov', 'opis',
  ]
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // 匹配表格格式：字段名 | 内容 或 字段名\t内容
    // 匹配表格格式：字段名 | 内容 或 字段名\t内容
    // 支持多种分隔符：| \t : ：等
    const tableMatch = line.match(/^(.+?)\s*[|\\t:：]\s*(.+)$/)
    if (tableMatch) {
      const fieldName = tableMatch[1].trim()
      let value = tableMatch[2].trim()
      // 移除各种语言的备注
      value = cleanValue(value)
      if (value) {
        result[fieldName] = value
      }
    }
    
    // 匹配两列格式：如果当前行是字段名，下一行可能是值
    // 检查是否匹配任何已知的字段名（不区分大小写）
    const matchedField = fieldNames.find((name) => {
      const lowerLine = line.toLowerCase()
      const lowerName = name.toLowerCase()
      return lowerLine === lowerName || lowerLine.startsWith(lowerName)
    })
    
    if (matchedField) {
      // 检查下一行是否有内容
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if (nextLine && !isRemarkLine(nextLine)) {
          // 检查下一行不是另一个字段名
          const isNextLineField = fieldNames.some((name) => {
            const lowerNext = nextLine.toLowerCase()
            const lowerName = name.toLowerCase()
            return lowerNext === lowerName || lowerNext.startsWith(lowerName)
          })
          
          if (!isNextLineField) {
            const value = cleanValue(nextLine)
            if (value) {
              result[line] = value
              i++ // 跳过下一行，因为已经处理了
            }
          }
        }
      }
    }
  }
  
  return result
}

/**
 * 主函数：解析文本并提取所有字段
 * 支持多语言（中文、英文、泰语、印地语、阿拉伯语、俄语等）
 */
export function parseKeywordText(inputText: string): ParsedKeywordData {
  // 先过滤掉各种语言的备注和表单标签
  const cleanedText = filterRemarksAndLabels(inputText)
  
  // 尝试解析表格格式
  const tableData = parseTableFormat(cleanedText)
  
  const parsed: ParsedKeywordData = {}
  
  // 提取各个字段（优先使用表格数据）
  const keyword = tableData['关键词'] || tableData['keyword'] || extractKeyword(cleanedText)
  if (keyword) parsed.keyword = keyword
  
  const product = tableData['产品'] || tableData['product'] || extractProduct(cleanedText)
  if (product) parsed.product = product
  
  const service = tableData['服务功能'] || tableData['服务/功能'] || tableData['service'] || extractService(cleanedText)
  if (service) parsed.service = service
  
  const region = tableData['地区'] || tableData['region'] || extractRegion(cleanedText)
  if (region) parsed.region = region
  
  const painPoint = tableData['痛点/场景'] || tableData['痛点'] || tableData['场景'] || tableData['pain_point'] || extractPainPoint(cleanedText)
  if (painPoint) parsed.pain_point = painPoint
  
  const searchVolume = tableData['搜索量'] || tableData['search_volume'] || extractSearchVolume(cleanedText)
  if (searchVolume) parsed.search_volume = searchVolume
  
  const competitionScore = tableData['竞争度'] || tableData['competition_score'] || extractCompetitionScore(cleanedText)
  if (competitionScore) parsed.competition_score = competitionScore
  
  const priority = tableData['优先级'] || tableData['priority'] || extractPriority(cleanedText)
  if (priority) parsed.priority = priority
  
  const title = tableData['页面标题'] || tableData['title'] || extractTitle(cleanedText)
  if (title) parsed.title = title
  
  const h1 = tableData['H1标题'] || tableData['H1'] || tableData['h1'] || extractH1(cleanedText)
  if (h1) parsed.h1 = h1
  
  const metaDescription = tableData['元描述'] || tableData['meta_description'] || extractMetaDescription(cleanedText)
  if (metaDescription) parsed.meta_description = metaDescription
  
  const introParagraph = tableData['介绍段落'] || tableData['intro_paragraph'] || extractIntroParagraph(cleanedText)
  if (introParagraph) parsed.intro_paragraph = introParagraph
  
  const pageSlug = tableData['URL别名'] || tableData['page_slug'] || extractPageSlug(cleanedText)
  if (pageSlug) parsed.page_slug = pageSlug
  
  const intent = tableData['意图类型'] || tableData['intent'] || extractIntent(cleanedText)
  if (intent) parsed.intent = intent
  
  const pageStyle = extractPageStyle(cleanedText) || 
    (tableData['页面风格'] || tableData['page_style'] 
      ? (['default', 'christmas', 'official'].includes((tableData['页面风格'] || tableData['page_style'] || '').toLowerCase().trim()) 
        ? (tableData['页面风格'] || tableData['page_style'] || '').toLowerCase().trim() as 'default' | 'christmas' | 'official'
        : null)
      : null)
  if (pageStyle) parsed.page_style = pageStyle
  
  const status = extractStatus(cleanedText) ||
    (tableData['状态'] || tableData['status']
      ? (['draft', 'published'].includes((tableData['状态'] || tableData['status'] || '').toLowerCase().trim())
        ? (tableData['状态'] || tableData['status'] || '').toLowerCase().trim() as 'draft' | 'published'
        : null)
      : null)
  if (status) parsed.status = status
  
  const steps = extractSteps(cleanedText)
  if (steps.length > 0) parsed.steps = steps
  
  const faq = extractFaq(cleanedText)
  if (faq.length > 0) parsed.faq = faq
  
  return parsed
}
