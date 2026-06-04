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
  paymentType: 'ONE_TIME' | 'INSTALLMENTS' | 'RECURRING'
  type: 'real' | 'installment' | 'recurring'
  purchaseId: string | null
  installmentNumber: number | null
  totalInstallments: number | null
  recurringId: string | null
  createdAt: string | null
}
