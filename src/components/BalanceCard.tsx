import { formatARS } from '../lib/formatters'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BalanceCardProps {
  balance: number
  totalIncomes: number
  totalExpenses: number
}

export function BalanceCard({ balance, totalIncomes, totalExpenses }: BalanceCardProps) {
  return (
    <div
      className="animate-scale-in rounded-2xl bg-gradient-to-br from-[#5B5FEF] to-[#A98BFF] p-6 text-white shadow-lg"
      style={{ boxShadow: '0 8px 32px rgba(91, 95, 239, 0.25)' }}
    >
      <p className="text-sm font-medium text-white/70">Balance del mes</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{formatARS(balance)}</p>

      <div className="mt-5 flex gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <TrendingUp size={16} className="text-green-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Ingresos</p>
            <p className="text-sm font-bold text-white">{formatARS(totalIncomes)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <TrendingDown size={16} className="text-orange-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60">Gastos</p>
            <p className="text-sm font-bold text-white">{formatARS(totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
