import { useEffect, useState } from 'react'
import type { CreditCard, ExpenseCategory } from '../../lib/shared-types'
import { db, generateId, ensureDefaultCategories } from '../../lib/db'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { InstallAppButton } from '../../components/InstallAppButton'

export function SettingsPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [cardForm, setCardForm] = useState({ name: '', brand: '', bank: '', color: '#6366F1' })
  const [catForm, setCatForm] = useState({ name: '', icon: '', color: '#A78BFA' })
  const [showCardForm, setShowCardForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)

  async function load() {
    const [c, cats] = await Promise.all([
      db.creditCards.toArray(),
      ensureDefaultCategories().then(() => db.expenseCategories.toArray()),
    ])
    setCards(c)
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addCard(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    await db.creditCards.add({
      id: generateId(),
      ...cardForm,
      createdAt: now,
    })
    setCardForm({ name: '', brand: '', bank: '', color: '#6366F1' })
    setShowCardForm(false)
    load()
  }

  async function deleteCard(id: string) {
    if (!confirm('Eliminar tarjeta?')) return
    await db.creditCards.delete(id)
    load()
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    await db.expenseCategories.add({
      id: generateId(),
      name: catForm.name,
      icon: catForm.icon,
      color: catForm.color,
      isDefault: false,
      createdAt: now,
    })
    setCatForm({ name: '', icon: '', color: '#A78BFA' })
    setShowCatForm(false)
    load()
  }

  async function deleteCategory(id: string, isDefault: boolean) {
    if (isDefault) return alert('No se puede eliminar una categoría por defecto')
    if (!confirm('Eliminar categoría?')) return
    await db.expenseCategories.delete(id)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <InstallAppButton />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Tarjetas de crédito</h2>
          <button
            onClick={() => setShowCardForm(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Agregar
          </button>
        </div>

        {cards.length === 0 && (
          <p className="text-xs text-text-secondary">Sin tarjetas registradas</p>
        )}

        <div className="space-y-2">
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.name}</p>
                  <p className="text-xs text-text-secondary">
                    {c.brand} &middot; {c.bank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteCard(c.id)}
                className="text-xs text-expense hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {showCardForm && (
          <form onSubmit={addCard} className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <input
                value={cardForm.name}
                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                placeholder="Nombre (ej: Visa Platino)"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  value={cardForm.brand}
                  onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                  placeholder="Marca"
                  required
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  value={cardForm.bank}
                  onChange={(e) => setCardForm({ ...cardForm, bank: e.target.value })}
                  placeholder="Banco"
                  required
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <input
                type="color"
                value={cardForm.color}
                onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })}
                className="h-9 w-full rounded-xl border border-gray-200"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-text-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Categorías de gasto</h2>
          <button
            onClick={() => setShowCatForm(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Agregar
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm text-text-primary">{c.name}</span>
                {c.isDefault && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-text-secondary">
                    default
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteCategory(c.id, c.isDefault)}
                className="text-xs text-expense hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {showCatForm && (
          <form onSubmit={addCategory} className="mt-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="Nombre"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                value={catForm.icon}
                onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                placeholder="Icono (ej: shopping-cart)"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <input
                type="color"
                value={catForm.color}
                onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                className="h-9 w-full rounded-xl border border-gray-200"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatForm(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-text-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
