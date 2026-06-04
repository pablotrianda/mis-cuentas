import { formatARS, formatDate } from '../lib/formatters'
import { CategoryChip } from './CategoryChip'

interface TransactionTileProps {
  amount: number
  description: string
  date: string
  categoryName: string
  categoryColor: string
  badge?: string
}

export function TransactionTile({
  amount,
  description,
  date,
  categoryName,
  categoryColor,
  badge,
}: TransactionTileProps) {
  const isExpense = amount < 0
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text-primary">{description}</p>
          {badge && (
            <span className="shrink-0 rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-medium text-secondary">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <CategoryChip name={categoryName} color={categoryColor} />
          <span className="text-xs text-text-secondary">{formatDate(date)}</span>
        </div>
      </div>
      <p
        className={`ml-3 shrink-0 text-sm font-bold ${
          isExpense ? 'text-expense' : 'text-success'
        }`}
      >
        {isExpense ? '-' : '+'}{formatARS(Math.abs(amount))}
      </p>
    </div>
  )
}
