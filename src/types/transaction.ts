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
  installmentCurrent?: number
  installmentTotal?: number
  recurringGroupId?: string
}

