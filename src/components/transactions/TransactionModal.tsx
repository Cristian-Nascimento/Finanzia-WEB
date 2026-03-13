import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@services/api'
import { useUiStore } from '@store/uiStore'
import { formatBRL, parseBRL } from '@utils/currency'
import type { Category } from '@typings/category'

const schema = z.object({
  title: z.string().min(2, 'Informe um título'),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Informe um valor maior que zero'),
  categoryId: z.string().optional(),
  paymentMethod: z.string().optional(),
  date: z.string().min(1, 'Informe a data'),
  isRecurring: z.boolean().optional(),
  notes: z.string().optional(),
  installmentCurrent: z.number().int().min(1).max(120).optional(),
  installmentTotal: z.number().int().min(1).max(120).optional(),
})

type FormValues = z.infer<typeof schema>

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    transactionModalMode,
    transactionToEdit,
    initialTransactionType,
    closeTransactionModal,
  } = useUiStore()

  const queryClient = useQueryClient()

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      isRecurring: false,
    },
  })

  useEffect(() => {
    if (!isTransactionModalOpen) return
    if (transactionModalMode === 'edit' && transactionToEdit) {
      reset({
        title: transactionToEdit.title,
        type: transactionToEdit.type,
        amount: transactionToEdit.amount,
        categoryId: transactionToEdit.categoryId,
        paymentMethod: transactionToEdit.paymentMethod,
        date: transactionToEdit.date.slice(0, 10),
        isRecurring: transactionToEdit.isRecurring ?? false,
        notes: transactionToEdit.notes,
        installmentCurrent: transactionToEdit.installmentCurrent,
        installmentTotal: transactionToEdit.installmentTotal,
      })
    } else {
      const defaultType = initialTransactionType ?? 'expense'
      reset({
        title: '',
        type: defaultType,
        amount: 0,
        categoryId: undefined,
        paymentMethod: '',
        date: new Date().toISOString().slice(0, 10),
        isRecurring: false,
        notes: '',
        installmentCurrent: undefined,
        installmentTotal: undefined,
      })
    }
  }, [isTransactionModalOpen, transactionModalMode, transactionToEdit, initialTransactionType, reset])

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return api.post('/transactions', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      closeTransactionModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; data: FormValues }) => {
      return api.put(`/transactions/${payload.id}`, payload.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      closeTransactionModal()
    },
  })

  const onSubmit = (values: FormValues) => {
    if (transactionModalMode === 'edit' && transactionToEdit) {
      return updateMutation.mutate({
        id: transactionToEdit._id,
        data: values,
      })
    }
    return createMutation.mutate(values)
  }

  const transactionType = watch('type')
  const paymentMethod = watch('paymentMethod')
  const isExpense = transactionType === 'expense'
  const isCredit = paymentMethod === 'credit'
  const showInstallmentFields = isExpense && isCredit

  if (!isTransactionModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md min-w-[22rem] mx-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {transactionModalMode === 'create'
                ? 'Nova transação'
                : 'Editar transação'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Preencha os campos para registrar a movimentação.
            </p>
          </div>
          <button
            type="button"
            onClick={closeTransactionModal}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
              Título
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 dark:focus:bg-slate-600"
              placeholder="Ex.: Salário, Aluguel, Mercado..."
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-0.5 text-[11px] text-rose-500 dark:text-rose-400">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                Tipo
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
                {...register('type')}
              >
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                Valor (R$)
              </label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
                    placeholder="0,00"
                    value={field.value != null && field.value > 0 ? formatBRL(field.value) : ''}
                    onChange={(e) => {
                      const num = parseBRL(e.target.value)
                      field.onChange(num)
                    }}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.amount && (
                <p className="mt-0.5 text-[11px] text-rose-500 dark:text-rose-400">
                  {errors.amount.message}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                Ex.: 1.500,00 ou 99,90
              </p>
            </div>
          </div>

          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                Categoria
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
                {...register('categoryId')}
              >
                <option value="">Sem categoria</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                Forma de pagamento
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
                {...register('paymentMethod')}
              >
                <option value="">Selecione</option>
                <option value="pix">Pix</option>
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
                <option value="cash">Dinheiro</option>
                <option value="bank-transfer">Transferência</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2 grid-cols-2">
            <div>
              <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                Data
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
                {...register('date')}
              />
              {errors.date && (
                <p className="mt-0.5 text-[11px] text-rose-500 dark:text-rose-400">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-500 dark:bg-slate-700 text-indigo-600 focus:ring-indigo-400"
                {...register('isRecurring')}
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-300">
                Transação recorrente
              </span>
            </div>
          </div>

          {showInstallmentFields && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/20 p-3 space-y-2">
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Compra parcelada (opcional)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Para despesas no cartão: informe em qual parcela está (ex.: 2 de 6).
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] mb-0.5 text-slate-500 dark:text-slate-400">Parcela atual</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Ex.: 2"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100"
                    {...register('installmentCurrent', { valueAsNumber: true, setValueAs: (v) => (v === 0 || Number.isNaN(v) ? undefined : v) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] mb-0.5 text-slate-500 dark:text-slate-400">Total de parcelas</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Ex.: 6"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100"
                    {...register('installmentTotal', { valueAsNumber: true, setValueAs: (v) => (v === 0 || Number.isNaN(v) ? undefined : v) })}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] mb-1 text-slate-600 dark:text-slate-300">
              Observações
            </label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 text-[11px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-indigo-400 dark:focus:bg-slate-600"
              placeholder="Algum detalhe extra..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors min-w-[6rem]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[11px] px-4 py-1.5 hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-70 transition-colors min-w-[6rem]"
            >
              {isSubmitting
                ? 'Salvando...'
                : transactionModalMode === 'create'
                ? 'Adicionar'
                : 'Salvar edição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

