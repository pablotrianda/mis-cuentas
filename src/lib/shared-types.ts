export type PaymentType = 'ONE_TIME' | 'INSTALLMENTS' | 'RECURRING'
export type ExpenseType = 'real' | 'installment' | 'recurring'
export type InstallmentStatus = 'ACTIVE' | 'FINISHED'

export interface CreateIncome {
  amount: number
  description: string
  date: string
}

export interface CreateOneTimeExpense {
  amount: number
  description: string
  date: string
  categoryId: string
  cardId?: string | null
}

export interface UpdateOneTimeExpense {
  amount?: number
  description?: string
  date?: string
  categoryId?: string
  cardId?: string | null
}

export interface UpdateInstallmentPurchase {
  description?: string
  totalAmount?: number
  installmentAmount?: number
  currentInstallment?: number
  totalInstallments?: number
  purchaseDate?: string
  categoryId?: string
  cardId?: string | null
  status?: InstallmentStatus
}

export interface CreateInstallmentPurchase {
  description: string
  totalAmount: number
  installmentAmount: number
  currentInstallment: number
  totalInstallments: number
  purchaseDate: string
  categoryId: string
  cardId?: string | null
}

export interface CreateRecurringExpense {
  amount: number
  description: string
  categoryId: string
  startDate: string
  endDate?: string
  cardId?: string | null
}

export interface UpdateRecurringExpense {
  active?: boolean
  amount?: number
  description?: string
  categoryId?: string
  endDate?: string
  cardId?: string | null
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
}

export interface RecurringOccurrenceWithDescription extends RecurringExpenseOccurrence {
  description: string
}

export interface MonthlyRecurringSummary {
  pending: number
  paid: number
  total: number
  items: RecurringOccurrenceWithDescription[]
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

export interface DashboardData {
  totalIncomes: number
  totalExpenses: number
  balance: number
  totalByPaymentType: {
    ONE_TIME: number
    INSTALLMENTS: number
    RECURRING: number
  }
  perCardSpending: Array<{
    cardId: string
    cardName: string
    cardColor: string
    amount: number
  }>
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    color: string
    amount: number
    percentage: number
  }>
  recentTransactions: Array<{
    id: string
    amount: number
    description: string
    date: string
    type: ExpenseType
    categoryName: string
    categoryColor: string
  }>
  recurringSummary: MonthlyRecurringSummary
}
