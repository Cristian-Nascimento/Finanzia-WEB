import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'
import {
  PeriodFilter,
  type PeriodFilterValue,
} from '@components/ui/PeriodFilter'
import { formatDateShort } from '@utils/date'
import type { GroupedViewResponse, GroupedTransaction } from '@typings/groupedView'
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PiggyBank,
} from 'lucide-react'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function GroupedViewPage() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<PeriodFilterValue>({
    showAll: false,
    month: currentMonth,
    year: currentYear,
  })

  const params = useMemo(() => {
    if (period.showAll) return {}
    const start = new Date(Date.UTC(period.year, period.month - 1, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(period.year, period.month, 0, 23, 59, 59, 999))
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }, [period])

  const { data, isLoading } = useQuery<GroupedViewResponse>({
    queryKey: ['grouped-view', params],
    queryFn: async () => {
      const res = await api.get('/dashboard/grouped-view', { params })
      return res.data
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (transactionId: string) =>
      api.patch(`/dashboard/transactions/${transactionId}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grouped-view'] })
      queryClient.invalidateQueries({ queryKey: ['credit-card'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const markUnpaidMutation = useMutation({
    mutationFn: (transactionId: string) =>
      api.patch(`/dashboard/transactions/${transactionId}/mark-unpaid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grouped-view'] })
      queryClient.invalidateQueries({ queryKey: ['credit-card'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  const togglePaid = (tx: GroupedTransaction) => {
    if (tx.paymentMethod !== 'credit' || !tx.creditCardPurchaseId) return
    if (tx.isPaid) markUnpaidMutation.mutate(tx._id)
    else markPaidMutation.mutate(tx._id)
  }

  const insights = useMemo(() => {
    if (!data?.summary) return null
    const { totalIncome, totalExpense, balance } = data.summary
    const expensePct = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0
    const biggestExpense = data.expense.categories[0]
    const creditTotal =
      data.expense.categories.reduce((acc, cat) => {
        const credit = cat.byCard?.reduce((s, c) => s + c.total, 0) ?? 0
        return acc + credit
      }, 0) ?? 0

    const messages: { type: 'success' | 'warning' | 'info'; text: string }[] = []

    if (balance > 0) {
      messages.push({
        type: 'success',
        text: `Você está economizando: R$ ${formatBRL(balance)} no período.`,
      })
    } else if (balance < 0) {
      messages.push({
        type: 'warning',
        text: `Gastos maiores que receitas em R$ ${formatBRL(-balance)}. Revise despesas.`,
      })
    }

    if (totalIncome > 0) {
      if (expensePct <= 70) {
        messages.push({
          type: 'success',
          text: `Gastos representam ${expensePct.toFixed(0)}% da receita. Você está dentro do orçamento.`,
        })
      } else if (expensePct > 90) {
        messages.push({
          type: 'warning',
          text: `Gastos em ${expensePct.toFixed(0)}% da receita. Pouco margem para economia.`,
        })
      }
    }

    if (biggestExpense && biggestExpense.total > 0) {
      messages.push({
        type: 'info',
        text: `Maior gasto: ${biggestExpense.name} — R$ ${formatBRL(biggestExpense.total)}.`,
      })
    }

    if (creditTotal > 0) {
      messages.push({
        type: 'info',
        text: `Total no cartão de crédito: R$ ${formatBRL(creditTotal)}. Acompanhe parcelas abaixo.`,
      })
    }

    return messages
  }, [data])

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Visão agrupada
        </h1>
        <div className="flex items-center justify-center py-16 text-slate-500">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Visão agrupada
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Entradas e saídas somadas por categoria. Cartão de crédito detalhado por cartão.
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Receitas
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            R$ {formatBRL(data.summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Despesas
          </p>
          <p className="mt-1 text-xl font-semibold text-rose-600 dark:text-rose-400">
            R$ {formatBRL(data.summary.totalExpense)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Saldo do período
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              data.summary.balance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            R$ {formatBRL(data.summary.balance)}
          </p>
        </div>
      </div>

      {/* Informativo */}
      {insights && insights.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Como estão seus gastos
            </h2>
          </div>
          <ul className="space-y-2">
            {insights.map((msg, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {msg.type === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {msg.type === 'warning' && (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                {msg.type === 'info' && (
                  <PiggyBank className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <span
                  className={
                    msg.type === 'success'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : msg.type === 'warning'
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-300'
                  }
                >
                  {msg.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Receitas por categoria */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Receitas por categoria
          </h2>
          <span className="ml-auto text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Total: R$ {formatBRL(data.income.total)}
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {data.income.categories.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              Nenhuma receita no período.
            </p>
          ) : (
            data.income.categories.map((cat) => (
              <div key={cat.id || cat.name} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    R$ {formatBRL(cat.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Despesas por categoria e por cartão */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex items-center gap-2">
          <ArrowDownRight className="h-5 w-5 text-rose-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Despesas por categoria
          </h2>
          <span className="ml-auto text-sm font-medium text-rose-600 dark:text-rose-400">
            Total: R$ {formatBRL(data.expense.total)}
          </span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {data.expense.categories.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              Nenhuma despesa no período.
            </p>
          ) : (
            data.expense.categories.map((cat) => (
              <div key={cat.id || cat.name} className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {cat.name}
                  </span>
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    R$ {formatBRL(cat.total)}
                  </span>
                </div>

                {cat.byCard && cat.byCard.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {cat.byCard.map((card) => (
                      <div
                        key={card.cardName}
                        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Cartão: {card.cardName}
                          </span>
                          <span className="ml-auto text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                            R$ {formatBRL(card.total)}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {card.transactions.map((tx) => (
                            <li
                              key={tx._id}
                              className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {tx.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDateShort(tx.date)}
                                  {tx.installmentCurrent != null &&
                                    tx.installmentTotal != null &&
                                    ` · Parcela ${tx.installmentCurrent}/${tx.installmentTotal}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                                  R$ {formatBRL(tx.amount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePaid(tx)}
                                  disabled={
                                    markPaidMutation.isPending ||
                                    markUnpaidMutation.isPending
                                  }
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                                    tx.isPaid
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                                  }`}
                                  title={tx.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
                                >
                                  {tx.isPaid ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Pago
                                    </>
                                  ) : (
                                    'Não pago'
                                  )}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
