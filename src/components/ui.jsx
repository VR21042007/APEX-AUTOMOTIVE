import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
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
