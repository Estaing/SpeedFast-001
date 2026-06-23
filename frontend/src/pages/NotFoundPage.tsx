import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/layout/Logo'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <div className={styles.root}>
      <Logo size="md" />
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.sub}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard"><Button size="lg">Go to Dashboard</Button></Link>
    </div>
  )
}
