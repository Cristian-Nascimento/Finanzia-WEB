/** Formata número para exibição em Real (BRL): 1.234,56 */
export function formatBRL(value: number): string {
  if (Number.isNaN(value) || value == null) return '0,00'
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Converte string no formato brasileiro (1.234,56) para número */
export function parseBRL(value: string): number {
  if (!value || typeof value !== 'string') return 0
  const cleaned = value.replace(/\D/g, '')
  if (cleaned === '') return 0
  const num = Number(cleaned) / 100
  return Number.isNaN(num) ? 0 : num
}

/** Formata enquanto o usuário digita (aceita apenas números e vírgula/ponto) */
export function formatBRLInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits === '') return ''
  const num = Number(digits) / 100
  return formatBRL(num)
}
