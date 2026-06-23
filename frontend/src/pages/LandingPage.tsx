import { Link } from 'react-router-dom'
import { Zap, Shield, Activity, ChevronRight, Car } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import styles from './LandingPage.module.css'

const FEATURES = [
  { icon: Zap,      title: 'Real-time Telemetry',    desc: 'Live battery levels, charging status, and range estimation for your entire fleet.' },
  { icon: Shield,   title: 'Secure by Design',        desc: 'JWT access tokens, rotating refresh tokens, rate limiting, and end-to-end encryption.' },
  { icon: Activity, title: 'Fleet Analytics',          desc: 'Aggregate charging patterns, range trends, and vehicle health across all your VinFast EVs.' },
  { icon: Car,      title: 'Multi-Model Support',     desc: 'Full support for VF3, VF5, VF6, VF7, VF8, and VF9 with model-specific configurations.' },
]

const MODELS = ['VF3','VF5','VF6','VF7','VF8','VF9']

export function LandingPage() {
  return (
    <div className={styles.root}>
      {/* Nav */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Logo size="md" />
          <nav className={styles.nav}>
            <Link to="/login"    className={styles.navLink}>Sign in</Link>
            <Link to="/register"><Button size="sm">Get Started</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}><Zap size={12} /> EV Fleet Management Platform</div>
          <h1 className={styles.heroTitle}>
            Command your<br />
            <span className={styles.orange}>electric fleet</span><br />
            at full speed.
          </h1>
          <p className={styles.heroSub}>
            SpeedFast gives fleet operators and EV owners a single dashboard to monitor charge levels, track range, and manage every VinFast vehicle in real time.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register"><Button size="lg">Start free <ChevronRight size={18} /></Button></Link>
            <Link to="/login"><Button size="lg" variant="secondary">Sign in</Button></Link>
          </div>
          {/* Model pills */}
          <div className={styles.models}>
            {MODELS.map(m => <span key={m} className={styles.modelPill}>{m}</span>)}
          </div>
        </div>

        {/* Hero visual: animated battery ring */}
        <div className={styles.heroVisual} aria-hidden>
          <div className={styles.visualRing}>
            <svg viewBox="0 0 200 200" width="260" height="260">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF8C2A"/>
                  <stop offset="100%" stopColor="#E8650A"/>
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="84" fill="none" stroke="var(--border)" strokeWidth="10"
                strokeDasharray={`${2*Math.PI*84*0.75} ${2*Math.PI*84}`}
                strokeLinecap="round" transform="rotate(135 100 100)" />
              <circle cx="100" cy="100" r="84" fill="none" stroke="url(#hg)" strokeWidth="10"
                strokeDasharray={`${2*Math.PI*84*0.75*0.78} ${2*Math.PI*84}`}
                strokeLinecap="round" transform="rotate(135 100 100)"
                style={{ filter:'drop-shadow(0 0 12px #E8650Acc)', transition:'all 1s ease' }}
              />
              <text x="100" y="94" textAnchor="middle" fill="#FFFFFF" fontSize="36" fontFamily="Syne" fontWeight="800">78%</text>
              <text x="100" y="116" textAnchor="middle" fill="var(--gray-400)" fontSize="11" fontFamily="Inter">Battery Level</text>
              <circle cx="100" cy="135" r="5" fill="#FF8C2A" style={{ animation:'pulse 1.4s ease-in-out infinite' }} />
            </svg>
          </div>
          <div className={styles.visualStats}>
            <div className={styles.vStat}><span className={styles.vNum}>312</span><span className={styles.vLabel}>km range</span></div>
            <div className={styles.vStat}><span className={styles.vNum} style={{color:'var(--green)'}}>⚡</span><span className={styles.vLabel}>Charging</span></div>
            <div className={styles.vStat}><span className={styles.vNum}>87.7</span><span className={styles.vLabel}>kWh cap.</span></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Built for <span className={styles.orange}>serious operators</span></h2>
          <p className={styles.sectionSub}>Everything you need to run a VinFast EV fleet — nothing you don't.</p>
          <div className={styles.featureGrid}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}><Icon size={22} /></div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to electrify your operations?</h2>
          <p className={styles.ctaSub}>Get your fleet on SpeedFast in under 2 minutes.</p>
          <Link to="/register"><Button size="lg">Create free account <ChevronRight size={18} /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Logo size="sm" />
        <span className={styles.footerText}>© {new Date().getFullYear()} SpeedFast · VinFast EV Fleet Platform</span>
      </footer>
    </div>
  )
}
