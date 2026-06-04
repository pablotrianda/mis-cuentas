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
  paymentType: 'single' | 'installment' | 'fixed'
  installmentPurchaseId: string | null
  createdAt: string
}

export interface InstallmentPurchase {
  id: string
  totalAmount: number
  totalInstallments: number
  purchaseDate: string
  description: string
  categoryId: string
  cardId: string
  isActive: boolean
  createdAt: string
}

export interface FixedExpense {
  id: string
  amount: number
  description: string
  categoryId: string
  cardId: string | null
  startDate: string
  isActive: boolean
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
  { id: 'cat-alquiler', name: 'Alquiler', icon: 'home', color: '#5B5FEF', isDefault: true },
  { id: 'cat-servicios', name: 'Servicios', icon: 'zap', color: '#F58B2A', isDefault: true },
  { id: 'cat-supermercado', name: 'Supermercado', icon: 'shopping-cart', color: '#2BB673', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte', icon: 'car', color: '#E05A5A', isDefault: true },
  { id: 'cat-salud', name: 'Salud', icon: 'heart', color: '#E05A5A', isDefault: true },
  { id: 'cat-entretenimiento', name: 'Entretenimiento', icon: 'music', color: '#A98BFF', isDefault: true },
  { id: 'cat-educacion', name: 'Educación', icon: 'book', color: '#6366F1', isDefault: true },
  { id: 'cat-ropa', name: 'Ropa', icon: 'shirt', color: '#F1A8D0', isDefault: true },
  { id: 'cat-otros', name: 'Otros', icon: 'more-horizontal', color: '#7B8190', isDefault: true },
]

const db = new Dexie('misCuentas') as Dexie & {
  incomes: EntityTable<Income, 'id'>
  expenses: EntityTable<Expense, 'id'>
  installmentPurchases: EntityTable<InstallmentPurchase, 'id'>
  fixedExpenses: EntityTable<FixedExpense, 'id'>
  creditCards: EntityTable<CreditCard, 'id'>
  expenseCategories: EntityTable<ExpenseCategory, 'id'>
}

db.version(1).stores({
  incomes: 'id, date, createdAt',
  expenses: 'id, date, categoryId, cardId, paymentType, createdAt',
  installmentPurchases: 'id, isActive, createdAt',
  fixedExpenses: 'id, startDate, isActive, createdAt',
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
