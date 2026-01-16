#!/usr/bin/env node

/**
 * 检查变更文件中的中文字符（用于 CI/CD 和 pre-commit）
 * 
 * 使用方法：
 * node scripts/check-chinese-content-changed.js [--base=main] [--head=HEAD]
 * 
 * 选项：
 * --base: 基础分支（默认：main）
 * --head: 当前分支/提交（默认：HEAD）
 * 
 * 只检查变更的文件，不检查整个代码库
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 中文字符正则（包括中文标点）
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/

// 需要检查的文件扩展名
const CHECK_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// 排除的目录和文件
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /\.vercel/,
  /\.turbo/,
  /CONSOLE_.*\.js$/i,
  /.*DEBUG.*\.js$/i,
  /.*TEST.*\.js$/i,
  /.*DIAGNOSTIC.*\.js$/i,
  /PASTE_TO_CONSOLE\.js$/i,
]

// 允许包含中文的文件（白名单）
const ALLOWED_PATHS = [
  /\.md$/,  // Markdown 文档
  /README\.md$/i,
  /CHANGELOG\.md$/i,
  /docs\/.*\.md$/,
  /scripts\/.*\.md$/,
]

// 需要检查的字符串位置模式
const STRING_PATTERNS = [
  /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g,  // 字符串字面量
  /(?:label|title|placeholder|description|text|message|error|success|warning|info|children|content)\s*[:=]\s*['"`]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"`]/gi,
]

let baseBranch = 'main'
let headBranch = 'HEAD'
let issues = []

// 解析命令行参数
const args = process.argv.slice(2)
args.forEach(arg => {
  if (arg.startsWith('--base=')) {
    baseBranch = arg.split('=')[1]
  } else if (arg.startsWith('--head=')) {
    headBranch = arg.split('=')[1]
  }
})

/**
 * 检查文件是否应该被排除
 */
function shouldExcludeFile(filePath) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return true
    }
  }
  return false
}

/**
 * 检查文件是否在白名单中
 */
function isAllowedFile(filePath) {
  for (const pattern of ALLOWED_PATHS) {
    if (pattern.test(filePath)) {
      return true
    }
  }
  return false
}

/**
 * 获取变更的文件列表
 */
function getChangedFiles() {
  try {
    // 获取变更的文件列表
    const command = `git diff --name-only --diff-filter=ACMR ${baseBranch}...${headBranch}`
    const output = execSync(command, { encoding: 'utf-8' })
    const files = output.split('\n').filter(f => f.trim())
    
    // 过滤出需要检查的文件
    return files.filter(file => {
      if (!file) return false
      if (shouldExcludeFile(file)) return false
      if (isAllowedFile(file)) return false
      
      const ext = path.extname(file)
      return CHECK_EXTENSIONS.includes(ext)
    })
  } catch (error) {
    console.error('Error getting changed files:', error.message)
    return []
  }
}

/**
 * 检查文件中的中文字符
 */
function checkFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, lineNumber) => {
      // 跳过纯注释行（除非是用户提示）
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('//') && !trimmedLine.includes('用户') && !trimmedLine.includes('提示')) {
        return
      }
      
      // 检查是否包含中文
      if (CHINESE_CHAR_REGEX.test(line)) {
        // 检查是否是字符串字面量（用户可见内容）
        for (const pattern of STRING_PATTERNS) {
          const matches = line.matchAll(pattern)
          for (const match of matches) {
            const content = match[2] || match[1] || match[0]
            if (CHINESE_CHAR_REGEX.test(content)) {
              issues.push({
                file: filePath,
                line: lineNumber + 1,
                content: line.trim(),
                matched: content.substring(0, 50),
                severity: 'high',
              })
              return  // 找到一个问题就返回，避免重复
            }
          }
        }
      }
    })
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 Checking for Chinese characters in changed files...\n')
  console.log(`Base branch: ${baseBranch}`)
  console.log(`Head branch: ${headBranch}\n`)
  
  const changedFiles = getChangedFiles()
  
  if (changedFiles.length === 0) {
    console.log('✅ No files to check.')
    process.exit(0)
  }
  
  console.log(`Found ${changedFiles.length} file(s) to check:\n`)
  changedFiles.forEach(file => console.log(`  - ${file}`))
  console.log('')
  
  // 检查每个文件
  changedFiles.forEach(file => {
    checkFile(file)
  })
  
  // 输出结果
  if (issues.length === 0) {
    console.log('✅ No Chinese characters found in changed files!')
    process.exit(0)
  }
  
  console.log(`\n❌ Found ${issues.length} issue(s) with Chinese characters:\n`)
  
  issues.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.content}`)
    if (issue.matched) {
      console.log(`    Matched: ${issue.matched}`)
    }
    console.log('')
  })
  
  console.log('\n💡 Please translate all user-visible Chinese text to English.')
  console.log('   For debugging scripts, Chinese is acceptable but not recommended.\n')
  
  process.exit(1)
}

// 运行主函数
main()
