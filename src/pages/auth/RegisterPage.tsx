import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { api } from '@services/api'

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'O nome deve ter pelo menos 2 caracteres')
      .max(100, 'O nome deve ter no máximo 100 caracteres')
      .transform((v) => v.trim())
      .refine((v) => v.length >= 2, 'Informe seu nome completo'),
    email: z
      .string()
      .min(1, 'E-mail é obrigatório')
      .email('Informe um e-mail válido')
      .transform((v) => v.trim().toLowerCase()),
    password: z
      .string()
      .min(6, 'Mínimo de 6 caracteres')
      .max(50, 'A senha deve ter no máximo 50 caracteres')
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'A senha deve conter pelo menos uma letra e um número'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      await api.post('/auth/register', {
        name: data.name.trim(),
        email: data.email,
        password: data.password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Erro ao criar conta. Tente novamente.'
      setError('root', { type: 'server', message })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Criar conta
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Preencha os dados abaixo. Todas as validações são feitas no formulário e no servidor.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
            {errors.root.message}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nome completo</label>
          <input
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Como devemos te chamar?"
            maxLength={100}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-[11px] text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">E-mail</label>
          <input
            type="email"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500/20"
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
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Digite sua senha"
            maxLength={50}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[11px] text-rose-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Confirmar senha
          </label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Confirme sua senha"
            maxLength={50}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-[11px] text-rose-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={isSubmitting}
          type="submit"
          className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/30 transition-all hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-70"
        >
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-1 w-full text-center text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
        >
          Já tem conta? Fazer login
        </button>
      </form>
    </div>
  )
}
