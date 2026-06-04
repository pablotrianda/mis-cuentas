import { Banknote, CreditCard, Receipt, CalendarClock } from 'lucide-react'
import { formatARS } from '../lib/formatters'

interface SummaryCardGridProps {
  single: number
  installment: number
  fixed: number
}

const cards = [
  {
    key: 'single' as const,
    label: 'Pago único',
    bg: '#E8F5EF',
    icon: Banknote,
    iconBg: '#2BB673',
  },
  {
    key: 'installment' as const,
    label: 'En cuotas',
    bg: '#FFF3E8',
    icon: CreditCard,
    iconBg: '#F58B2A',
  },
  {
    key: 'fixed' as const,
    label: 'Gastos fijos',
    bg: '#F1EEFF',
    icon: CalendarClock,
    iconBg: '#5B5FEF',
  },
]

export function SummaryCardGrid({ single, installment, fixed }: SummaryCardGridProps) {
  const values = { single, installment, fixed }

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="animate-slide-up rounded-xl p-4"
            style={{ backgroundColor: c.bg }}
          >
            <div
              className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: c.iconBg }}
            >
              <Icon size={16} />
            </div>
            <p className="text-[11px] font-medium text-text-secondary">{c.label}</p>
            <p className="mt-0.5 text-base font-bold text-text-primary">
              {formatARS(values[c.key])}
            </p>
          </div>
        )
      })}
    </div>
  )
}
