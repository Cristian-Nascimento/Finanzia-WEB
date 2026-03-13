import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'
import { formatBRL, parseBRL } from '@utils/currency'
import { Controller } from 'react-hook-form'
import type { Investment } from '@typings/investment'
import { INVESTMENT_TYPES } from '@typings/investment'

const schema = z.object({
  name: z.string().min(2, 'Nome com pelo menos 2 caracteres'),
  type: z.string().min(1, 'Selecione o tipo'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  date: z.string().min(1, 'Informe a data'),
  institution: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type InvestmentModalProps = {
  open: boolean
  onClose: () => void
  investmentToEdit: Investment | null
}

export function InvestmentModal({ open, onClose, investmentToEdit }: InvestmentModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!investmentToEdit

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'selic',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      institution: '',
      dueDate: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset(
        investmentToEdit
          ? {
              name: investmentToEdit.name,
              type: investmentToEdit.type,
              amount: investmentToEdit.amount,
              date: investmentToEdit.date.slice(0, 10),
              institution: investmentToEdit.institution ?? '',
              dueDate: investmentToEdit.dueDate?.slice(0, 10) ?? '',
              notes: investmentToEdit.notes ?? '',
            }
          : {
              name: '',
              type: 'selic',
              amount: 0,
              date: new Date().toISOString().slice(0, 10),
              institution: '',
              dueDate: '',
              notes: '',
            },
      )
    }
  }, [open, investmentToEdit, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post('/investments', {
        ...data,
        institution: data.institution || undefined,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      api.put(`/investments/${id}`, {
        ...data,
        institution: data.institution || undefined,
        dueDate: data.dueDate || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      onClose()
    },
  })

  const onSubmit = (values: FormValues) => {
    if (investmentToEdit) {
      updateMutation.mutate({ id: investmentToEdit._id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Editar investimento' : 'Novo investimento'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              placeholder="Ex.: CDB Banco X"
              {...register('name')}
            />
            {errors.name && <p className="mt-0.5 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register('type')}
            >
              {INVESTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="0,00"
                  value={field.value > 0 ? formatBRL(field.value) : ''}
                  onChange={(e) => field.onChange(parseBRL(e.target.value))}
                />
              )}
            />
            {errors.amount && <p className="mt-0.5 text-xs text-rose-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register('date')}
            />
            {errors.date && <p className="mt-0.5 text-xs text-rose-500">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instituição (opcional)</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              placeholder="Ex.: Nubank, XP"
              {...register('institution')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento (opcional)</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register('dueDate')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações (opcional)</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register('notes')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[6rem]">
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
