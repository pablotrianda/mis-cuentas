import { useEffect, useState } from 'react'
import { useInstallmentStore } from '../../stores/installmentStore'
import { formatARS, formatDate } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { CategoryChip } from '../../components/CategoryChip'

export function FutureDebtPage() {
  const { items, loading, fetchAll } = useInstallmentStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const activeDebts = items.filter((d) => d.isActive)
  const totalRemaining = activeDebts.reduce((s, d) => s + d.totalAmount, 0)

  const perCard = activeDebts.reduce(
    (map, d) => {
      const key = d.cardId
      if (!map.has(key)) {
        map.set(key, {
          cardId: d.cardId,
          cardName: (d as any).card?.name ?? 'Desconocida',
          cardColor: (d as any).card?.color ?? '#6B7280',
          total: 0,
          count: 0,
        })
      }
      const entry = map.get(key)!
      entry.total += d.totalAmount
      entry.count += 1
      return map
    },
    new Map<string, { cardId: string; cardName: string; cardColor: string; total: number; count: number }>(),
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs text-text-secondary">Deuda total restante</p>
        <p className="text-2xl font-bold text-expense">{formatARS(totalRemaining)}</p>
      </div>

      {perCard.size > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Por tarjeta</h3>
          {Array.from(perCard.values()).map((c) => (
            <div
              key={c.cardId}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.cardColor }} />
                <span className="text-sm font-medium text-text-primary">{c.cardName}</span>
                <span className="text-xs text-text-secondary">({c.count} compras)</span>
              </div>
              <span className="text-sm font-bold text-expense">{formatARS(c.total)}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <LoadingSpinner />}

      {!loading && activeDebts.length === 0 && (
        <EmptyState message="No hay deudas activas" />
      )}

      <div className="space-y-2">
        {activeDebts.map((d) => (
          <div
            key={d.id}
            className="rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{d.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  <CategoryChip
                    name={(d as any).category?.name ?? ''}
                    color={(d as any).category?.color ?? '#6B7280'}
                  />
                  <span className="text-xs text-text-secondary">
                    {d.totalInstallments} cuotas
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-expense">{formatARS(d.totalAmount)}</p>
                <p className="text-xs text-text-secondary">{formatDate(d.purchaseDate)}</p>
              </div>
            </div>
            {expandedId === d.id && (
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-text-secondary">
                <p>
                  {d.totalInstallments} cuotas de{' '}
                  {formatARS(Math.floor(d.totalAmount / d.totalInstallments))}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
