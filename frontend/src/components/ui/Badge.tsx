import styles from './Badge.module.css'

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'orange'

interface Props {
  children: React.ReactNode
  variant?: Variant
}

export function Badge({ children, variant = 'info' }: Props) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
}
