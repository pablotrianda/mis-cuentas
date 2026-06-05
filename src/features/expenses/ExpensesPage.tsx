import { useEffect, useState, useMemo, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import { useMonth, getCurrentMonth } from '../../hooks/useMonth'
import { useCategories } from '../../hooks/useCategories'
import { useCreditCards } from '../../hooks/useCreditCards'
import { useExpenseStore } from '../../stores/expenseStore'
import { formatMonth, formatARS } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { TransactionTile } from '../../components/TransactionTile'
import { AmountInput, displayToCents, centsToDisplay } from '../../components/AmountInput'
import { Stepper } from '../../components/Stepper'
import type { ExpenseResponseItem } from '../../types'
import type { PaymentType } from '../../lib/shared-types'
import { db } from '../../lib/db'

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function currentMonthString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const FILTERS = [
  { key: null, label: 'Todos' },
  { key: 'ONE_TIME', label: 'Una vez' },
  { key: 'INSTALLMENTS', label: 'Cuotas' },
  { key: 'RECURRING', label: 'Recurrentes' },
] as const

const BADGE_LABELS: Record<string, string> = {
  installment: 'Proyectado',
  recurring: 'Mensual',
}

export function ExpensesPage() {
  const { month, prevMonth, nextMonth, setMonth } = useMonth()
  const { categories } = useCategories()
  const { cards } = useCreditCards()
  const { items, loading, error, typeFilter, setTypeFilter, fetchAll, addOneTime, updateOneTime, remove } =
    useExpenseStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [paymentType, setPaymentType] = useState<PaymentType>('ONE_TIME')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [cardId, setCardId] = useState('')
  const [date, setDate] = useState(todayString())

  const [totalAmount, setTotalAmount] = useState('')
  const [totalInstallments, setTotalInstallments] = useState(3)
  const [currentInstallment, setCurrentInstallment] = useState(1)
  const [purchaseDate, setPurchaseDate] = useState(todayString())

  const [recurringAmount, setRecurringAmount] = useState('')
  const [startDate, setStartDate] = useState(currentMonthString())

  useEffect(() => {
    fetchAll()
  }, [month, typeFilter, fetchAll])

  const installmentAmount = useMemo(() => {
    const total = displayToCents(totalAmount)
    return total > 0 ? Math.floor(total / totalInstallments) : 0
  }, [totalAmount, totalInstallments])

  const summaryCards = useMemo(() => {
    const oneTime = items
      .filter((i) => i.paymentType === 'ONE_TIME')
      .reduce((s, i) => s + i.amount, 0)
    const installments = items
      .filter((i) => i.paymentType === 'INSTALLMENTS')
      .reduce((s, i) => s + i.amount, 0)
    const recurring = items
      .filter((i) => i.paymentType === 'RECURRING')
      .reduce((s, i) => s + i.amount, 0)
    return [
      {
        label: 'Pago único',
        amount: oneTime,
        bg: 'bg-[#E8F5EF]',
        icon: '+',
        filter: 'ONE_TIME',
      },
      {
        label: 'Cuotas',
        amount: installments,
        bg: 'bg-[#FFF3E8]',
        icon: '#',
        filter: 'INSTALLMENTS',
      },
      {
        label: 'Recurrentes',
        amount: recurring,
        bg: 'bg-[#F1EEFF]',
        icon: '~',
        filter: 'RECURRING',
      },
    ]
  }, [items])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setPaymentType('ONE_TIME')
    setAmount('')
    setDescription('')
    setDate(todayString())
    setCategoryId('')
    setCardId('')
    setTotalAmount('')
    setTotalInstallments(3)
    setCurrentInstallment(1)
    setPurchaseDate(todayString())
    setRecurringAmount('')
    setStartDate(currentMonthString())
  }, [])

  async function handleEdit(item: ExpenseResponseItem) {
    resetForm()
    setShowForm(true)

    if (item.type === 'real') {
      setPaymentType('ONE_TIME')
      setEditingId(item.id)
      setAmount(centsToDisplay(item.amount))
      setDescription(item.description)
      setDate(item.date)
      setCategoryId(item.categoryId)
      setCardId(item.cardId ?? '')
    } else if (item.type === 'installment' && item.purchaseId) {
      setPaymentType('INSTALLMENTS')
      setEditingId(item.purchaseId)
      const purchase = await db.installmentPurchases.get(item.purchaseId)
      if (purchase) {
        setDescription(purchase.description)
        setTotalAmount(centsToDisplay(purchase.totalAmount))
        setTotalInstallments(purchase.totalInstallments)
        setCurrentInstallment(purchase.currentInstallment)
        setPurchaseDate(purchase.purchaseDate)
        setCategoryId(purchase.categoryId)
        setCardId(purchase.cardId ?? '')
      }
    } else if (item.type === 'recurring' && item.recurringId) {
      setPaymentType('RECURRING')
      setEditingId(item.recurringId)
      const rec = await db.recurringExpenses.get(item.recurringId)
      if (rec) {
        setRecurringAmount(centsToDisplay(rec.amount))
        setDescription(rec.description)
        setCategoryId(rec.categoryId)
        setStartDate(rec.startDate.slice(0, 7))
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const isEditing = editingId !== null

    try {
      if (paymentType === 'ONE_TIME') {
        if (!amount.trim() || displayToCents(amount) <= 0) return
        if (!categoryId) return
        const payload = {
          amount: displayToCents(amount),
          description,
          date,
          categoryId,
          cardId: cardId || null,
        }
        if (isEditing) {
          await updateOneTime(editingId, payload)
        } else {
          await addOneTime(payload)
        }
      } else if (paymentType === 'INSTALLMENTS') {
        if (!totalAmount.trim() || displayToCents(totalAmount) <= 0) return
        if (!description.trim()) return
        if (!categoryId) return
        const { useInstallmentStore } = await import('../../stores/installmentStore')
        const payload = {
          description,
          totalAmount: displayToCents(totalAmount),
          installmentAmount,
          currentInstallment,
          totalInstallments,
          purchaseDate,
          categoryId,
          cardId: cardId || null,
        }
        if (isEditing) {
          await useInstallmentStore.getState().update(editingId, payload)
        } else {
          await useInstallmentStore.getState().add(payload)
        }
      } else {
        if (!recurringAmount.trim() || displayToCents(recurringAmount) <= 0) return
        if (!description.trim()) return
        if (!categoryId) return
        const { useRecurringExpenseStore } = await import('../../stores/recurringExpenseStore')
        const payload = {
          amount: displayToCents(recurringAmount),
          description,
          categoryId,
          startDate: `${startDate}-01`,
        }
        if (isEditing) {
          await useRecurringExpenseStore.getState().update(editingId, payload)
        } else {
          await useRecurringExpenseStore.getState().add(payload)
        }
      }
      resetForm()
      setShowForm(false)
      await fetchAll()
    } catch {
      alert('Error al guardar')
    }
  }

  async function handleDelete(item: ExpenseResponseItem) {
    const label =
      item.type === 'installment'
        ? 'finalizar la compra en cuotas'
        : item.type === 'recurring'
          ? 'desactivar el gasto recurrente'
          : 'eliminar'
    if (!confirm(`¿${label}?`)) return
    try {
      await remove(item.id)
    } catch {
      alert('Error al eliminar')
    }
  }

  function openNewForm() {
    resetForm()
    setShowForm(true)
  }

  const currentTabLabel = FILTERS.find((f) => f.key === typeFilter)?.label ?? 'Todos'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-gray-100"
        >
          &larr; Ant
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold capitalize text-text-primary">
            {formatMonth(month)}
          </span>
          {month !== getCurrentMonth() && (
            <button
              onClick={() => setMonth(getCurrentMonth())}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              Hoy
            </button>
          )}
        </div>
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

      <div className="grid grid-cols-3 gap-2">
        {summaryCards.map((card) => (
          <button
            key={card.filter}
            onClick={() => setTypeFilter(typeFilter === card.filter ? null : card.filter)}
            className={`rounded-xl p-3 text-left transition-all active:scale-[0.97] ${
              card.bg
            } ${
              typeFilter === card.filter ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="mb-1 flex items-center gap-1">
              <span className="text-xs font-bold text-text-secondary">{card.icon}</span>
              <span className="text-[10px] font-medium text-text-secondary">{card.label}</span>
            </div>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {formatARS(card.amount)}
            </p>
          </button>
        ))}
      </div>

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

      {!loading && items.length === 0 && (
        <EmptyState message={`Sin gastos este mes — ${currentTabLabel.toLowerCase()}`} />
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            <button onClick={() => handleEdit(item)} className="w-full text-left">
              <TransactionTile
                amount={-item.amount}
                description={item.description}
                date={item.date}
                categoryName={item.categoryName}
                categoryColor={item.categoryColor}
                badge={BADGE_LABELS[item.type]}
              />
            </button>
            <div className="absolute right-2 top-2 flex gap-0.5">
              <button
                onClick={() => handleEdit(item)}
                className="flex h-6 w-6 items-center justify-center rounded text-text-secondary opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100"
                aria-label="Editar"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="flex h-6 w-6 items-center justify-center rounded text-expense opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                aria-label="Eliminar"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">
            {editingId ? 'Editar gasto' : 'Nuevo gasto'}
          </h3>

          {!editingId && (
            <div className="mb-4 flex gap-2">
              {(['ONE_TIME', 'INSTALLMENTS', 'RECURRING'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                    paymentType === t
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {t === 'ONE_TIME'
                    ? 'Una vez'
                    : t === 'INSTALLMENTS'
                      ? 'Cuotas'
                      : 'Recurrente'}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {paymentType === 'ONE_TIME' && (
              <>
                <AmountInput value={amount} onChange={setAmount} />
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
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </>
            )}

            {paymentType === 'INSTALLMENTS' && (
              <>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <AmountInput value={totalAmount} onChange={setTotalAmount} />

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Cuotas totales
                  </label>
                  <Stepper
                    value={totalInstallments}
                    min={2}
                    max={60}
                    onChange={setTotalInstallments}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Cuota n&deg;
                  </label>
                  <Stepper
                    value={currentInstallment}
                    min={1}
                    max={totalInstallments}
                    onChange={setCurrentInstallment}
                  />
                </div>

                {displayToCents(totalAmount) > 0 && (
                  <p className="text-xs text-text-secondary">
                    Cuota de <span className="font-semibold">{formatARS(installmentAmount)}</span>
                    {displayToCents(totalAmount) % totalInstallments !== 0 && (
                      <span className="text-[10px] opacity-60">
                        {' '}
                        (&uacute;ltima cuota {formatARS(installmentAmount + (displayToCents(totalAmount) % totalInstallments))})
                      </span>
                    )}
                  </p>
                )}

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

                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                />
              </>
            )}

            {paymentType === 'RECURRING' && (
              <>
                <AmountInput value={recurringAmount} onChange={setRecurringAmount} />
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    Desde (mes)
                  </label>
                  <input
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-text-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <button
        onClick={openNewForm}
        className="fixed bottom-20 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white shadow-lg transition-transform hover:scale-105"
      >
        +
      </button>
    </div>
  )
}
