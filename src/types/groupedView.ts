export interface GroupedTransaction {
  _id: string
  title: string
  amount: number
  date: string
  paymentMethod?: string
  creditCardPurchaseId?: string
  installmentCurrent?: number
  installmentTotal?: number
  cardName?: string
  isPaid?: boolean
  categoryId?: string
}

export interface CategoryGroup {
  id: string
  name: string
  total: number
  transactions: GroupedTransaction[]
  byCard?: { cardName: string; total: number; transactions: GroupedTransaction[] }[]
}

export interface GroupedViewResponse {
  period: { startDate?: string; endDate?: string }
  income: { total: number; categories: CategoryGroup[] }
  expense: { total: number; categories: CategoryGroup[] }
  summary: { totalIncome: number; totalExpense: number; balance: number }
}
