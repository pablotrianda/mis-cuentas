import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Undo2, Pencil, Trash2, Ban } from 'lucide-react'
import { useRecurringExpenseStore } from '../../stores/recurringExpenseStore'
import { useRecurringExpenseOccurrenceStore } from '../../stores/recurringExpenseOccurrenceStore'
import { useCategories } from '../../hooks/useCategories'
import { useCreditCards } from '../../hooks/useCreditCards'
import { formatARS, formatDate, formatMonth } from '../../lib/formatters'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function FixedExpenseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items: recs, fetchAll } = useRecurringExpenseStore()
  const { summary, fetchMonth, markPaid, unmarkPaid } = useRecurringExpenseOccurrenceStore()
  const { categories } = useCategories()
  const { cards } = useCreditCards()
  const [loading, setLoading] = useState(true)

  const rec = recs.find((r) => r.id === id)
  const category = rec ? categories.find((c) => c.id === rec.categoryId) : null
  const card = rec?.cardId ? cards.find((c) => c.id === rec.cardId) : null

  useEffect(() => {
    async function load() {
      await fetchAll()
      if (id) {
        const now = new Date()
        await fetchMonth(now.getFullYear(), now.getMonth() + 1)
      }
      setLoading(false)
    }
    load()
  }, [id, fetchAll, fetchMonth])

  if (loading) return <LoadingSpinner />

  if (!rec) {
    return (
      <div className="py-16 text-center text-sm text-text-secondary">
        Gastos fijo no encontrado
      </div>
    )
  }

  const occurrences = summary?.items.filter((o) => o.recurringExpenseId === id) ?? []

  function getMonthLabel(occurrence: { year: number; month: number }) {
    const d = new Date(occurrence.year, occurrence.month - 1, 1)
    const formatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
    return formatter.format(d)
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary">{rec.description}</h2>
        <p className="mt-1 text-2xl font-bold text-text-primary">{formatARS(rec.amount)}</p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary">
          {category && (
            <span
              className="inline-block rounded-full px-2.5 py-0.5 font-medium"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.name}
            </span>
          )}
          {card && <span>Tarjeta: {card.name}</span>}
          <span>Inicio: {formatDate(rec.startDate)}</span>
          {rec.endDate && <span>Fin: {formatDate(rec.endDate)}</span>}
          <span className={rec.active ? 'text-green-600' : 'text-gray-400'}>
            {rec.active ? 'Activo' : 'Finalizado'}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-text-primary">Historial mensual</h3>

        {occurrences.length === 0 ? (
          <p className="text-xs text-text-secondary">No hay ocurrencias generadas aún</p>
        ) : (
          <div className="space-y-2">
            {occurrences.map((occ) => {
              const isOverdue = !occ.paid && new Date(occ.dueDate) < new Date()
              return (
                <div
                  key={occ.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-text-primary">
                      {getMonthLabel(occ)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">
                        {formatARS(occ.amount)}
                      </span>
                      {occ.amount !== rec.amount && (
                        <span className="text-[10px] text-expense">(Editado)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {occ.paid ? (
                      <>
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Pagado {occ.paidAt ? formatDate(occ.paidAt) : ''}
                        </span>
                        <button
                          onClick={() => unmarkPaid(occ.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-text-secondary transition-colors hover:bg-gray-50"
                          title="Desmarcar pago"
                        >
                          <Undo2 size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isOverdue
                              ? 'bg-red-50 text-red-600'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {isOverdue ? 'Vencido' : 'Pendiente'}
                        </span>
                        <button
                          onClick={() => markPaid(occ.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-green-200 text-green-600 transition-colors hover:bg-green-50"
                          title="Marcar pagado"
                        >
                          <Check size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            if (confirm('Finalizar este gasto fijo? No se generarán nuevas ocurrencias.')) {
              useRecurringExpenseStore.getState().update(rec.id, { active: false })
            }
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-50"
        >
          <Ban size={14} />
          Finalizar
        </button>
        <button
          onClick={() => {
            if (confirm('Eliminar este gasto fijo? Esta acción no se puede deshacer.')) {
              useRecurringExpenseStore.getState().remove(rec.id)
              navigate('/fixed-expenses')
            }
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
        >
          <Trash2 size={14} />
          Eliminar
        </button>
      </div>
    </div>
  )
}