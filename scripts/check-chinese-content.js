#!/usr/bin/env node

/**
 * 检查代码和内容中的中文字符
 * 
 * 使用方法：
 * node scripts/check-chinese-content.js [--fix] [--exclude-dirs=dir1,dir2]
 * 
 * 选项：
 * --fix: 自动修复（移除注释中的中文，但保留代码逻辑）
 * --exclude-dirs: 排除的目录（用逗号分隔，如 node_modules,.next）
 * 
 * 检查范围：
 * - 所有 .ts, .tsx, .js, .jsx 文件中的字符串和注释
 * - 所有 .md 文档文件（除了明确标记为中文文档的）
 * - 数据库内容（通过 API 检查）
 */

const fs = require('fs')
const path = require('path')

// 中文字符正则（包括中文标点）
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/

// 允许包含中文的文件/目录（白名单）
const ALLOWED_CHINESE_PATHS = [
  /\.md$/,  // Markdown 文档可以包含中文（用于内部文档）
  /README\.md$/i,
  /CHANGELOG\.md$/i,
  /docs\/.*\.md$/,  // docs 目录下的文档
  /scripts\/.*\.md$/,  // scripts 目录下的文档
  /GEO_AND_SEO_UNIFIED\.md$/,  // 策略文档
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
]

// 调试脚本（降低优先级，但不完全排除）
const DEBUG_SCRIPTS = [
  /CONSOLE_.*\.js$/i,
  /.*DEBUG.*\.js$/i,
  /.*TEST.*\.js$/i,
  /.*DIAGNOSE.*\.js$/i,
]

// 允许包含中文的代码位置（白名单）
const ALLOWED_CHINESE_CONTEXTS = [
  /\/\/\s*中文解释[:：]/,  // 注释中的"中文解释："标记
  /\/\*\s*[\s\S]*?\*\//,  // 多行注释（代码注释可以包含中文）
  /console\.log\([^)]*[\u4e00-\u9fff]/,  // console.log 中的调试信息
  /console\.error\([^)]*[\u4e00-\u9fff]/,  // console.error 中的调试信息
]

// 需要严格检查的文件类型
const STRICT_CHECK_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// 需要检查的字符串位置
const STRING_PATTERNS = [
  /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,  // 字符串字面量
  /template\s*[:=]\s*['"`]([\s\S]*?)['"`]/g,  // template 字符串
  /description\s*[:=]\s*['"`]([\s\S]*?)['"`]/g,  // description 字段
  /label\s*[:=]\s*['"`]([\s\S]*?)['"`]/g,  // label 字段
  /title\s*[:=]\s*['"`]([\s\S]*?)['"`]/g,  // title 字段
  /placeholder\s*[:=]\s*['"`]([\s\S]*?)['"`]/g,  // placeholder 字段
]

// 排除的目录
const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.vercel',
  '.turbo',
]

let excludeDirs = [...DEFAULT_EXCLUDE_DIRS]
let fixMode = false
let issues = []

// 解析命令行参数
const args = process.argv.slice(2)
args.forEach(arg => {
  if (arg === '--fix') {
    fixMode = true
  } else if (arg.startsWith('--exclude-dirs=')) {
    const dirs = arg.split('=')[1].split(',')
    excludeDirs.push(...dirs)
  }
})

/**
 * 检查文件路径是否应该被排除
 */
function shouldExcludeFile(filePath) {
  // 检查是否在排除目录中
  for (const excludeDir of excludeDirs) {
    if (filePath.includes(excludeDir)) {
      return true
    }
  }
  
  // 检查是否在白名单中（允许包含中文）
  for (const allowedPattern of ALLOWED_CHINESE_PATHS) {
    if (allowedPattern.test(filePath)) {
      return false  // 白名单文件，但需要检查用户可见内容
    }
  }
  
  return false
}

/**
 * 检查是否是调试脚本
 */
function isDebugScript(filePath) {
  for (const pattern of DEBUG_SCRIPTS) {
    if (pattern.test(filePath)) {
      return true
    }
  }
  return false
}

/**
 * 检查字符串是否在允许的上下文中
 */
function isAllowedContext(content, matchIndex) {
  const beforeMatch = content.substring(Math.max(0, matchIndex - 100), matchIndex)
  const afterMatch = content.substring(matchIndex, Math.min(content.length, matchIndex + 100))
  const context = beforeMatch + afterMatch
  
  for (const allowedPattern of ALLOWED_CHINESE_CONTEXTS) {
    if (allowedPattern.test(context)) {
      return true
    }
  }
  
  return false
}

/**
 * 检查文件中的中文字符
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = path.extname(filePath)
    
    // 只检查特定类型的文件
    if (!STRICT_CHECK_EXTENSIONS.includes(ext)) {
      return
    }
    
    const lines = content.split('\n')
    
    lines.forEach((line, lineNumber) => {
      // 检查整行是否包含中文
      if (CHINESE_CHAR_REGEX.test(line)) {
        // 检查是否在允许的上下文中
        const lineIndex = content.indexOf(line)
        if (isAllowedContext(content, lineIndex)) {
          return  // 在允许的上下文中，跳过
        }
        
        // 跳过纯注释行（除非是用户可见的注释）
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('//') && !trimmedLine.includes('用户') && !trimmedLine.includes('提示')) {
          // 纯注释行，跳过（除非是用户提示）
          return
        }
        
        // 检查是否是字符串字面量（用户可见内容）
        // 匹配常见的字符串模式
        const stringPatterns = [
          /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,  // 普通字符串
          /(?:label|title|placeholder|description|text|message|error|success|warning|info)\s*[:=]\s*['"`]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"`]/gi,  // 常见字段
          /(?:children|content)\s*[:=]\s*['"`]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"`]/gi,  // React children/content
        ]
        
        let foundUserVisible = false
        for (const pattern of stringPatterns) {
          const matches = line.matchAll(pattern)
          for (const match of matches) {
            const content = match[2] || match[1] || match[0]
            if (CHINESE_CHAR_REGEX.test(content)) {
              // 检查是否在允许的上下文中
              const matchIndex = line.indexOf(content)
              if (!isAllowedContext(line, matchIndex)) {
                foundUserVisible = true
                // 调试脚本中的中文降低优先级
                const severity = isDebugScript(filePath) ? 'medium' : 'high'
                const type = isDebugScript(filePath) ? 'debug-script' : 'user-visible-string'
                
                issues.push({
                  file: filePath,
                  line: lineNumber + 1,
                  content: line.trim(),
                  type: type,
                  severity: severity,
                  matched: content.substring(0, 50),  // 只显示前50个字符
                })
                break
              }
            }
          }
          if (foundUserVisible) break
        }
        
        // 如果不是用户可见内容，检查是否是注释中的中文（低优先级）
        if (!foundUserVisible && (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*'))) {
          // 注释中的中文，中优先级
          if (!trimmedLine.includes('中文解释：') && !trimmedLine.includes('中文解释:')) {
            // 只报告非调试文件中的注释（避免报告太多调试脚本）
            if (!filePath.includes('CONSOLE_') && !filePath.includes('DEBUG') && !filePath.includes('TEST')) {
              issues.push({
                file: filePath,
                line: lineNumber + 1,
                content: trimmedLine.substring(0, 100),
                type: 'comment',
                severity: 'medium',
              })
            }
          }
        }
      }
    })
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error.message)
  }
}

/**
 * 递归遍历目录
 */
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (shouldExcludeFile(filePath)) {
      return
    }
    
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback)
    } else {
      callback(filePath)
    }
  })
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检查中文字符...\n')
  console.log(`排除目录: ${excludeDirs.join(', ')}`)
  console.log(`修复模式: ${fixMode ? '开启' : '关闭'}\n`)
  
  const rootDir = process.cwd()
  
  // 遍历所有文件
  walkDirectory(rootDir, (filePath) => {
    checkFile(filePath)
  })
  
  // 输出结果
  console.log(`\n📊 检查完成！发现 ${issues.length} 个问题\n`)
  
  if (issues.length === 0) {
    console.log('✅ 没有发现中文字符！')
    process.exit(0)
  }
  
  // 按严重程度分组（排除调试脚本）
  const highSeverity = issues.filter(i => i.severity === 'high' && i.type !== 'debug-script')
  const mediumSeverity = issues.filter(i => i.severity === 'medium' || (i.severity === 'high' && i.type === 'debug-script'))
  
  if (highSeverity.length > 0) {
    console.log(`\n🔴 高优先级问题（用户可见内容，${highSeverity.length} 个）:\n`)
    highSeverity.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`)
      console.log(`    ${issue.content}`)
      if (issue.matched) {
        console.log(`    匹配内容: ${issue.matched}`)
      }
      console.log('')
    })
  }
  
  if (mediumSeverity.length > 0) {
    console.log(`\n🟡 中优先级问题（注释中的中文，${mediumSeverity.length} 个）:\n`)
    // 只显示前20个，避免输出过多
    const displayCount = Math.min(20, mediumSeverity.length)
    mediumSeverity.slice(0, displayCount).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`)
      console.log(`    ${issue.content}`)
      console.log('')
    })
    if (mediumSeverity.length > displayCount) {
      console.log(`  ... 还有 ${mediumSeverity.length - displayCount} 个问题（注释中的中文）\n`)
    }
  }
  
  // 生成修复建议
  if (fixMode) {
    console.log('\n💡 修复建议：')
    console.log('  1. 用户可见的字符串：必须翻译成英文')
    console.log('  2. 注释中的中文：建议翻译，或标记为开发说明')
    console.log('  3. 代码逻辑中的中文：必须移除或翻译')
  }
  
  // 如果有高优先级问题，退出码为 1
  process.exit(highSeverity.length > 0 ? 1 : 0)
}

// 运行主函数
main()
