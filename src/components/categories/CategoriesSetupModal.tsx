import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@services/api'
import { categoriesQueryKey } from '@hooks/useCategories'

const DEFAULT_CATEGORIES: { name: string; type: 'income' | 'expense' }[] = [
  { name: 'Lazer', type: 'expense' },
  { name: 'Alimentação', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Internet', type: 'expense' },
  { name: 'Água', type: 'expense' },
  { name: 'Energia', type: 'expense' },
  { name: 'Saúde', type: 'expense' },
  { name: 'Educação', type: 'expense' },
  { name: 'Compras', type: 'expense' },
  { name: 'Assinatura', type: 'expense' },
  { name: 'Outros (despesa)', type: 'expense' },
  { name: 'Salário', type: 'income' },
  { name: 'Renda extra', type: 'income' },
  { name: 'Freelas', type: 'income' },
  { name: 'Comissão', type: 'income' },
  { name: 'Investimento', type: 'income' },
  { name: 'Presente', type: 'income' },
  { name: 'Reembolso', type: 'income' },
  { name: 'Outros (receita)', type: 'income' },
]

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CategoriesSetupModal({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Set<number>>(() => new Set(DEFAULT_CATEGORIES.map((_, i) => i)))

  const selectedList = useMemo(
    () => DEFAULT_CATEGORIES.filter((_, i) => selected.has(i)),
    [selected],
  )

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectAll = (type: 'income' | 'expense') => {
    const indices = DEFAULT_CATEGORIES.map((c, i) => (c.type === type ? i : -1)).filter((i) => i >= 0)
    setSelected((prev) => {
      const next = new Set(prev)
      indices.forEach((i) => next.add(i))
      return next
    })
  }

  const createMutation = useMutation({
    mutationFn: (categories: { name: string; type: string }[]) =>
      api.post('/categories/bulk', { categories }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      queryClient.invalidateQueries({ queryKey: ['grouped-view'] })
      onSuccess?.()
      onClose()
    },
  })

  const handleCreate = () => {
    if (selectedList.length === 0) return
    createMutation.mutate(selectedList)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/50 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl flex flex-col"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-600 shrink-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Criar categorias iniciais
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Você ainda não tem categorias. Selecione as que deseja criar para organizar receitas e despesas.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Despesas</span>
                <button
                  type="button"
                  onClick={() => selectAll('expense')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Selecionar todas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map(
                  (c, idx) =>
                    c.type === 'expense' && (
                      <label
                        key={`${idx}-${c.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggle(idx)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-800 dark:text-slate-200">{c.name}</span>
                      </label>
                    ),
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Receitas</span>
                <button
                  type="button"
                  onClick={() => selectAll('income')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Selecionar todas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map(
                  (c, idx) =>
                    c.type === 'income' && (
                      <label
                        key={`${idx}-${c.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggle(idx)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-800 dark:text-slate-200">{c.name}</span>
                      </label>
                    ),
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedList.length} categoria(s) selecionada(s)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                Pular
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={selectedList.length === 0 || createMutation.isPending}
                className="rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar categorias'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
