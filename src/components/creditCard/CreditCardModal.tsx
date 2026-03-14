import { useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import { formatBRL, parseBRL } from "@utils/currency";
import type {
  CreditCardPurchase,
  CreditCardAccount,
} from "@typings/creditCard";

const schema = z.object({
  date: z.string().min(1, "Informe a data"),
  platform: z.string().min(2, "Informe onde foi a compra"),
  cardId: z.string().optional(),
  installmentValue: z
    .number()
    .positive("Valor da parcela deve ser maior que zero"),
  totalInstallments: z
    .number()
    .int()
    .min(1, "Mínimo 1 parcela")
    .max(120, "Máximo 120 parcelas"),
  paidInstallments: z.number().int().min(0).max(120),
  closingDayToNextInvoice: z.boolean().default(false),
});

type FormValues = {
  date: string;
  platform: string;
  cardId?: string;
  installmentValue: number;
  totalInstallments: number;
  paidInstallments: number;
  closingDayToNextInvoice: boolean;
};

type CreditCardModalProps = {
  open: boolean;
  onClose: () => void;
  purchaseToEdit: CreditCardPurchase | null;
  accounts?: CreditCardAccount[];
};

export function CreditCardModal({
  open,
  onClose,
  purchaseToEdit,
  accounts,
}: CreditCardModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!purchaseToEdit;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      platform: "",
      cardId: "",
      installmentValue: 0,
      totalInstallments: 1,
      paidInstallments: 0,
      closingDayToNextInvoice: false,
    },
  });

  const selectedCardId = watch("cardId");
  const selectedCard = accounts?.find((c) => c._id === selectedCardId);

  useEffect(() => {
    if (open) {
      if (purchaseToEdit) {
        reset({
          date: purchaseToEdit.date.slice(0, 10),
          platform: purchaseToEdit.platform,
          cardId: purchaseToEdit.cardId,
          installmentValue: purchaseToEdit.installmentValue,
          totalInstallments: purchaseToEdit.totalInstallments,
          paidInstallments: purchaseToEdit.paidInstallments,
          closingDayToNextInvoice:
            purchaseToEdit.closingDayToNextInvoice ?? false,
        });
      } else {
        reset({
          date: new Date().toISOString().slice(0, 10),
          platform: "",
          cardId: "",
          installmentValue: 0,
          totalInstallments: 1,
          paidInstallments: 0,
          closingDayToNextInvoice: false,
        });
      }
    }
  }, [open, purchaseToEdit, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post("/credit-card", {
        ...data,
        date: new Date(data.date).toISOString(),
        cardClosingDay: data.cardId
          ? accounts?.find((c) => c._id === data.cardId)?.closingDay
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormValues }) =>
      api.put(`/credit-card/${id}`, {
        ...data,
        date: new Date(data.date).toISOString(),
        cardClosingDay: data.cardId
          ? accounts?.find((c) => c._id === data.cardId)?.closingDay
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
      onClose();
    },
  });

  const onSubmit = (values: FormValues): void => {
    if (purchaseToEdit) {
      updateMutation.mutate({ id: purchaseToEdit._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? "Editar compra" : "Nova compra no cartão"}
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
              Data
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register("date")}
            />
            {errors.date && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.date.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Onde foi a compra (plataforma)
            </label>
            <input
              type="text"
              placeholder="Ex.: Mercado Livre, Shopee"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              {...register("platform")}
            />
            {errors.platform && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.platform.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cartão
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              {...register("cardId")}
            >
              <option value="">Sem cartão específico</option>
              {accounts?.map((card) => (
                <option key={card._id} value={card._id}>
                  {card.name} (fecha dia {card.closingDay})
                </option>
              ))}
            </select>
            {selectedCard && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Fechamento: dia {selectedCard.closingDay}
              </p>
            )}
          </div>
          <div className="flex items-start gap-2">
            <input
              id="closing-next"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              {...register("closingDayToNextInvoice")}
            />
            <label
              htmlFor="closing-next"
              className="text-xs text-slate-600 dark:text-slate-300"
            >
              Considerar compras feitas exatamente no dia de fechamento{" "}
              <span className="font-semibold">na próxima fatura</span>.
              Desmarcado: compras no dia do fechamento entram na fatura atual.
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Valor da parcela (R$)
            </label>
            <Controller
              name="installmentValue"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  value={field.value === 0 ? "" : formatBRL(field.value)}
                  onChange={(e) => field.onChange(parseBRL(e.target.value))}
                />
              )}
            />
            {errors.installmentValue && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.installmentValue.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Quantidade de parcelas
            </label>
            <input
              type="number"
              min={1}
              max={120}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register("totalInstallments", { valueAsNumber: true })}
            />
            {errors.totalInstallments && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.totalInstallments.message}
              </p>
            )}
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Parcelas já pagas
              </label>
              <input
                type="number"
                min={0}
                max={120}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
                {...register("paidInstallments", { valueAsNumber: true })}
              />
              {errors.paidInstallments && (
                <p className="mt-0.5 text-xs text-rose-500">
                  {errors.paidInstallments.message}
                </p>
              )}
            </div>
          )}
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
              {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
