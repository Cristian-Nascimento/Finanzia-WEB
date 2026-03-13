import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { api } from '@services/api'
const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  type LoginForm = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post('/auth/login', data)
      const { user, token } = response.data
      setAuth({ user, token })
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Erro ao fazer login. Tente novamente.'
      alert(message)
    }
  }

  const fromRegister = (location.state as { registered?: boolean })?.registered

  return (
    <div className="space-y-6">
      {fromRegister && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          Conta criada com sucesso. Faça login para acessar o painel.
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Entrar no painel
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Acompanhe saldo, receitas e despesas em um dashboard moderno.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-mail</label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="voce@exemplo.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[11px] text-rose-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Senha</label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Digite sua senha"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[11px] text-rose-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <button
            type="button"
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
          >
            Esqueci minha senha
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline-offset-2 hover:underline"
          >
            Criar conta
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={isSubmitting}
          type="submit"
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-70"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </motion.button>

        <div className="relative my-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
          <span className="relative z-10 bg-white dark:bg-slate-800 px-2">ou continue com</span>
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200 dark:bg-slate-600" />
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-600"
        >
          <span className="h-4 w-4 rounded-[4px] bg-white border border-slate-200" />
          Entrar com Google
        </motion.button>
      </form>
    </div>
  )
}
