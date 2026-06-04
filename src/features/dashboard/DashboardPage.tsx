import { useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronLeft, ChevronRight, CreditCard, ArrowRight } from 'lucide-react'
import { useMonth } from '../../hooks/useMonth'
import { useDashboardStore } from '../../stores/dashboardStore'
import { formatMonth, formatARS } from '../../lib/formatters'
import { BalanceCard } from '../../components/BalanceCard'
import { SummaryCardGrid } from '../../components/SummaryCardGrid'
import { SectionCard } from '../../components/SectionCard'
import { TransactionTile } from '../../components/TransactionTile'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'

export function DashboardPage() {
  const { month, prevMonth, nextMonth } = useMonth()
  const { data, loading, fetchAll } = useDashboardStore()

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
            single={data.totalByPaymentType.single ?? 0}
            installment={data.totalByPaymentType.installment ?? 0}
            fixed={data.totalByPaymentType.fixed ?? 0}
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
                      {(c.percentage * 100).toFixed(1)}%
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
                  <div key={t.id} className="animate-fade-in">
                    <TransactionTile
                      amount={-t.amount}
                      description={t.description}
                      date={t.date}
                      categoryName={t.categoryName}
                      categoryColor={t.categoryColor}
                    />
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
