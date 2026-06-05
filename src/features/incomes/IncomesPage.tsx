import { useEffect, useState } from 'react'
import { useMonth, getCurrentMonth } from '../../hooks/useMonth'
import { useIncomeStore } from '../../stores/incomeStore'
import { formatMonth, formatARS, formatDate } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { EmptyState } from '../../components/EmptyState'
import { AmountInput, displayToCents } from '../../components/AmountInput'
import { DatePicker } from '../../components/DatePicker'

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function IncomesPage() {
  const { month, prevMonth, nextMonth, setMonth } = useMonth()
  const { items, loading, error, fetchAll, add, remove } = useIncomeStore()
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayString())

  useEffect(() => {
    fetchAll(month)
  }, [month, fetchAll])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount.trim() || displayToCents(amount) <= 0) return
    if (!date.trim()) return
    try {
      await add({ amount: displayToCents(amount), description, date })
      setAmount('')
      setDescription('')
      setDate(todayString())
      setShowForm(false)
    } catch {
      alert('Error al guardar el ingreso')
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Eliminar este ingreso?')) {
      try {
        await remove(id)
      } catch {
        alert('Error al eliminar el ingreso')
      }
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

      {loading && <LoadingSpinner />}

      {!loading && items.length === 0 && <EmptyState message="Sin ingresos este mes" />}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{item.description}</p>
              <span className="text-xs text-text-secondary">{formatDate(item.date)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-success">{formatARS(item.amount)}</span>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-expense hover:underline"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-semibold">Nuevo ingreso</h3>
          <div className="space-y-3">
            <AmountInput value={amount} onChange={setAmount} />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción"
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
            />
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
