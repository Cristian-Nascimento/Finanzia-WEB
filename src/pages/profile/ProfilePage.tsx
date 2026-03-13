import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@services/api'
import { useAuthStore } from '@store/authStore'
type MeResponse = {
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
}

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  avatarUrl: z
    .string()
    .optional()
    .transform((v) => v?.trim() ?? '')
    .refine((v) => !v || /^https?:\/\//.test(v), 'Informe uma URL válida (ex.: https://...)'),
})

type ProfileFormValues = { name: string; avatarUrl: string }

export function ProfilePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const { data } = useQuery<MeResponse>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me')
      return response.data
    },
  })

  const user = data?.user ?? authUser

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as import('react-hook-form').Resolver<ProfileFormValues>,
    defaultValues: {
      name: user?.name ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user?.name, user?.avatarUrl, reset])

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: ProfileFormValues) => {
      const response = await api.patch('/auth/me', {
        name: payload.name.trim(),
        avatarUrl: payload.avatarUrl?.trim() || undefined,
      })
      return response.data as MeResponse
    },
    onSuccess: (data) => {
      updateUser(data.user)
      queryClient.setQueryData(['auth', 'me'], data)
      reset({ name: data.user.name, avatarUrl: data.user.avatarUrl ?? '' })
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data as MeResponse
    },
    onSuccess: (data) => {
      updateUser(data.user)
      queryClient.setQueryData(['auth', 'me'], data)
      reset((prev) => ({ ...prev, avatarUrl: data.user.avatarUrl ?? '' }))
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadAvatarMutation.mutate(file)
    }
    e.target.value = ''
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Perfil & Preferências
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Gerencie seu nome e foto exibidos no painel.
        </p>
      </div>

      <div className="glass-card p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-semibold text-white flex items-center justify-center">
              {user.name
                ?.split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Nome
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700"
              placeholder="Seu nome"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-rose-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Foto do perfil
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isPending}
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-70 transition-colors min-w-[11rem]"
              >
                {uploadAvatarMutation.isPending
                  ? 'Enviando...'
                  : 'Buscar foto no computador'}
              </button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                JPG, PNG, GIF ou WebP (até 3 MB)
              </span>
            </div>
            {uploadAvatarMutation.isError && (
              <p className="mt-1 text-xs text-rose-500">
                Erro ao enviar foto. Tente novamente.
              </p>
            )}
            {uploadAvatarMutation.isSuccess && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Foto atualizada com sucesso.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Ou cole uma URL da foto
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700"
              placeholder="https://exemplo.com/sua-foto.jpg"
              {...register('avatarUrl')}
            />
            {errors.avatarUrl && (
              <p className="mt-0.5 text-xs text-rose-500">
                {errors.avatarUrl.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 dark:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-70 min-w-[10rem]"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </button>
          {updateProfileMutation.isSuccess && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Perfil atualizado com sucesso.</p>
          )}
          {updateProfileMutation.isError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Erro ao salvar. Tente novamente.
            </p>
          )}
        </form>
      </div>

      <div className="glass-card p-4 text-sm space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">E-mail (não editável)</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
      </div>
    </div>
  )
}
