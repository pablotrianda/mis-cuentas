import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useInstallmentStore } from '../../stores/installmentStore'
import { useCategories } from '../../hooks/useCategories'
import { useCreditCards } from '../../hooks/useCreditCards'
import { formatARS, formatShortMonth } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { ProgressBar } from '../../components/ProgressBar'
import { CategoryChip } from '../../components/CategoryChip'
import {
  computeDebtSummary,
  computeCardGroups,
  computeRemainingDebt,
  computeRemainingInstallments,
  computeProgress,
  computeEndDate,
  computeIsFinished,
} from '../../lib/future-debt'
import type { InstallmentPurchase } from '../../lib/db'

type FilterKey = 'all' | 'ACTIVE' | 'FINISHED' | string

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'ACTIVE', label: 'Activas' },
  { key: 'FINISHED', label: 'Finalizadas' },
]

const CARD_ICONS: Record<string, string> = {
  Visa: '💳',
  Mastercard: '💳',
  'American Express': '💳',
}

function getCardIcon(brand: string): string {
  return CARD_ICONS[brand] ?? '💳'
}

export function FutureDebtPage() {
  const navigate = useNavigate()
  const { items, loading, fetchAll } = useInstallmentStore()
  const { categories } = useCategories()
  const { cards } = useCreditCards()
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const cardMap = useMemo(
    () => new Map(cards.map((c) => [c.id, { name: c.name, color: c.color, brand: c.brand }])),
    [cards],
  )

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'ACTIVE' || filter === 'FINISHED') {
      return items.filter((i) => i.status === filter)
    }
    return items.filter((i) => {
      if (!i.cardId) return false
      const card = cardMap.get(i.cardId)
      return card?.brand === filter
    })
  }, [items, filter, cardMap])

  const summary = useMemo(() => computeDebtSummary(items), [items])
  const cardGroups = useMemo(() => computeCardGroups(items, cardMap), [items, cardMap])

  const brandFilters = useMemo(() => {
    const brands = new Set<string>()
    for (const c of cards) {
      if (c.brand) brands.add(c.brand)
    }
    return [...brands]
  }, [cards])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-text-primary">Deuda futura</h1>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-gray-100">
          <Filter size={18} />
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && (
        <>
          <div
            className="animate-scale-in rounded-2xl bg-gradient-to-br from-[#F58B2A] to-[#FFA94D] p-6 text-white shadow-lg"
            style={{ boxShadow: '0 8px 32px rgba(245, 139, 42, 0.25)' }}
          >
            <p className="text-sm font-medium text-white/70">Deuda futura total</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatARS(summary.futureDebt)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                {summary.pendingInstallments} cuota{summary.pendingInstallments !== 1 ? 's' : ''} pendiente{summary.pendingInstallments !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary">Pr&oacute;ximo mes</p>
                <p className="mt-0.5 text-xl font-bold text-expense">
                  {formatARS(summary.nextMonthAmount)}
                  <span className="ml-1 text-sm font-medium text-text-secondary">en cuotas</span>
                </p>
              </div>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-medium text-expense">
                pr&oacute;ximas
              </span>
            </div>
          </div>

          {cardGroups.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Por tarjeta</h3>
              <div className="space-y-2">
                {cardGroups.map((g) => (
                  <div
                    key={g.cardId ?? '__none'}
                    className="rounded-xl bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: g.cardColor }}
                        />
                        <span className="text-sm font-medium text-text-primary">{g.cardName}</span>
                      </div>
                      <span className="text-xs text-text-secondary">{g.purchaseCount} compra{g.purchaseCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between text-xs">
                      <span className="text-text-secondary">
                        {formatARS(g.monthlyAmount)} / mes
                      </span>
                      <span className="text-text-secondary">
                        Restante:{' '}
                        <span className="font-semibold text-expense">{formatARS(g.remainingDebt)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            {brandFilters.map((brand) => (
              <button
                key={brand}
                onClick={() => setFilter(filter === brand ? 'all' : brand)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === brand
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {getCardIcon(brand)} {brand}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-text-primary">
            {filteredItems.length} compra{filteredItems.length !== 1 ? 's' : ''} financiada{filteredItems.length !== 1 ? 's' : ''}
          </h3>

          {filteredItems.length === 0 ? (
            <EmptyState message="No hay compras financiadas" />
          ) : (
            <div className="space-y-3">
              {filteredItems.map((p) => {
                const finished = computeIsFinished(p)
                const remaining = computeRemainingInstallments(p)
                const remainingDebt = computeRemainingDebt(p)
                const progress = computeProgress(p)
                const endDate = computeEndDate(p)
                const cat = catMap.get(p.categoryId)
                const card = p.cardId ? cardMap.get(p.cardId) : undefined

                return (
                  <div
                    key={p.id}
                    className={`animate-fade-in rounded-xl bg-white p-4 shadow-sm ${
                      finished ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm">
                          {getCardIcon(card?.brand ?? '')}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{p.description}</p>
                          <p className="text-xs text-text-secondary">
                            {card?.name ?? 'Sin tarjeta'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-text-primary">
                          {formatARS(p.installmentAmount)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          Cuota {p.currentInstallment} de {p.totalInstallments}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <ProgressBar value={p.currentInstallment} max={p.totalInstallments} />
                    </div>

                    {finished && (
                      <div className="mt-2">
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700">
                          Finalizada
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <p className="text-text-secondary">
                          Restan {remaining} cuota{remaining !== 1 ? 's' : ''}
                        </p>
                        {cat && <CategoryChip name={cat.name} color={cat.color} />}
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="font-semibold text-expense">
                          {finished ? '$ 0' : formatARS(remainingDebt)}
                        </p>
                        <p className="text-text-secondary">
                          Fin: {formatShortMonth(endDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
