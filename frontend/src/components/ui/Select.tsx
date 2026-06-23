import React from 'react'
import styles from './Select.module.css'

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, id, className = '', ...rest }, ref) => {
    const uid = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={styles.wrapper}>
        {label && <label htmlFor={uid} className={styles.label}>{label}</label>}
        <div className={styles.selectWrapper}>
          <select ref={ref} id={uid} className={`${styles.select} ${error ? styles.hasError : ''} ${className}`} {...rest}>
            <option value="">Select {label}</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className={styles.arrow}>▾</span>
        </div>
        {error && <span className={styles.error} role="alert">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
