export interface CreditCardPurchase {
  _id: string;
  date: string;
  platform: string;
  installmentValue: number;
  totalInstallments: number;
  paidInstallments: number;
  userId: string;
  cardId?: string;
  cardClosingDay?: number;
  /** Se true, compras no dia de fechamento vão para a próxima fatura */
  closingDayToNextInvoice?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardAccount {
  _id: string;
  name: string;
  closingDay: number;
}

export function getTotalValue(p: CreditCardPurchase): number {
  return p.installmentValue * p.totalInstallments;
}

/** Para uma compra, retorna para cada índice de parcela (0..n-1) o { year, month } da fatura,
 * considerando o dia de fechamento do cartão. Usa UTC para bater com o backend (datas em ISO).
 * Regra padrão: compras até o dia de fechamento entram na fatura desse mês;
 * compras após o dia de fechamento entram na fatura do mês seguinte.
 * Se closingDayToNextInvoice=true, compras exatamente no dia de fechamento
 * também vão para a próxima fatura.
 */
export function getInstallmentMonths(
  purchaseDate: string,
  totalInstallments: number,
  closingDay: number,
  closingDayToNextInvoice: boolean,
): { year: number; month: number }[] {
  const d = new Date(purchaseDate);
  const day = d.getUTCDate();
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;

  const goesNext =
    day > closingDay || (closingDayToNextInvoice && day === closingDay);
  if (goesNext) {
    m += 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }

  const result: { year: number; month: number }[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    result.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result;
}

export const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
