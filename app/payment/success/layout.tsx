// 标记此路由为动态路由，跳过预渲染
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}







