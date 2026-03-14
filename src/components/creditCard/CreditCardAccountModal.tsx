import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type { CreditCardAccount } from "@typings/creditCard";

const schema = z.object({
  name: z.string().min(2, "Informe o nome do cartão"),
  closingDay: z
    .number({ message: "Informe um número entre 1 e 31" })
    .int("Dia deve ser inteiro")
    .min(1, "Mínimo dia 1")
    .max(31, "Máximo dia 31"),
});

type FormValues = z.infer<typeof schema>;

type CreditCardAccountModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreditCardAccountModal({
  open,
  onClose,
}: CreditCardAccountModalProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CreditCardAccount | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      closingDay: 15,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        closingDay: 15,
      });
      setEditing(null);
    }
  }, [open, reset]);

  const { data: accounts = [], isLoading } = useQuery<CreditCardAccount[]>({
    queryKey: ["credit-card-accounts"],
    queryFn: async () => {
      const res = await api.get("/credit-card-accounts");
      return res.data;
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (editing) {
        return api.put(`/credit-card-accounts/${editing._id}`, data);
      }
      return api.post("/credit-card-accounts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-accounts"] });
      setEditing(null);
      reset({
        name: "",
        closingDay: 15,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/credit-card-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-accounts"] });
      if (editing && editing._id === idBeingDeleted.current) {
        setEditing(null);
        reset({
          name: "",
          closingDay: 15,
        });
      }
    },
  });

  const idBeingDeleted = { current: "" as string };

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Cartões de crédito
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome do cartão
            </label>
            <input
              type="text"
              placeholder="Ex.: Cartão Nubank, Cartão Visa"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dia de fechamento
            </label>
            <input
              type="number"
              min={1}
              max={31}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100"
              {...register("closingDay", { valueAsNumber: true })}
            />
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Use o dia de fechamento da fatura do cartão.
            </p>
            {errors.closingDay && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.closingDay.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-70 min-w-[6rem]"
            >
              {isSubmitting
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Criar cartão"}
            </button>
          </div>
          </form>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cartões cadastrados
            </p>
            {isLoading ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Carregando cartões...
              </p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nenhum cartão cadastrado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
                {accounts.map((card) => (
                  <li
                    key={card._id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {card.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Fechamento: dia {card.closingDay}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(card);
                          reset({
                            name: card.name,
                            closingDay: card.closingDay,
                          });
                        }}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          idBeingDeleted.current = card._id;
                          deleteMutation.mutate(card._id);
                        }}
                        className="px-2 py-1 text-xs rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
