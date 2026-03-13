import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'
import type { Category } from '@typings/category'

const schema = z.object({
  name: z.string().min(2, 'Nome com pelo menos 2 caracteres'),
  type: z.enum(['income', 'expense']),
  color: z.string().optional(),
})

type FormValues = { name: string; type: 'income' | 'expense'; color?: string }

type CategoryModalProps = {
  open: boolean
  onClose: () => void
  categoryToEdit: Category | null
}

export function CategoryModal({ open, onClose, categoryToEdit }: CategoryModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!categoryToEdit

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'expense', color: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        categoryToEdit
          ? { name: categoryToEdit.name, type: categoryToEdit.type, color: categoryToEdit.color ?? '' }
          : { name: '', type: 'expense', color: '' },
      )
    }
  }, [open, categoryToEdit, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
  })

  const onSubmit = (values: FormValues) => {
    if (categoryToEdit) {
      updateMutation.mutate({ id: categoryToEdit._id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Editar categoria' : 'Nova categoria'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              placeholder="Ex.: Alimentação"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-rose-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register('type')}
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cor (opcional)
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="#4f46e5"
              {...register('color')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 min-w-[6rem]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-70 min-w-[6rem]"
            >
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
