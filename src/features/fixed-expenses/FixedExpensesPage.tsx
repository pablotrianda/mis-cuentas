import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Clock } from 'lucide-react'
import { useMonth, getCurrentMonth } from '../../hooks/useMonth'
import { useRecurringExpenseStore } from '../../stores/recurringExpenseStore'
import { useCategories } from '../../hooks/useCategories'
import { useCreditCards } from '../../hooks/useCreditCards'
import { formatMonth, formatARS } from '../../lib/formatters'
import { AmountInput, displayToCents } from '../../components/AmountInput'

export function FixedExpensesPage() {
  const navigate = useNavigate()
  const { month, prevMonth, nextMonth, setMonth } = useMonth()
  const { items, loading, fetchAll } = useRecurringExpenseStore()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Gastos fijos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      {showForm && <FixedExpenseForm onClose={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
          <div className="mb-3 text-4xl opacity-30">--</div>
          <p className="text-sm">No hay gastos fijos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((rec) => {
            let badge: { label: string; color: string }
            if (!rec.active) {
              badge = { label: 'Finalizado', color: 'bg-gray-100 text-gray-500' }
            } else if (rec.endDate && new Date(rec.endDate) < new Date()) {
              badge = { label: 'Vencido', color: 'bg-red-50 text-red-600' }
            } else {
              badge = { label: 'Activo', color: 'bg-green-50 text-green-700' }
            }
            return (
              <button
                key={rec.id}
                onClick={() => navigate(`/fixed-expenses/${rec.id}`)}
                className="w-full animate-fade-in rounded-xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-text-primary">{rec.description}</h3>
                    <p className="mt-1 text-lg font-bold text-text-primary">{formatARS(rec.amount)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {rec.cardId && <Clock size={12} className="text-text-secondary" />}
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/fixed-expenses/${rec.id}`)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-gray-100"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FixedExpenseForm({ onClose }: { onClose: () => void }) {
  const { categories } = useCategories()
  const { cards } = useCreditCards()
  const add = useRecurringExpenseStore((s) => s.add)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [cardId, setCardId] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount.trim() || !description.trim() || !categoryId || !startDate) return
    setSaving(true)
    try {
      await add({
        amount: displayToCents(amount),
        description,
        categoryId,
        startDate,
        endDate: endDate || undefined,
        cardId: cardId || null,
      })
      onClose()
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up rounded-xl bg-white p-4 shadow-sm">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
      />
      <AmountInput value={amount} onChange={setAmount} />
      <div className="mt-3">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">Seleccionar categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs text-text-secondary">Fecha inicio</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs text-text-secondary">Fecha fin (opcional)</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="mt-3">
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">Sin tarjeta</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}