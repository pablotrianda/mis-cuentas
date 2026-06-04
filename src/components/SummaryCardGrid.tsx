import { Banknote, CreditCard, Receipt, CalendarClock } from 'lucide-react'
import { formatARS } from '../lib/formatters'

interface SummaryCardGridProps {
  oneTime: number
  installments: number
  recurring: number
}

const cards = [
  {
    key: 'oneTime' as const,
    label: 'Pago único',
    bg: '#E8F5EF',
    icon: Banknote,
    iconBg: '#2BB673',
  },
  {
    key: 'installments' as const,
    label: 'En cuotas',
    bg: '#FFF3E8',
    icon: CreditCard,
    iconBg: '#F58B2A',
  },
  {
    key: 'recurring' as const,
    label: 'Recurrentes',
    bg: '#F1EEFF',
    icon: CalendarClock,
    iconBg: '#5B5FEF',
  },
]

export function SummaryCardGrid({ oneTime, installments, recurring }: SummaryCardGridProps) {
  const values = { oneTime, installments, recurring }

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
