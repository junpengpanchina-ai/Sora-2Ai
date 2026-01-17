/**
 * Admin 组件统一导出
 * 
 * 目的：避免导入路径散落，统一管理组件导入路径
 * 使用方式：import { AdminUseCasesManager } from '@/app/admin/_components'
 * 
 * 好处：以后挪文件，只改 index.ts 一处
 */

// Content 相关组件
export { default as AdminUseCasesManager } from '../content/use-cases/AdminUseCasesManager'
export { default as AdminKeywordsManager } from '../content/keywords/AdminKeywordsManager'
export { default as AdminComparePagesManager } from '../content/compare/AdminComparePagesManager'
export { default as AdminBlogManager } from '../content/blog/AdminBlogManager'
export { default as AdminBatchesPage } from '../content/batches/AdminBatchesPage'

// Billing 相关组件
export { default as AdminBillingPage } from '../billing/AdminBillingPage'

// Prompts 相关组件
export { default as AdminPromptsManager } from '../AdminPromptsManager'

// Landing 相关组件
export { default as AdminHomepageManager } from '../AdminHomepageManager'

// Tools 相关组件（研发工具，隐藏）
// 注意：这些组件在 app/admin/ 根目录，不在 tools/_legacy
export { default as AdminChatDebug } from '../AdminChatDebug'
export { default as AdminChatManager } from '../AdminChatManager'
export { default as AdminSEOChatManager } from '../AdminSEOChatManager'
export { default as AdminGeoManager } from '../AdminGeoManager'
export { default as AdminSceneModelConfig } from '../AdminSceneModelConfig'
export { default as AdminIndustryModelConfig } from '../AdminIndustryModelConfig'

// Batch Generators
export { default as AdminBatchContentGenerator } from '../AdminBatchContentGenerator'
export { default as UseCaseBatchGenerator } from '../UseCaseBatchGenerator'
export { default as IndustrySceneBatchGenerator } from '../IndustrySceneBatchGenerator'
