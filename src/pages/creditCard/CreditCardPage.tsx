import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type {
  CreditCardPurchase,
  CreditCardAccount,
} from "@typings/creditCard";
import {
  getTotalValue,
  getInstallmentMonths,
  MONTH_NAMES,
} from "@typings/creditCard";
import { formatDateShort } from "@utils/date";
import { Pencil, Trash2, Plus, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmModal } from "@components/ui/ConfirmModal";
import { CreditCardModal } from "@components/creditCard/CreditCardModal";
import { CreditCardAccountModal } from "@components/creditCard/CreditCardAccountModal";
import { ImportCreditCardModal } from "@components/creditCard/ImportCreditCardModal";

type MonthKey = { year: number; month: number };
type CreditCardSort =
  | "date-desc"
  | "date-asc"
  | "platform-asc"
  | "platform-desc"
  | "total-desc"
  | "total-asc";

function monthKeyToString(m: MonthKey): string {
  return `${m.year}-${String(m.month).padStart(2, "0")}`;
}

/** Gera a lista de meses (year, month) a exibir no grid */
function getMonthsToDisplay(purchases: CreditCardPurchase[]): MonthKey[] {
  if (!purchases.length) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const out: MonthKey[] = [];
    for (let i = -1; i <= 12; i++) {
      let mm = m + i;
      let yy = y;
      while (mm > 12) {
        mm -= 12;
        yy += 1;
      }
      while (mm < 1) {
        mm += 12;
        yy -= 1;
      }
      out.push({ year: yy, month: mm });
    }
    return out;
  }
  const allMonths: MonthKey[] = [];
  purchases.forEach((p) => {
    const closing = p.cardClosingDay ?? new Date(p.date).getUTCDate();
    const arr = getInstallmentMonths(
      p.date,
      p.totalInstallments,
      closing,
      p.closingDayToNextInvoice ?? false,
    );
    arr.forEach((m) => allMonths.push(m));
  });
  const set = new Set<string>(allMonths.map(monthKeyToString));
  const sorted = Array.from(set)
    .map((s) => {
      const [y, m] = s.split("-").map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  if (sorted.length === 0) return [];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const result: MonthKey[] = [];
  let y = first.year;
  let m = first.month;
  const endY = last.year;
  const endM = last.month;
  while (y < endY || (y === endY && m <= endM)) {
    result.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

/** Para uma compra e um mês, retorna 'paid' | 'pending' | null */
function getCellStatus(
  purchase: CreditCardPurchase,
  month: MonthKey,
): "paid" | "pending" | null {
  const months = getInstallmentMonths(
    purchase.date,
    purchase.totalInstallments,
    purchase.cardClosingDay ?? new Date(purchase.date).getUTCDate(),
    purchase.closingDayToNextInvoice ?? false,
  );
  const index = months.findIndex(
    (mm) => mm.year === month.year && mm.month === month.month,
  );
  if (index < 0) return null;
  return index < purchase.paidInstallments ? "paid" : "pending";
}

export function CreditCardPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] =
    useState<CreditCardPurchase | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CreditCardPurchase | null>(
    null,
  );
  const [sort, setSort] = useState<CreditCardSort>("date-desc");
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardFilter, setCardFilter] = useState<string>("");

  const { data: purchases = [], isLoading } = useQuery<CreditCardPurchase[]>({
    queryKey: ["credit-card"],
    queryFn: async () => {
      const res = await api.get("/credit-card");
      return res.data;
    },
  });

  const { data: cardAccounts = [] } = useQuery<CreditCardAccount[]>({
    queryKey: ["credit-card-accounts"],
    queryFn: async () => {
      const res = await api.get("/credit-card-accounts");
      return res.data;
    },
  });

  const filteredPurchases = useMemo(() => {
    if (!purchases.length) return [];
    if (!cardFilter) return purchases;
    if (cardFilter === "__no_card__") {
      return purchases.filter((p) => !p.cardId);
    }
    return purchases.filter((p) => p.cardId === cardFilter);
  }, [purchases, cardFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/credit-card/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-charts"] });
      setDeleteConfirm(null);
    },
  });

  const monthsToDisplay = useMemo(
    () => getMonthsToDisplay(filteredPurchases),
    [filteredPurchases],
  );

  /** Total a pagar por mês: sempre calculado para cada mês exibido em "Parcelas por mês". */
  const totalByMonth = useMemo(() => {
    const map = new Map<string, number>();
    monthsToDisplay.forEach((month) => {
      const key = monthKeyToString(month);
      let total = 0;
      filteredPurchases.forEach((p) => {
        const months = getInstallmentMonths(
          p.date,
          p.totalInstallments,
          p.cardClosingDay ?? new Date(p.date).getUTCDate(),
          p.closingDayToNextInvoice ?? false,
        );
        const index = months.findIndex(
          (mm) => mm.year === month.year && mm.month === month.month,
        );
        if (index >= 0 && index >= p.paidInstallments) {
          total += p.installmentValue;
        }
      });
      map.set(key, total);
    });
    return map;
  }, [filteredPurchases, monthsToDisplay]);

  const sortedPurchases = useMemo(() => {
    const base = [...filteredPurchases];
    base.sort((a, b) => {
      const totalA = getTotalValue(a);
      const totalB = getTotalValue(b);
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      switch (sort) {
        case "date-asc":
          return dateA - dateB;
        case "date-desc":
          return dateB - dateA;
        case "platform-asc":
          return a.platform.localeCompare(b.platform, "pt-BR", {
            sensitivity: "base",
          });
        case "platform-desc":
          return b.platform.localeCompare(a.platform, "pt-BR", {
            sensitivity: "base",
          });
        case "total-asc":
          return totalA - totalB;
        case "total-desc":
          return totalB - totalA;
        default:
          return 0;
      }
    });
    return base;
  }, [filteredPurchases, sort]);

  return (
    <div className="space-y-10 pb-4">
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() =>
          deleteConfirm && deleteMutation.mutate(deleteConfirm._id)
        }
        title="Excluir compra"
        message={
          deleteConfirm
            ? `Excluir compra em "${deleteConfirm.platform}"? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <CreditCardModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPurchaseToEdit(null);
        }}
        purchaseToEdit={purchaseToEdit}
        accounts={cardAccounts}
      />
      <ImportCreditCardModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
      <CreditCardAccountModal
        open={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Cartão de crédito
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Acompanhe compras parceladas. As parcelas aparecem também no
            Dashboard e em Transações.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Importar planilha
          </button>
          <button
            type="button"
            onClick={() => {
              setPurchaseToEdit(null);
              setModalOpen(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 shadow-sm min-w-[11rem] transition-colors"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nova compra
          </button>
          <button
            type="button"
            onClick={() => setCardModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
          >
            Gerenciar cartões
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Cartão:</span>
            <select
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="">Todos</option>
              <option value="__no_card__">Sem cartão vinculado</option>
              {cardAccounts.map((card) => (
                <option key={card._id} value={card._id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CreditCardSort)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antiga)</option>
              <option value="platform-asc">Plataforma (A–Z)</option>
              <option value="platform-desc">Plataforma (Z–A)</option>
              <option value="total-desc">Valor total (maior)</option>
              <option value="total-asc">Valor total (menor)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          Carregando...
        </div>
      ) : purchases.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 sm:p-14 text-center shadow-sm"
        >
          <CreditCard className="mx-auto h-14 w-14 text-slate-300 dark:text-slate-500" />
          <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-slate-100">
            Nenhuma compra parcelada
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Clique em &quot;Nova compra&quot; para registrar uma compra no
            cartão. As parcelas também aparecerão no Dashboard e em Transações.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 min-w-[11rem] transition-colors"
          >
            Nova compra
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Esquerda: Compras parceladas (largura fixa) */}
          <div className="min-w-0 lg:w-[420px] xl:w-[700px] shrink-0 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-600">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Compras parceladas
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Lista de compras no cartão com valor total e parcelas pagas.
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
                      Onde foi a compra
                    </th>
                    <th className="text-right py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                      Valor da parcela
                    </th>
                    <th className="text-right py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                      Valor total
                    </th>
                    <th className="text-center py-4 px-5 font-medium text-slate-700 dark:text-slate-300">
                      Parcelas
                    </th>
                    <th className="w-24 py-4 px-3" aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {sortedPurchases.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-slate-100 dark:border-slate-600/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        {formatDateShort(p.date)}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-900 dark:text-slate-100">
                        {p.platform}
                      </td>
                      <td className="py-4 px-5 text-right text-slate-700 dark:text-slate-300">
                        R${" "}
                        {p.installmentValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-5 text-right font-medium text-slate-900 dark:text-slate-100">
                        R${" "}
                        {getTotalValue(p).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-600/50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                          {p.paidInstallments}/{p.totalInstallments}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPurchaseToEdit(p);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(p)}
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

          {/* Direita: Parcelas por mês (prioridade de largura horizontal; scroll lateral interno) */}
          <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-sm flex flex-col">
            <div className="px-5 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-600 shrink-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Parcelas por mês
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Verde = pago · Amarelo = pendente. Valores no topo indicam o
                total a pagar naquele mês.
              </p>
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50">
                    <th className="sticky left-0 z-10 min-w-[80px] text-left py-3 px-2 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border-b border-r border-slate-200 dark:border-slate-600">
                      Compra
                    </th>
                    {monthsToDisplay.map((m) => (
                      <th
                        key={monthKeyToString(m)}
                        className="min-w-[58px] py-3 px-1.5 text-center font-medium text-slate-600 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-600 last:border-r-0"
                      >
                        {MONTH_NAMES[m.month - 1]}
                        <span className="block text-[10px] text-slate-500 dark:text-slate-500">
                          {m.year}
                        </span>
                        <span className="block font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          R${" "}
                          {(
                            totalByMonth.get(monthKeyToString(m)) ?? 0
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPurchases.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-slate-100 dark:border-slate-600/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/10"
                    >
                      <td className="sticky left-0 z-10 py-3 px-2 font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-600">
                        <span className="block">{p.platform}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.paidInstallments}/{p.totalInstallments} · R${" "}
                          {p.installmentValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                          /parcela
                        </span>
                      </td>
                      {monthsToDisplay.map((month) => {
                        const status = getCellStatus(p, month);
                        return (
                          <td
                            key={monthKeyToString(month)}
                            className="min-w-[80px] w-14 h-10 p-1 border-r border-slate-100 dark:border-slate-600/50 last:border-r-0 align-middle"
                          >
                            {status === "paid" && (
                              <div
                                className="w-full h-8 rounded-md bg-emerald-500 dark:bg-emerald-600 shadow-sm"
                                title="Pago"
                              />
                            )}
                            {status === "pending" && (
                              <div
                                className="w-full h-8 rounded-md bg-amber-400 dark:bg-amber-500 shadow-sm"
                                title="Pendente"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
