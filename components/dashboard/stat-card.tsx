import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: number
  icon: string
  href: string
}

export default function StatCard({ title, value, icon, href }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <span className="text-2xl">{icon}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{value}</div>
          <p className="text-xs text-muted-foreground mt-1">Total records</p>
        </CardContent>
      </Card>
    </Link>
  )
}
