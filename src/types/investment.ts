export type Investment = {
  _id: string
  name: string
  type: string
  amount: number
  date: string
  institution?: string
  dueDate?: string
  notes?: string
}

export const INVESTMENT_TYPES = [
  { value: 'selic', label: 'Selic' },
  { value: 'renda_fixa', label: 'Renda fixa' },
  { value: 'variavel', label: 'Renda variável' },
  { value: 'tesouro_direto', label: 'Tesouro direto' },
  { value: 'cdb', label: 'CDB' },
  { value: 'lci_lca', label: 'LCI/LCA' },
  { value: 'fundos', label: 'Fundos' },
  { value: 'acoes', label: 'Ações' },
  { value: 'fiis', label: 'FIIs' },
  { value: 'outros', label: 'Outros' },
] as const
