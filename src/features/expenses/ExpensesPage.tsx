import { useEffect, useState } from 'react'
import { useMonth } from '../../hooks/useMonth'
import { useCategories } from '../../hooks/useCategories'
import { useCreditCards } from '../../hooks/useCreditCards'
import { useExpenseStore } from '../../stores/expenseStore'
import { formatMonth, formatDate } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { TransactionTile } from '../../components/TransactionTile'
import { AmountInput, displayToCents } from '../../components/AmountInput'
import { DatePicker } from '../../components/DatePicker'
import type { ExpenseResponseItem } from '../../types'

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const FILTERS = [
  { key: null, label: 'Todos' },
  { key: 'single', label: 'Pago único' },
  { key: 'installment', label: 'Cuotas' },
  { key: 'fixed', label: 'Fijos' },
] as const

const BADGE_LABELS: Record<string, string> = {
  installment: 'Proyectado',
  fixed: 'Mensual',
}

export function ExpensesPage() {
  const { month, prevMonth, nextMonth } = useMonth()
  const { categories } = useCategories()
  const { cards } = useCreditCards()
  const { items, loading, error, typeFilter, setTypeFilter, fetchAll, add, remove } = useExpenseStore()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayString())
  const [categoryId, setCategoryId] = useState('')
  const [cardId, setCardId] = useState('')
  const [paymentType, setPaymentType] = useState<'single' | 'installment' | 'fixed'>('single')

  useEffect(() => {
    fetchAll()
  }, [month, typeFilter, fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount.trim() || displayToCents(amount) <= 0) return
    if (!date.trim()) return
    if (!categoryId) return
    try {
      await add({
        amount: displayToCents(amount),
        description,
        date,
        categoryId,
        cardId: cardId || null,
        paymentType,
      })
      setAmount('')
      setDescription('')
      setDate(todayString())
      setCategoryId('')
      setCardId('')
      setPaymentType('single')
      setShowForm(false)
    } catch {
      alert('Error al guardar el gasto')
    }
  }

  async function handleDelete(item: ExpenseResponseItem) {
    const label = item.type === 'installment' ? 'desactivar la compra en cuotas' : 'eliminar'
    if (!confirm(`¿${label}?`)) return
    try {
      await remove(item.id)
    } catch {
      alert('Error al eliminar el gasto')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-100"
        >
          &larr; Ant
        </button>
        <span className="text-sm font-semibold capitalize text-text-primary">
          {formatMonth(month)}
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-100"
        >
          Sig &rarr;
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">{error}</div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key ?? 'all'}
            onClick={() => setTypeFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === f.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}

      {!loading && items.length === 0 && <EmptyState message="Sin gastos este mes" />}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <TransactionTile
              amount={-item.amount}
              description={item.description}
              date={item.date}
              categoryName={item.categoryName}
              categoryColor={item.categoryColor}
              badge={BADGE_LABELS[item.type]}
            />
            <button
              onClick={() => handleDelete(item)}
              className="absolute right-2 top-2 text-xs text-expense hover:underline"
            >
              x
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Nuevo gasto</h3>
          <div className="space-y-3">
            <AmountInput value={amount} onChange={setAmount} />

            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'single' | 'installment' | 'fixed')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="single">Pago único</option>
              <option value="installment">En cuotas</option>
              <option value="fixed">Fijo mensual</option>
            </select>

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Sin tarjeta</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <DatePicker value={date} onChange={setDate} />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-text-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white shadow-lg transition-transform hover:scale-105"
      >
        +
      </button>
    </div>
  )
}
