import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/Toast'
import styles from './AuthPage.module.css'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string })?.from ?? '/dashboard'

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      setTokens(data.accessToken, data.refreshToken, data.user)
      toast.success(`Welcome back, ${data.user.email}`)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        setError('password', { message: 'Invalid email or password' })
      } else {
        toast.error('Unable to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.card}>
        <div className={styles.logoWrap}><Logo size="md" /></div>
        <h1 className={styles.title}>Sign in to your fleet</h1>
        <p className={styles.sub}>Enter your credentials to access SpeedFast</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input label="Email" type="email" autoComplete="email" placeholder="you@vinfast.vn"
            error={errors.email?.message} {...register('email')} />

          <div className={styles.pwWrap}>
            <Input label="Password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)}
              aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button type="submit" loading={loading} className={styles.submit}>Sign in</Button>
        </form>

        <p className={styles.switch}>
          Don't have an account? <Link to="/register" className={styles.switchLink}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
