import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@store/authStore'
import { ThemeToggle } from '@components/ui/ThemeToggle'

export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => !!s.user)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8 relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center"
      >
        <div className="hidden md:flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/50 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Controle financeiro em tempo real
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Seu painel financeiro
            <span className="block text-indigo-600 dark:text-indigo-400 mt-2">
              premium, minimalista e inteligente.
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-md">
            Centralize receitas, despesas e categorias em um único dashboard, com gráficos elegantes, filtros por período e uma experiência visual digna de um SaaS moderno.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm px-4 py-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Saldo consolidado</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">R$ 18.420,90</p>
              <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                +18% vs mês anterior
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-900/30 px-4 py-3">
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Despesas no mês</p>
              <p className="mt-1 text-lg font-semibold text-indigo-900 dark:text-indigo-200">R$ 6.210,30</p>
              <p className="mt-1 text-[11px] text-indigo-600 dark:text-indigo-400">
                Controle detalhado por categoria
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none px-6 py-7 md:px-8 md:py-9">
          <Outlet />
        </div>
      </motion.div>
    </div>
  )
}

