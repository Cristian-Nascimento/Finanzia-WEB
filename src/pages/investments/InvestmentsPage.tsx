import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type { Investment } from "@typings/investment";
import { INVESTMENT_TYPES } from "@typings/investment";
import { Pencil, Trash2, Plus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmModal } from "@components/ui/ConfirmModal";
import {
  PeriodFilter,
  type PeriodFilterValue,
} from "@components/ui/PeriodFilter";
import { InvestmentModal } from "@components/investments/InvestmentModal";
import { formatDateWithShortMonth } from "@utils/date";
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function InvestmentsPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<PeriodFilterValue>({
    showAll: true,
    month: currentMonth,
    year: currentYear,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<Investment | null>(null);
  const [sort, setSort] = useState<
    "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
  >("date-desc");

  const queryParams = useMemo(() => {
    if (period.showAll) return { all: "true" };
    return { month: period.month, year: period.year };
  }, [period]);

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ["investments", queryParams],
    queryFn: async () => {
      const res = await api.get("/investments", { params: queryParams });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      setDeleteConfirm(null);
    },
  });

  const getTypeLabel = (type: string) =>
    INVESTMENT_TYPES.find((t) => t.value === type)?.label ?? type;

  const sortedInvestments = useMemo(() => {
    if (!investments) return [];
    const base = [...investments].map((i) => ({
      ...i,
      _ts: new Date(i.date).getTime(),
    }));
    base.sort((a, b) => {
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
    return base;
  }, [investments, sort]);

  const total = useMemo(
    () => sortedInvestments.reduce((acc, i) => acc + i.amount, 0),
    [sortedInvestments],
  );

  return (
    <div className="space-y-8">
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() =>
          deleteConfirm && deleteMutation.mutate(deleteConfirm._id)
        }
        title="Excluir investimento"
        message={
          deleteConfirm
            ? `Excluir "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <InvestmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setInvestmentToEdit(null);
        }}
        investmentToEdit={investmentToEdit}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Investimentos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie Selic, renda fixa, variável e outros. Filtre por período ou
            veja todos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <PeriodFilter
            value={period}
            onChange={setPeriod}
            className="w-full sm:w-auto"
          />
          <button
            type="button"
            onClick={() => {
              setInvestmentToEdit(null);
              setModalOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 min-w-[11rem]"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Novo investimento
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as
                    | "date-desc"
                    | "date-asc"
                    | "amount-desc"
                    | "amount-asc",
                )
              }
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antiga)</option>
              <option value="amount-desc">Valor (maior)</option>
              <option value="amount-asc">Valor (menor)</option>
            </select>
          </div>
        </div>
      </div>

      {!period.showAll && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Exibindo investimentos de {period.month}/{period.year}.
        </p>
      )}

      <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            Carregando...
          </div>
        ) : !investments?.length ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <TrendingUp className="h-12 w-12 text-slate-300 dark:text-slate-500 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nenhum investimento neste período
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Clique em "Novo investimento" ou selecione "Todos" para ver o
              histórico.
            </p>
            <button
              type="button"
              onClick={() => {
                setInvestmentToEdit(null);
                setModalOpen(true);
              }}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 min-w-[11rem]"
            >
              Novo investimento
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 dark:border-slate-700/70 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-700/20">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Total no período: R${" "}
                {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {sortedInvestments.map((inv, i) => (
                <motion.li
                  key={inv._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {inv.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getTypeLabel(inv.type)}
                        {inv.institution && ` · ${inv.institution}`}
                        {" · "}
                        {formatDateWithShortMonth(inv.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      R${" "}
                      {inv.amount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInvestmentToEdit(inv);
                          setModalOpen(true);
                        }}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(inv)}
                        className="p-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
