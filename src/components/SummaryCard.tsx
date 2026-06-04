import type { ReactNode } from 'react'
import { formatARS } from '../lib/formatters'

interface SummaryCardProps {
  title: string
  amount: number
  color: string
  icon?: ReactNode
}

export function SummaryCard({ title, amount, color, icon }: SummaryCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
        {icon}
      </div>
      <p className="mt-1 text-xl font-bold" style={{ color }}>
        {formatARS(amount)}
      </p>
    </div>
  )
}
