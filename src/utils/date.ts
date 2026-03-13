/**
 * Datas vindas do backend em ISO (ex: 2025-01-01T00:00:00.000Z) são tratadas como "só data".
 * Em UTC o dia é 1; no Brasil (UTC-3) a mesma hora é 31/12 21h, então toLocaleDateString
 * no fuso local mostraria um dia a menos. Usamos timeZone: 'UTC' para que o dia exibido
 * coincida com o dia civil que o usuário escolheu (e que o backend usa nas regras).
 */

/**
 * Formata data para exibição em pt-BR usando UTC, para datas "só dia" da API
 * (evita mostrar um dia a menos no Brasil).
 */
export function formatDatePtBR(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  });
}

/**
 * Formata data curta (ex: "01/01/2025").
 */
export function formatDateShort(date: string | Date): string {
  return formatDatePtBR(date);
}

/**
 * Formata data com mês abreviado (ex: "01 de jan. de 2025").
 */
export function formatDateWithShortMonth(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
