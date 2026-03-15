export type Transaction = {
  _id: string
  title: string
  description?: string
  amount: number
  type: 'income' | 'expense'
  categoryId?: string
  paymentMethod?: string
  date: string
  isRecurring?: boolean
  notes?: string
  creditCardPurchaseId?: string
  /** Conta de cartão de crédito quando paymentMethod é 'credit'. */
  creditCardAccountId?: string
  installmentCurrent?: number
  installmentTotal?: number
  recurringGroupId?: string
}

