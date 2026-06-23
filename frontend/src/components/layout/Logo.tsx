import styles from './Logo.module.css'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ size = 'md', showText = true }: Props) {
  const sizes = { sm: 28, md: 36, lg: 52 }
  const s = sizes[size]

  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      {/* SVG icon: stylized EV bolt + speed arc */}
      <svg width={s} height={s} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#FF8C2A"/>
            <stop offset="100%" stopColor="#E8650A"/>
          </linearGradient>
          <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#0A0E1A"/>
            <stop offset="100%" stopColor="#131929"/>
          </linearGradient>
        </defs>
        {/* Outer circle */}
        <circle cx="26" cy="26" r="25" fill="url(#lg2)" stroke="url(#lg1)" strokeWidth="2"/>
        {/* Speed arc top */}
        <path d="M10 26 A16 16 0 0 1 42 26" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
        {/* Lightning bolt */}
        <path d="M29 10 L19 27 L26 27 L23 42 L33 25 L26 25 Z"
              fill="url(#lg1)" stroke="none"/>
      </svg>
      {showText && (
        <div className={styles.text}>
          <span className={styles.speed}>Speed</span><span className={styles.fast}>Fast</span>
        </div>
      )}
    </div>
  )
}
