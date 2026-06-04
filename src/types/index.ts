export interface ExpenseResponseItem {
  id: string
  amount: number
  description: string
  date: string
  categoryId: string
  categoryName: string
  categoryColor: string
  cardId: string | null
  cardName: string | null
  cardColor: string | null
  paymentType: 'single' | 'installment' | 'fixed'
  type: 'real' | 'installment' | 'fixed'
  installmentPurchaseId: string | null
  installmentNumber: number | null
  totalInstallments: number | null
  fixedExpenseId: string | null
  createdAt: string | null
}
