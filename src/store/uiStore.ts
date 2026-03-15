import { create } from 'zustand'
import type { Transaction } from '@typings/transaction'

type TransactionModalMode = 'create' | 'edit'
type TransactionType = 'income' | 'expense'

type UiState = {
  isTransactionModalOpen: boolean
  transactionModalMode: TransactionModalMode
  transactionToEdit: Transaction | null
  /** Tipo inicial ao abrir em modo criação (entrada/saída). */
  initialTransactionType: TransactionType | null
  /** Forma de pagamento inicial ao abrir em modo criação (ex.: 'debit'). */
  initialPaymentMethod: string | null
  openTransactionModal: (
    mode?: TransactionModalMode,
    tx?: Transaction | null,
    initialType?: TransactionType,
    initialPaymentMethod?: string,
  ) => void
  closeTransactionModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isTransactionModalOpen: false,
  transactionModalMode: 'create',
  transactionToEdit: null,
  initialTransactionType: null,
  initialPaymentMethod: null,
  openTransactionModal: (mode = 'create', tx = null, initialType, initialPaymentMethod) =>
    set({
      isTransactionModalOpen: true,
      transactionModalMode: mode,
      transactionToEdit: tx,
      initialTransactionType: initialType ?? null,
      initialPaymentMethod: initialPaymentMethod ?? null,
    }),
  closeTransactionModal: () =>
    set({
      isTransactionModalOpen: false,
      transactionToEdit: null,
      initialTransactionType: null,
      initialPaymentMethod: null,
    }),
}))

