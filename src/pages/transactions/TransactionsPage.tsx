import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type { Transaction } from "@typings/transaction";
import type { Category } from "@typings/category";
import { useUiStore } from "@store/uiStore";
import { Pencil, Trash2, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { ConfirmModal } from "@components/ui/ConfirmModal";
import {
  PeriodFilter,
  type PeriodFilterValue,
} from "@components/ui/PeriodFilter";
import { formatDateWithShortMonth } from "@utils/date";
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

type TypeFilter = "all" | "income" | "expense";
type TransactionSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function TransactionsPage() {
  const [period, setPeriod] = useState<PeriodFilterValue>({
    showAll: false,
    month: currentMonth,
    year: currentYear,
  });
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<TransactionSort>("date-desc");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editConfirm, setEditConfirm] = useState<Transaction | null>(null);

  const queryParams = useMemo(() => {
    if (period.showAll) return {};
    const start = new Date(
      Date.UTC(period.year, period.month - 1, 1, 0, 0, 0, 0),
    );
    const end = new Date(
      Date.UTC(period.year, period.month, 0, 23, 59, 59, 999),
    );
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [period]);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", "list", queryParams],
    queryFn: async () => {
      const response = await api.get("/transactions", { params: queryParams });
      return response.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const queryClient = useQueryClient();
  const openTransactionModal = useUiStore((s) => s.openTransactionModal);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
    },
  });

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id);
  };

  const handleEditClick = (t: Transaction) => {
    setEditConfirm(t);
  };

  const handleConfirmEdit = () => {
    if (editConfirm) {
      openTransactionModal("edit", editConfirm);
      setEditConfirm(null);
    }
  };

  const getCategoryName = (categoryId?: string) =>
    categories?.find((c) => c._id === categoryId)?.name ?? "Sem categoria";

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const base =
      typeFilter === "all"
        ? transactions
        : transactions.filter((t) => t.type === typeFilter);

    const withDate = base.map((t) => ({
      ...t,
      _ts: new Date(t.date).getTime(),
    }));

    withDate.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a._ts - b._ts;
        case "date-desc":
          return b._ts - a._ts;
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return withDate;
  }, [transactions, typeFilter, sort]);

  const incomeByCategory = useMemo(() => {
    if (!transactions?.length || !categories?.length) return [];
    const map = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === "income")
      .forEach((tx) => {
        const name = getCategoryName(tx.categoryId);
        map.set(name, (map.get(name) ?? 0) + tx.amount);
      });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, categories]);

  const expenseByCategory = useMemo(() => {
    if (!transactions?.length || !categories?.length) return [];
    const map = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const name = getCategoryName(tx.categoryId);
        map.set(name, (map.get(name) ?? 0) + tx.amount);
      });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, categories]);

  const formatAxis = (v: number) =>
    v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k` : `R$ ${v}`;

  const totalIncome = useMemo(
    () => incomeByCategory.reduce((acc, item) => acc + item.total, 0),
    [incomeByCategory],
  );
  const totalExpense = useMemo(
    () => expenseByCategory.reduce((acc, item) => acc + item.total, 0),
    [expenseByCategory],
  );

  return (
    <div className="space-y-8">
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir transação"
        message={
          deleteConfirm
            ? `Excluir "${deleteConfirm.title}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <ConfirmModal
        open={!!editConfirm}
        onClose={() => setEditConfirm(null)}
        onConfirm={handleConfirmEdit}
        title="Editar transação"
        message={editConfirm ? `Abrir "${editConfirm.title}" para edição?` : ""}
        confirmLabel="Abrir para edição"
        variant="primary"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Transações
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Receitas e despesas. Filtre por período ou exiba todos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            className="w-full sm:w-auto"
          />
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/30 p-0.5">
            {(["all", "income", "expense"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors min-w-[5rem] ${
                  typeFilter === value
                    ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {value === "all"
                  ? "Todos"
                  : value === "income"
                    ? "Entradas"
                    : "Saídas"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as TransactionSort)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antiga)</option>
              <option value="amount-desc">Valor (maior primeiro)</option>
              <option value="amount-asc">Valor (menor primeiro)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => openTransactionModal("create", null)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors min-w-[11rem]"
          >
            Nova transação
          </button>
        </div>
      </div>

      {!isLoading && transactions && transactions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 text-center mb-1">
              Receitas por categoria
            </p>
            {totalIncome > 0 && (
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300 text-center mb-2">
                Total:{" "}
                <span>
                  R$
                  {" "}
                  {totalIncome.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            )}
            <div className="h-48 md:h-56">
              {incomeByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incomeByCategory}
                    layout="vertical"
                    margin={{ left: 4, right: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-slate-600"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={formatAxis}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10 }}
                    />
                    <Bar dataKey="total" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center h-full">
                  Nenhuma receita no período
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 text-center mb-1">
              Despesas por categoria
            </p>
            {totalExpense > 0 && (
              <p className="text-xs font-medium text-rose-700/80 dark:text-rose-300 text-center mb-2">
                Total:{" "}
                <span>
                  R$
                  {" "}
                  {totalExpense.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            )}
            <div className="h-48 md:h-56">
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseByCategory}
                    layout="vertical"
                    margin={{ left: 4, right: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      className="dark:stroke-slate-600"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={formatAxis}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10 }}
                    />
                    <Bar dataKey="total" fill="#e11d48" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center h-full">
                  Nenhuma despesa no período
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            Carregando...
          </div>
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nenhuma transação ainda
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Clique em "Nova transação" para registrar sua primeira
              movimentação.
            </p>
            <button
              type="button"
              onClick={() => openTransactionModal("create", null)}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-500 min-w-[11rem]"
            >
              Nova transação
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
            {filteredTransactions.map((t, index) => {
              const isIncome = t.type === "income";
              return (
                <motion.li
                  key={t._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isIncome
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {t.installmentCurrent != null &&
                          t.installmentTotal != null && (
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-600/50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 mr-1.5">
                              Parcela {t.installmentCurrent}/
                              {t.installmentTotal}
                            </span>
                          )}
                        {getCategoryName(t.categoryId)}
                        {t.paymentMethod && ` · ${t.paymentMethod}`}
                        {" · "}
                        {formatDateWithShortMonth(t.date)}
                      </p>
                      {t.notes && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                          {t.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"} R${" "}
                      {t.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(t)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(t._id, t.title)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
