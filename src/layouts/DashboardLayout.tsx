import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Plus, LogOut, User, ChevronDown, LayoutDashboard, ArrowLeftRight, Tags, UserCircle, TrendingUp, Moon, Sun, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@store/authStore'
import { useUiStore } from '@store/uiStore'
import { useThemeStore } from '@store/themeStore'
import { TransactionModal } from '@components/transactions/TransactionModal'

const navItems: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { to: '/credit-card', label: 'Cartão de crédito', icon: CreditCard },
  { to: '/investments', label: 'Investimentos', icon: TrendingUp },
  { to: '/categories', label: 'Categorias', icon: Tags },
]

export function DashboardLayout() {
  const navigate = useNavigate()
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { user, clearAuth } = useAuthStore()
  const openTransactionModal = useUiStore((s) => s.openTransactionModal)
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const initials =
    user?.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'US'

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-bg-soft)] text-slate-900 dark:text-slate-100 flex">
      {/* Overlay mobile */}
      <div
        className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        style={{
          opacity: sidebarOpenMobile ? 1 : 0,
          pointerEvents: sidebarOpenMobile ? 'auto' : 'none',
        }}
        onClick={() => setSidebarOpenMobile(false)}
        aria-hidden
      />

      {/* Sidebar - cores conforme tema (claro/escuro); cantos arredondados */}
      <aside
        className={[
          'flex flex-col rounded-r-2xl border-r shrink-0 transition-transform duration-200 ease-out',
          'bg-[var(--color-sidebar)] border-slate-200/60 dark:border-slate-600/60',
          'text-slate-700 dark:text-slate-200',
          'fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] shadow-xl lg:shadow-none',
          'lg:static lg:max-w-none lg:translate-x-0 lg:w-72',
          sidebarOpenMobile ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Menu de navegação"
      >
        <div className="flex items-center gap-2 px-4 pt-5 pb-4 border-b border-slate-200/70 dark:border-slate-600/50 min-h-[73px]">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center text-sm font-bold text-white shrink-0 flex-shrink-0">
              FZ
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Finanzia</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Painel financeiro</p>
            </div>
          </div>
          {/* Botão de recolher/remover sidebar foi desativado; sidebar fica sempre expandida */}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpenMobile(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-600/50 hover:text-slate-900 dark:hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="min-w-[7.5rem] inline-block text-left">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-200/70 dark:border-slate-600/50 p-2 space-y-0.5">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpenMobile(false)}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-600/50 hover:text-slate-900 dark:hover:text-white',
              ].join(' ')
            }
          >
            <UserCircle className="h-5 w-5 shrink-0" />
            <span className="min-w-[7.5rem] inline-block text-left">Gerenciar Perfil</span>
          </NavLink>
          <button
            type="button"
            onClick={clearAuth}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-600/50 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="min-w-[7.5rem] inline-block text-left">Sair</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-600/50 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5 shrink-0" />
            ) : (
              <Sun className="h-5 w-5 shrink-0" />
            )}
            <span className="min-w-[7.5rem] inline-block text-left">
              {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            </span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <TransactionModal />
        <header className="sticky top-0 z-20 border-b border-slate-200/70 dark:border-slate-600/70 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="lg:hidden inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                onClick={() => setSidebarOpenMobile(true)}
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
                <span className="text-sm font-medium">Menu</span>
              </button>
              <div className="hidden sm:flex items-center rounded-xl bg-white dark:bg-slate-700 px-3 py-2 border border-slate-200/70 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 gap-2 min-w-[11rem]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                Atualizado em tempo real
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 min-w-[11rem]"
                onClick={() => openTransactionModal('create', null)}
              >
                <Plus className="h-3.5 w-3.5 mr-1 shrink-0" />
                Nova transação
              </button>
              <div className="relative flex items-center gap-2" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl px-1 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-md"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center shadow-md">
                      {initials}
                    </div>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-52 min-w-[12.5rem] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-1 shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          navigate('/profile')
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <User className="h-3.5 w-3.5" />
                        Perfil / Gerenciar conta
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          clearAuth()
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sair
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Área de conteúdo: ocupa a altura inteira e faz o scroll vertical interno, não na página */}
        <main className="flex-1 w-full min-w-0 pt-4 lg:pt-6 pb-0 flex justify-center overflow-hidden">
          <div className="w-full max-w-[94vw] mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-y-auto pb-6 lg:pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
