import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/api/auth'
import { toast } from '@/components/ui/Toast'
import styles from './AuthPage.module.css'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type FormData = z.infer<typeof schema>

function StrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters',    ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number',           ok: /[0-9]/.test(password) },
  ]
  return (
    <div className={styles.strength}>
      {checks.map(({ label, ok }) => (
        <div key={label} className={`${styles.check} ${ok ? styles.checkOk : ''}`}>
          <Check size={11} />{label}
        </div>
      ))}
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const pw = watch('password', '')

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true)
    try {
      await authApi.register(email, password)
      toast.success('Account created — please sign in')
      navigate('/login')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('email', { message: 'An account with this email already exists' })
      } else {
        toast.error('Registration failed. Please try again.')
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
        <h1 className={styles.title}>Create your fleet account</h1>
        <p className={styles.sub}>Start managing your VinFast EVs today</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Input label="Email" type="email" autoComplete="email" placeholder="you@vinfast.vn"
            error={errors.email?.message} {...register('email')} />

          <div className={styles.pwWrap}>
            <Input label="Password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(p => !p)}
              aria-label={showPw ? 'Hide' : 'Show'}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pw && <StrengthIndicator password={pw} />}

          <Input label="Confirm password" type="password" autoComplete="new-password" placeholder="••••••••"
            error={errors.confirm?.message} {...register('confirm')} />

          <Button type="submit" loading={loading} className={styles.submit}>Create account</Button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
