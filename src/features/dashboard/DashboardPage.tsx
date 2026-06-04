import { useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronLeft, ChevronRight, CreditCard, ArrowRight, ChevronRight as ChevronRightIcon, Check } from 'lucide-react'
import { useMonth } from '../../hooks/useMonth'
import { useDashboardStore } from '../../stores/dashboardStore'
import { useInstallmentStore } from '../../stores/installmentStore'
import { formatMonth, formatARS } from '../../lib/formatters'
import { computeDebtFromMonth } from '../../lib/future-debt'
import { BalanceCard } from '../../components/BalanceCard'
import { SummaryCardGrid } from '../../components/SummaryCardGrid'
import { SectionCard } from '../../components/SectionCard'
import { TransactionTile } from '../../components/TransactionTile'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'

export function DashboardPage() {
  const navigate = useNavigate()
  const { month, prevMonth, nextMonth } = useMonth()
  const { data, loading, fetchAll } = useDashboardStore()
  const installmentItems = useInstallmentStore((s) => s.items)
  const fetchInstallments = useInstallmentStore((s) => s.fetchAll)

  useEffect(() => {
    fetchInstallments()
  }, [fetchInstallments])

  const debtSummary = useMemo(
    () => computeDebtFromMonth(installmentItems, month),
    [installmentItems, month],
  )

  const markInstallmentPaid = useInstallmentStore((s) => s.markAsPaid)

  const handleMarkPaid = useCallback(
    async (syntheticId: string) => {
      const rest = syntheticId.slice('proj-inst-'.length)
      const lastDash = rest.lastIndexOf('-')
      const purchaseId = rest.slice(0, lastDash)
      if (!purchaseId) return
      await markInstallmentPaid(purchaseId)
      fetchAll(month)
    },
    [markInstallmentPaid, fetchAll, month],
  )

  useEffect(() => {
    fetchAll(month)
  }, [month, fetchAll])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="animate-fade-in text-sm font-bold capitalize text-text-primary">
          {formatMonth(month)}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-gray-100"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && data && (
        <>
          <BalanceCard
            balance={data.balance}
            totalIncomes={data.totalIncomes}
            totalExpenses={data.totalExpenses}
          />

          <SummaryCardGrid
            oneTime={data.totalByPaymentType.ONE_TIME ?? 0}
            installments={data.totalByPaymentType.INSTALLMENTS ?? 0}
            recurring={data.totalByPaymentType.RECURRING ?? 0}
          />

          {data.perCardSpending.length > 0 && (
            <SectionCard
              title="Gastos por tarjeta"
              icon={<CreditCard size={16} />}
            >
              <div className="space-y-3">
                {data.perCardSpending.map((c, i) => {
                  const pct = data.totalExpenses > 0
                    ? (c.amount / data.totalExpenses) * 100
                    : 0
                  return (
                    <div
                      key={c.cardId}
                      className="animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.cardColor }}
                          />
                          <span className="text-xs font-medium text-text-primary">
                            {c.cardName}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">
                          {formatARS(c.amount)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: c.cardColor,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {debtSummary.futureDebt > 0 && (
            <button
              onClick={() => navigate('/future-debt')}
              className="flex w-full animate-fade-in items-center justify-between rounded-xl bg-[#FFF4EE] p-4 text-left shadow-sm transition-opacity hover:opacity-90"
            >
              <div>
                <p className="text-xs font-medium" style={{ color: '#F57C2D' }}>
                  Deuda futura en cuotas
                </p>
                <p className="mt-0.5 text-lg font-bold" style={{ color: '#F57C2D' }}>
                  {formatARS(debtSummary.futureDebt)}
                </p>
              </div>
              <ChevronRightIcon className="shrink-0" size={20} style={{ color: '#F57C2D' }} />
            </button>
          )}

          {data.categoryBreakdown.length > 0 && (
            <SectionCard title="Gastos por categoría">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    innerRadius={44}
                    strokeWidth={0}
                  >
                    {data.categoryBreakdown.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatARS(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {data.categoryBreakdown.map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-text-secondary">{c.categoryName}</span>
                    </div>
                    <span className="font-medium text-text-primary">
                      {c.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Últimos movimientos"
            icon={<ArrowRight size={16} />}
          >
            {data.recentTransactions.length === 0 ? (
              <EmptyState message="No hay movimientos este mes" />
            ) : (
              <div className="-mx-5 space-y-1">
                {data.recentTransactions.map((t) => (
                  <div key={t.id} className="group relative animate-fade-in">
                    <TransactionTile
                      amount={-t.amount}
                      description={t.description}
                      date={t.date}
                      categoryName={t.categoryName}
                      categoryColor={t.categoryColor}
                    />
                    {t.type === 'installment' && (
                      <button
                        onClick={() => handleMarkPaid(t.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-green-200 bg-white text-green-600 opacity-0 transition-opacity hover:bg-green-50 group-hover:opacity-100"
                        title="Marcar como pagada"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
