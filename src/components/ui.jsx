import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { animate, motion, useInView } from 'motion/react'
import { useReducedMotion } from '../hooks/useMediaQuery'

const ease = [0.22, 1, 0.36, 1]

export function Reveal({
  children,
  className = '',
  delay = 0,
  amount = 0.2,
  once = true,
  y = 32,
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  )
}

// Counts from zero to `value` the first time it scrolls into view. The final
// value reserves the width, so the unit beside it never shifts, and screen
// readers get the final figure straight away.
export function CountUp({ value, delay = 0, duration = 2.4, className = '' }) {
  const ref = useRef(null)
  const liveRef = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduced = useReducedMotion()
  const target = Number.parseFloat(value)
  const decimals = (String(value).split('.')[1] || '').length

  useEffect(() => {
    const live = liveRef.current
    if (!live || Number.isNaN(target)) return undefined
    if (reduced) {
      live.textContent = value
      return undefined
    }
    if (!inView) {
      live.textContent = (0).toFixed(decimals)
      return undefined
    }
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (latest) => {
        live.textContent = latest.toFixed(decimals)
      },
      onComplete: () => {
        live.textContent = value
      },
    })
    return () => controls.stop()
  }, [inView, reduced, target, decimals, value, delay, duration])

  return (
    <span ref={ref} className={`count-up${inView || reduced ? ' is-counted' : ''} ${className}`.trim()}>
      <span className="count-up__ghost" aria-hidden="true">{value}</span>
      <span ref={liveRef} className="count-up__live" aria-hidden="true">
        {reduced ? value : (0).toFixed(decimals)}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  )
}

export function SectionLabel({ index, children, className = '' }) {
  return (
    <p className={`section-label ${className}`.trim()}>
      {index && <span className="section-label__index">{index}</span>}
      <span>{children}</span>
      <span className="section-label__rule" aria-hidden="true" />
    </p>
  )
}

export function ArrowLink({ href, children, className = '', onClick, light = false }) {
  return (
    <a
      href={href}
      className={`arrow-link${light ? ' arrow-link--light' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      <span className="arrow-link__text">{children}</span>
      <span className="arrow-link__icon" aria-hidden="true">
        <ArrowUpRight size={17} strokeWidth={1.5} />
      </span>
    </a>
  )
}

export function Button({
  as = 'button',
  href,
  children,
  variant = 'solid',
  icon = true,
  className = '',
  ...props
}) {
  const Tag = as === 'a' ? 'a' : 'button'
  return (
    <Tag
      className={`button button--${variant} ${className}`.trim()}
      href={href}
      {...(Tag === 'button' ? { type: props.type || 'button' } : {})}
      {...props}
    >
      <span>{children}</span>
      {icon && <ArrowUpRight size={17} strokeWidth={1.6} aria-hidden="true" />}
    </Tag>
  )
}
