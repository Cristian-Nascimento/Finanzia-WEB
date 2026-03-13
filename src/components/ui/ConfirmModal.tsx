import { motion, AnimatePresence } from 'framer-motion'

export type ConfirmVariant = 'danger' | 'primary' | 'neutral'

type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: ConfirmVariant
  isLoading?: boolean
}

const variantStyles: Record<ConfirmVariant, string> = {
  danger:
    'bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 text-white',
  primary:
    'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white',
  neutral:
    'bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white',
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'neutral',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          key="confirm-modal"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-desc"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/50 dark:bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm min-w-[22rem] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-xl"
          >
          <h3
            id="confirm-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {title}
          </h3>
          <p
            id="confirm-modal-desc"
            className="mt-2 text-sm text-slate-600 dark:text-slate-400"
          >
            {message}
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 min-w-[6rem]"
            >
              {cancelLabel ?? 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
              }}
              disabled={isLoading}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 min-w-[6rem] ${variantStyles[variant]}`}
            >
              {isLoading ? 'Aguarde...' : confirmLabel}
            </button>
          </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
