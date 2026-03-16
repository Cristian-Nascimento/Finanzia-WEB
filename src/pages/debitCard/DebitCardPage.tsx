import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type { Transaction } from "@typings/transaction";
import { useCategories } from "@hooks/useCategories";
import { useUiStore } from "@store/uiStore";
import { Pencil, Trash2, Plus, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmModal } from "@components/ui/ConfirmModal";
import {
  PeriodFilter,
  type PeriodFilterValue,
} from "@components/ui/PeriodFilter";
import { formatDateShort } from "@utils/date";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

type DebitSort =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc"
  | "title-asc"
  | "title-desc";

export function DebitCardPage() {
  const queryClient = useQueryClient();
  const openTransactionModal = useUiStore((s) => s.openTransactionModal);

  const [period, setPeriod] = useState<PeriodFilterValue>({
    showAll: false,
    month: currentMonth,
    year: currentYear,
  });
  const [sort, setSort] = useState<DebitSort>("date-desc");
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = { paymentMethod: "debit" };
    if (!period.showAll) {
      const start = new Date(
        Date.UTC(period.year, period.month - 1, 1, 0, 0, 0, 0),
      );
      const end = new Date(
        Date.UTC(period.year, period.month, 0, 23, 59, 59, 999),
      );
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    }
    return params;
  }, [period]);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", "debit", queryParams],
    queryFn: async () => {
      const res = await api.get("/transactions", { params: queryParams });
      return res.data;
    },
  });

  const { data: categories = [] } = useCategories();

  const getCategoryName = (categoryId?: string) =>
    categories.find((c) => c._id === categoryId)?.name ?? "Sem categoria";

  const sortedTransactions = useMemo(() => {
    const base = [...transactions];
    base.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      switch (sort) {
        case "date-asc":
          return dateA - dateB;
        case "date-desc":
          return dateB - dateA;
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        case "title-asc":
          return (a.title ?? "").localeCompare(b.title ?? "", "pt-BR");
        case "title-desc":
          return (b.title ?? "").localeCompare(a.title ?? "", "pt-BR");
        default:
          return 0;
      }
    });
    return base;
  }, [transactions, sort]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
      queryClient.invalidateQueries({ queryKey: ["grouped-view"] });
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      setDeleteConfirm(null);
    },
  });

  const totalAmount = useMemo(
    () => sortedTransactions.reduce((s, t) => s + t.amount, 0),
    [sortedTransactions],
  );

  return (
    <div className="space-y-10 pb-4">
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm._id)}
        title="Excluir compra"
        message={
          deleteConfirm
            ? `Excluir "${deleteConfirm.title}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Cartão de débito
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Compras e gastos pagos no débito. Sem parcelas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            className="w-full sm:w-auto"
          />
          <button
            type="button"
            onClick={() =>
              openTransactionModal("create", null, "expense", "debit")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm min-w-[11rem] transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nova compra
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as DebitSort)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antiga)</option>
              <option value="amount-desc">Valor (maior)</option>
              <option value="amount-asc">Valor (menor)</option>
              <option value="title-asc">Título (A–Z)</option>
              <option value="title-desc">Título (Z–A)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          Carregando...
        </div>
      ) : transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 sm:p-14 text-center shadow-sm"
        >
          <Wallet className="mx-auto h-14 w-14 text-slate-300 dark:text-slate-500" />
          <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-slate-100">
            Nenhuma compra no débito
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Clique em &quot;Nova compra&quot; para registrar um gasto pago com
            cartão de débito.
          </p>
          <button
            type="button"
            onClick={() =>
              openTransactionModal("create", null, "expense", "debit")
            }
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 min-w-[11rem] transition-colors"
          >
            Nova compra
          </button>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-600 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Compras no débito
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Total no período: R${" "}
              {totalAmount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/40">
                  <th className="text-left py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Data
                  </th>
                  <th className="text-left py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Onde / Descrição
                  </th>
                  <th className="text-right py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Valor
                  </th>
                  <th className="text-left py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                    Categoria
                  </th>
                  <th className="w-24 py-4 px-3" aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-slate-100 dark:border-slate-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      {formatDateShort(t.date)}
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                      {t.title}
                    </td>
                    <td className="py-4 px-5 text-right font-medium text-rose-600 dark:text-rose-400">
                      R${" "}
                      {t.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      {getCategoryName(t.categoryId)}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            openTransactionModal("edit", t)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(t)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-600 transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
