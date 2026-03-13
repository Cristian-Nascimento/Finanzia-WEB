const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export type PeriodFilterValue = {
  showAll: boolean
  month: number
  year: number
}

type PeriodFilterProps = {
  value: PeriodFilterValue
  onChange: (value: PeriodFilterValue) => void
  label?: string
  className?: string
}

const currentYear = new Date().getFullYear()
const years = [currentYear, currentYear - 1, currentYear - 2]

export function PeriodFilter({ value, onChange, label, className = '' }: PeriodFilterProps) {
  const displayLabel = label ?? 'Período'
  const handleShowAll = () => {
    onChange({ ...value, showAll: true })
  }

  const handlePeriod = (month: number, year: number) => {
    onChange({ showAll: false, month, year })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{displayLabel}</span>
      <button
        type="button"
        onClick={handleShowAll}
        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors min-w-[4.5rem] ${
          value.showAll
            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
      >
        Todos
      </button>
      <select
        value={value.month}
        onChange={(e) => handlePeriod(Number(e.target.value), value.year)}
        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={value.year}
        onChange={(e) => handlePeriod(value.month, Number(e.target.value))}
        className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}
