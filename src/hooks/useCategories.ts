import { useQuery } from '@tanstack/react-query'
import { api } from '@services/api'
import type { Category } from '@typings/category'

/** Query key para categorias; use para invalidateQueries após criar/editar/excluir. */
export const categoriesQueryKey = ['categories'] as const

/**
 * Busca categorias do usuário (receita e despesa).
 * Reutilizado em Dashboard, Transações, Categorias, Débito, TransactionModal, etc.
 */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: categoriesQueryKey,
    queryFn: async () => {
      const res = await api.get<Category[]>('/categories')
      return res.data
    },
  })
}
