import type { Metadata } from 'next'
import ChatClient from './ChatClient'

export const metadata: Metadata = {
  title: 'AI Chat - 文案助手 | Sora Alternative',
  description: '使用 AI 助手为你的场景应用、对比词等生成专业文案',
}

export default function ChatPage() {
  return <ChatClient />
}

