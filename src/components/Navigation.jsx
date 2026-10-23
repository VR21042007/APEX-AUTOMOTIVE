import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../data/content'
import { smoothScrollTo } from '../lib/scroll'
import { Wordmark } from './Brand'

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    document.body.classList.add('menu-open')
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const navigate = (event, href) => {
    event.preventDefault()
    setMenuOpen(false)
    window.setTimeout(() => smoothScrollTo(href), menuOpen ? 280 : 0)
  }

  return (
    <>
      <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
        <a
          className="site-header__brand"
          href="#top"
          aria-label="APEX Automotive — back to top"
          onClick={(event) => navigate(event, '#top')}
        >
          <Wordmark />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={(event) => navigate(event, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <a
            className="header-cta"
            href="#contact"
            onClick={(event) => navigate(event, '#contact')}
          >
            <span>Private enquiry</span>
            <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mobile-menu__inner">
              <p className="eyebrow mobile-menu__label">APEX / NAVIGATION</p>
              <nav aria-label="Mobile navigation">
                {NAV_LINKS.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={(event) => navigate(event, link.href)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.055, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mobile-menu__index">0{index + 1}</span>
                    <span>{link.label}</span>
                    <ArrowUpRight size={28} strokeWidth={1.2} aria-hidden="true" />
                  </motion.a>
                ))}
              </nav>
              <motion.div
                className="mobile-menu__foot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <p>Private commissions — by appointment.</p>
                <a href="#contact" onClick={(event) => navigate(event, '#contact')}>
                  Begin a conversation <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <span>ASTRA / 001 &nbsp;·&nbsp; MMXXVI</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
