export type PaymentType = 'single' | 'installment' | 'fixed'
export type ExpenseType = 'real' | 'installment' | 'fixed'

export interface CreateIncome {
  amount: number
  description: string
  date: string
}

export interface CreateExpense {
  amount: number
  description: string
  date: string
  categoryId: string
  cardId: string | null | undefined
  paymentType: PaymentType
}

export interface CreateInstallmentPurchase {
  totalAmount: number
  totalInstallments: number
  purchaseDate: string
  description: string
  categoryId: string
  cardId: string
}

export interface CreateFixedExpense {
  amount: number
  description: string
  categoryId: string
  cardId?: string | null
  startDate: string
}

export interface UpdateFixedExpense {
  isActive?: boolean
  amount?: number
  description?: string
  categoryId?: string
  cardId?: string | null
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
    single: number
    installment: number
    fixed: number
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
}
