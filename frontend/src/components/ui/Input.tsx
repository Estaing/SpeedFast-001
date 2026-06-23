import React from 'react'
import styles from './Input.module.css'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const uid = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={styles.wrapper}>
        {label && <label htmlFor={uid} className={styles.label}>{label}</label>}
        <input
          ref={ref}
          id={uid}
          className={`${styles.input} ${error ? styles.hasError : ''} ${className}`}
          {...rest}
        />
        {error && <span className={styles.error} role="alert">{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
