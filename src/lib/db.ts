import Dexie, { type EntityTable } from 'dexie'

export interface Income {
  id: string
  amount: number
  description: string
  date: string
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  date: string
  categoryId: string
  cardId: string | null
  paymentType: 'ONE_TIME'
  createdAt: string
}

export interface InstallmentPurchase {
  id: string
  description: string
  totalAmount: number
  installmentAmount: number
  currentInstallment: number
  totalInstallments: number
  purchaseDate: string
  cardId: string | null
  categoryId: string
  status: 'ACTIVE' | 'FINISHED'
  createdAt: string
}

export interface RecurringExpense {
  id: string
  description: string
  amount: number
  categoryId: string
  startDate: string
  endDate?: string
  cardId?: string | null
  active: boolean
  createdAt: string
}

export interface RecurringExpenseOccurrence {
  id: string
  recurringExpenseId: string
  year: number
  month: number
  amount: number
  dueDate: string
  paid: boolean
  paidAt?: string
  notes?: string
  createdAt: string
}

export interface CreditCard {
  id: string
  name: string
  brand: string
  bank: string
  color: string
  createdAt: string
}

export interface ExpenseCategory {
  id: string
  name: string
  icon: string
  color: string
  isDefault: boolean
  createdAt: string
}

const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'createdAt'>[] = [
  { id: 'cat-comida', name: 'Comida', icon: 'shopping-cart', color: '#2BB673', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte', icon: 'car', color: '#F58B2A', isDefault: true },
  { id: 'cat-servicios', name: 'Servicios', icon: 'zap', color: '#E05A5A', isDefault: true },
  { id: 'cat-salud', name: 'Salud', icon: 'heart', color: '#E05A5A', isDefault: true },
  { id: 'cat-compras', name: 'Compras', icon: 'shopping-bag', color: '#A98BFF', isDefault: true },
  { id: 'cat-educacion', name: 'Educación', icon: 'book', color: '#6366F1', isDefault: true },
  { id: 'cat-entretenimiento', name: 'Entretenimiento', icon: 'music', color: '#F1A8D0', isDefault: true },
  { id: 'cat-suscripciones', name: 'Suscripciones', icon: 'credit-card', color: '#5B5FEF', isDefault: true },
  { id: 'cat-otros', name: 'Otros', icon: 'more-horizontal', color: '#7B8190', isDefault: true },
]

const db = new Dexie('misCuentas') as Dexie & {
  incomes: EntityTable<Income, 'id'>
  expenses: EntityTable<Expense, 'id'>
  installmentPurchases: EntityTable<InstallmentPurchase, 'id'>
  recurringExpenses: EntityTable<RecurringExpense, 'id'>
  recurringExpenseOccurrences: EntityTable<RecurringExpenseOccurrence, 'id'>
  creditCards: EntityTable<CreditCard, 'id'>
  expenseCategories: EntityTable<ExpenseCategory, 'id'>
}

db.version(3).stores({
  incomes: 'id, date, createdAt',
  expenses: 'id, date, categoryId, cardId, createdAt',
  installmentPurchases: 'id, status, categoryId, cardId, createdAt',
  recurringExpenses: 'id, active, createdAt',
  recurringExpenseOccurrences: 'id, recurringExpenseId, [year+month], paid, createdAt',
  creditCards: 'id',
  expenseCategories: 'id, isDefault',
})

db.on('populate', async () => {
  const now = new Date().toISOString()
  await db.expenseCategories.bulkAdd(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })),
  )
})

export async function ensureDefaultCategories() {
  const count = await db.expenseCategories.count()
  if (count === 0) {
    const now = new Date().toISOString()
    await db.expenseCategories.bulkAdd(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })),
    )
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export { db }
