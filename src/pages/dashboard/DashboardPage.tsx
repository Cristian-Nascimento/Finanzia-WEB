import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Wallet, LineChart } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import { useUiStore } from '@store/uiStore'
import type { DashboardSummary, DashboardCharts } from '@typings/dashboard'
import type { Transaction } from '@typings/transaction'
import type { Category } from '@typings/category'
import { formatDateShort } from '@utils/date'

/** 14 cores distintas para categorias de despesas (gráfico e legenda). */
const COLORS = [
  '#4f46e5', '#06b6d4', '#22c55e', '#e11d48', '#f97316',
  '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#6366f1', '#84cc16', '#ef4444', '#a855f7',
]

/** 8 cores para categorias de receitas. */
const COLORS_RECEITAS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#4ade80', '#86efac', '#bbf7d0',
]

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

export function DashboardPage() {
  const navigate = useNavigate()
  const openTransactionModal = useUiStore((s) => s.openTransactionModal)
  const [showAll, setShowAll] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear

  const { data: summary, isLoading: loadingSummary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', showAll, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary', {
        params: showAll ? { all: 'true' } : { month: selectedMonth, year: selectedYear },
      })
      return response.data
    },
  })

  const { data: charts } = useQuery<DashboardCharts>({
    queryKey: ['dashboard-charts', selectedYear, selectedMonth],
    queryFn: async () => {
      const response = await api.get('/dashboard/charts', {
        params: { year: selectedYear, month: selectedMonth },
      })
      return response.data
    },
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data
    },
  })

  const monthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999))
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'recent', showAll, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get('/transactions', {
        params: showAll
          ? {}
          : {
              startDate: monthStart.toISOString(),
              endDate: monthEnd.toISOString(),
            },
      })
      return response.data
    },
  })

  const monthlyTrend = useMemo(() => {
    if (!charts?.monthly) return []
    const base = MONTH_LABELS.map((label, idx) => ({
      month: label,
      income: 0,
      expense: 0,
      index: idx + 1,
    }))

    charts.monthly.forEach((entry) => {
      const monthIndex = entry._id.month
      const row = base[monthIndex - 1]
      if (!row) return
      if (entry._id.type === 'income') row.income = entry.total
      if (entry._id.type === 'expense') row.expense = entry.total
    })

    return base
  }, [charts])

  const expensesByCategory = useMemo(() => {
    if (!charts?.byCategory) return []
    return charts.byCategory
      .filter((entry) => entry._id)
      .map((entry) => {
        const category = categories?.find((c) => c._id === entry._id)
        return {
          id: entry._id!,
          name: category?.name || 'Outros',
          value: entry.total,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [charts, categories])

  const incomesByCategory = useMemo(() => {
    if (!charts?.incomeByCategory) return []
    return charts.incomeByCategory
      .filter((entry) => entry._id)
      .map((entry) => {
        const category = categories?.find((c) => c._id === entry._id)
        return {
          id: entry._id!,
          name: category?.name || 'Outros',
          value: entry.total,
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [charts, categories])

  const recentTransactions = useMemo(() => {
    if (!transactions) return []
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    return sorted.slice(0, 4)
  }, [transactions])

  const biggestExpenseCategory =
    expensesByCategory.length > 0
      ? expensesByCategory.reduce((prev, curr) =>
          curr.value > prev.value ? curr : prev,
        ).name
      : '---'

  const balancePrevious = summary?.balancePrevious ?? 0
  const percentVsPrevious =
    balancePrevious !== 0 && summary != null
      ? (((summary.balance - balancePrevious) / Math.abs(balancePrevious)) * 100).toFixed(1)
      : null
  const recurringCount = summary?.recurringIncomeCount ?? 0
  const variableCount = summary?.variableIncomeCount ?? 0
  const incomeSourcesText =
    recurringCount > 0 || variableCount > 0
      ? `${recurringCount} fonte(s) recorrente(s) e ${variableCount} variável(eis)`
      : 'Nenhuma receita no período'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Visão geral financeira
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acompanhe saldo, fluxo de caixa e categorias em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors min-w-[4.5rem] ${
              showAll
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Todos
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(Number(e.target.value)); setShowAll(false) }}
            disabled={showAll}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            {MONTH_LABELS.map((label, idx) => (
              <option key={label} value={idx + 1}>{label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setShowAll(false) }}
            disabled={showAll}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setShowAll(false)
              setSelectedMonth(currentMonth)
              setSelectedYear(currentYear)
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors min-w-[7rem] ${
              !showAll && isCurrentMonth
                ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                : 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
            }`}
          >
            Mês atual
          </button>
        </div>
      </div>
      {showAll && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Exibindo totais de todos os períodos. Selecione mês/ano para filtrar.
        </p>
      )}

      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <motion.div
          className="metric-card p-4 md:p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
                Saldo atual
              </p>
              <p className="mt-2 text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {loadingSummary || summary == null
                  ? '...'
                  : `R$ ${(summary?.balance ?? 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`}
              </p>
              <div className="mt-2 metric-pill bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />
                <span>
                  {percentVsPrevious != null
                    ? `${Number(percentVsPrevious) >= 0 ? '+' : ''}${percentVsPrevious}% vs mês anterior`
                    : '— vs mês anterior'}
                </span>
              </div>
            </div>
            <div className="h-9 w-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="metric-card p-4 md:p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.12em]">
                Receitas no mês
              </p>
              <p className="mt-2 text-xl md:text-2xl font-semibold text-emerald-600">
                {loadingSummary || summary == null
                  ? '...'
                  : `R$ ${(summary?.incomeTotal ?? 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {incomeSourcesText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openTransactionModal('create', null, 'income')}
              className="shrink-0 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/30 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              Adicionar entrada
            </button>
          </div>
        </motion.div>

        <motion.div
          className="metric-card p-4 md:p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.12em]">
                Despesas no mês
              </p>
              <p className="mt-2 text-xl md:text-2xl font-semibold text-rose-600">
                {loadingSummary || summary == null
                  ? '...'
                  : `R$ ${(summary?.expenseTotal ?? 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Maior gasto em{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {biggestExpenseCategory}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => openTransactionModal('create', null, 'expense')}
              className="shrink-0 rounded-lg border border-rose-200 dark:border-rose-700 bg-rose-50/80 dark:bg-rose-900/30 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
            >
              Adicionar saída
            </button>
          </div>
        </motion.div>

        <motion.div
          className="metric-card p-4 md:p-5 bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-500 text-indigo-50"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-indigo-100/80">
                Economia do mês
              </p>
              <p className="mt-2 text-xl md:text-2xl font-semibold">
                {loadingSummary || !summary
                  ? '...'
                  : `R$ ${(
                      (summary?.incomeTotal ?? 0) - (summary?.expenseTotal ?? 0)
                    ).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}`}
              </p>
              <p className="mt-1 text-[11px] text-indigo-100/80">
                Economia estimada considerando mês atual
              </p>
            </div>
            <div className="h-9 w-9 rounded-2xl bg-indigo-950/30 flex items-center justify-center">
              <LineChart className="h-4 w-4" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráficos principais */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fluxo mensal</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Evolução de receitas e despesas nos últimos 6 meses
              </p>
            </div>
          </div>
          <div className="h-52 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="90%" stopColor="#22c55e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="90%" stopColor="#ef4444" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-600" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  width={52}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k` : `R$ ${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow:
                      '0 18px 45px rgba(15,23,42,0.08), 0 0 0 1px rgba(148,163,184,0.15)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke="#22c55e"
                  strokeWidth={2.2}
                  fill="url(#income)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Despesas"
                  stroke="#ef4444"
                  strokeWidth={2.2}
                  fill="url(#expense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Despesas por categoria */}
          <div className="glass-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Despesas por categoria
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Distribuição percentual das saídas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--color-border, #e2e8f0)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '8px 12px',
                      }}
                      formatter={(value) => [
                        `R$ ${Number(value ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        'Valor',
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <Pie
                      data={expensesByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {expensesByCategory.map((cat, idx) => (
                  <div
                    key={cat.id ?? cat.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 min-w-[10px] shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 shrink-0">
                      R$ {cat.value.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Receitas por categoria */}
          <div className="glass-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Receitas por categoria
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Distribuição percentual das entradas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid var(--color-border, #e2e8f0)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '8px 12px',
                      }}
                      formatter={(value) => [
                        `R$ ${Number(value ?? 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        'Valor',
                      ]}
                      labelFormatter={(label) => label}
                    />
                    <Pie
                      data={incomesByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {incomesByCategory.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS_RECEITAS[index % COLORS_RECEITAS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {incomesByCategory.map((cat, idx) => (
                  <div
                    key={cat.id ?? cat.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 min-w-[10px] shrink-0 rounded-full"
                        style={{
                          backgroundColor: COLORS_RECEITAS[idx % COLORS_RECEITAS.length],
                        }}
                      />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 shrink-0">
                      R$ {cat.value.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de movimentações recentes */}
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Movimentações recentes
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Últimas receitas e despesas cadastradas
            </p>
          </div>
          <button
            className="hidden rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 sm:inline-flex"
            onClick={() => navigate('/transactions')}
          >
            Ver todas
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {recentTransactions.map((tx) => {
            const category = categories?.find((c) => c._id === tx.categoryId)
            return (
              <div
                key={tx._id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 px-3 py-2.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {tx.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tx.installmentCurrent != null && tx.installmentTotal != null && (
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Parcela {tx.installmentCurrent}/{tx.installmentTotal}
                        </span>
                      )}
                      {tx.installmentCurrent != null && tx.installmentTotal != null && ' · '}
                      {category?.name ?? 'Sem categoria'} ·{' '}
                      {formatDateShort(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-semibold ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{' '}
                    {tx.amount.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

