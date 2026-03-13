export type DashboardSummary = {
  balance: number
  incomeTotal: number
  expenseTotal: number
  balancePrevious?: number
  incomePrevious?: number
  expensePrevious?: number
  recurringIncomeCount?: number
  variableIncomeCount?: number
}

export type DashboardCharts = {
  monthly: {
    _id: { month: number; type: 'income' | 'expense' }
    total: number
  }[]
  byCategory: {
    _id: string | null
    total: number
  }[]
  incomeByCategory: {
    _id: string | null
    total: number
  }[]
}

