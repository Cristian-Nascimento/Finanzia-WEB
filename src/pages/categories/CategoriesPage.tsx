import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@services/api";
import type { Category } from "@typings/category";
import {
  Pencil,
  Trash2,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { ConfirmModal } from "@components/ui/ConfirmModal";
import { CategoryModal } from "@components/categories/CategoryModal";
export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteConfirm(null);
    },
  });

  const handleEdit = (cat: Category) => {
    setCategoryToEdit(cat);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setCategoryToEdit(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCategoryToEdit(null);
  };

  const [sortAsc, setSortAsc] = useState(true);

  const incomeCategories = useMemo(
    () =>
      (categories?.filter((c) => c.type === "income") ?? [])
        .slice()
        .sort((a, b) =>
          sortAsc
            ? a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
            : b.name.localeCompare(a.name, "pt-BR", { sensitivity: "base" }),
        ),
    [categories, sortAsc],
  );
  const expenseCategories = useMemo(
    () =>
      (categories?.filter((c) => c.type === "expense") ?? [])
        .slice()
        .sort((a, b) =>
          sortAsc
            ? a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
            : b.name.localeCompare(a.name, "pt-BR", { sensitivity: "base" }),
        ),
    [categories, sortAsc],
  );

  return (
    <div className="space-y-8">
      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() =>
          deleteConfirm && deleteMutation.mutate(deleteConfirm._id)
        }
        title="Excluir categoria"
        message={
          deleteConfirm
            ? `Excluir "${deleteConfirm.name}"? Transações vinculadas podem ficar sem categoria.`
            : ""
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <CategoryModal
        open={modalOpen}
        onClose={handleCloseModal}
        categoryToEdit={categoryToEdit}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Organize receitas e despesas por categoria. Edite ou exclua quando
            precisar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors min-w-[11rem]"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Nova categoria
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Ordenar:</span>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {sortAsc ? "Nome (A–Z)" : "Nome (Z–A)"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-700/70 px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/20">
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Receitas
            </h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
            {isLoading ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Carregando...
              </li>
            ) : incomeCategories.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma categoria de receita.
              </li>
            ) : (
              incomeCategories.map((cat, i) => (
                <motion.li
                  key={cat._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: cat.color || "#10b981" }}
                    >
                      {cat.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(cat)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/70 dark:border-slate-600/70 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 dark:border-slate-700/70 px-4 py-3 bg-rose-50/50 dark:bg-rose-900/20">
            <h2 className="text-sm font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Despesas
            </h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/70">
            {isLoading ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Carregando...
              </li>
            ) : expenseCategories.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma categoria de despesa.
              </li>
            ) : (
              expenseCategories.map((cat, i) => (
                <motion.li
                  key={cat._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-medium shrink-0"
                      style={{ backgroundColor: cat.color || "#e11d48" }}
                    >
                      {cat.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(cat)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(cat)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
