import { useEffect, useState } from 'react'
import styles from './BatteryArc.module.css'

interface Props {
  level: number        // 0-100
  isCharging: boolean
  size?: number
}

export function BatteryArc({ level, isCharging, size = 120 }: Props) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(level), 100)
    return () => clearTimeout(timer)
  }, [level])

  const radius = 44
  const circumference = 2 * Math.PI * radius
  // Only draw 270° arc (three-quarter circle)
  const arcLen = circumference * 0.75
  const offset = arcLen - (animated / 100) * arcLen

  const color = level > 60 ? 'var(--green)' : level > 25 ? 'var(--amber)' : 'var(--red)'
  const glowColor = level > 60 ? '#22C55E' : level > 25 ? '#F59E0B' : '#EF4444'

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke="var(--border)" strokeWidth="7"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Fill */}
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${glowColor}88)`,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease',
          }}
        />
      </svg>

      {/* Center content */}
      <div className={styles.center}>
        <span className={styles.level} style={{ color }}>{level}%</span>
        {isCharging && (
          <span className={`${styles.chargingDot}`} style={{ background: glowColor }} />
        )}
      </div>
    </div>
  )
}
