import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react'
import { GALLERY } from '../data/content'
import { ArrowLink, Reveal, SectionLabel } from '../components/ui'
import { smoothScrollTo } from '../lib/scroll'

function Lightbox({ index, onClose, onNavigate }) {
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement
    document.body.classList.add('lightbox-open')
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onNavigate(1)
      if (event.key === 'ArrowLeft') onNavigate(-1)
      if (event.key === 'Tab') {
        const dialog = closeRef.current?.closest('[role="dialog"]')
        if (!dialog) return
        const focusable = dialog.querySelectorAll('button')
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('lightbox-open')
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [onClose, onNavigate])

  const item = GALLERY[index]

  return (
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.label}: ${item.caption}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="lightbox__top">
        <span>
          {String(index + 1).padStart(2, '0')} / {String(GALLERY.length).padStart(2, '0')}
        </span>
        <span>{item.label}</span>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose}>
          <span>Close</span>
          <X size={19} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="lightbox__nav lightbox__nav--prev"
        onClick={() => onNavigate(-1)}
        aria-label="Previous image"
      >
        <ArrowLeft size={21} aria-hidden="true" />
      </button>

      <motion.figure
        className="lightbox__figure"
        key={item.src}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={item.src} alt={item.alt} width="1600" height="1100" />
        <figcaption>
          <span>{item.caption}</span>
          <span>APEX / PRIVATE STUDY</span>
        </figcaption>
      </motion.figure>

      <button
        type="button"
        className="lightbox__nav lightbox__nav--next"
        onClick={() => onNavigate(1)}
        aria-label="Next image"
      >
        <ArrowRight size={21} aria-hidden="true" />
      </button>
    </motion.div>
  )
}

export function GallerySection() {
  const [openIndex, setOpenIndex] = useState(null)
  const close = useCallback(() => setOpenIndex(null), [])
  const navigate = useCallback((direction) => {
    setOpenIndex((current) => {
      if (current === null) return current
      return (current + direction + GALLERY.length) % GALLERY.length
    })
  }, [])

  return (
    <section id="gallery" className="gallery section-pad" aria-labelledby="gallery-title">
      <SectionLabel index="03" className="gallery__label">
        Form studies
      </SectionLabel>

      <div className="gallery__intro">
        <Reveal className="gallery__heading">
          <h2 id="gallery-title">
            THE ASTRA,
            <br />
            <em>UNMASKED.</em>
          </h2>
        </Reveal>
        <Reveal className="gallery__intro-copy" delay={0.1}>
          <p>
            Four angles. One intention. A study of proportion, light and the
            spaces between.
          </p>
          <ArrowLink
            href="#contact"
            onClick={(event) => {
              event.preventDefault()
              smoothScrollTo('#contact')
            }}
          >
            Commission a private viewing
          </ArrowLink>
        </Reveal>
      </div>

      <div className="gallery__grid">
        {GALLERY.map((item, index) => (
          <Reveal
            key={item.src}
            className={`gallery-card ${item.className}`}
            delay={(index % 3) * 0.08}
            amount={0.08}
          >
            <button
              type="button"
              className="gallery-card__button"
              onClick={() => setOpenIndex(index)}
              aria-label={`View ${item.label}: ${item.caption}`}
            >
              <div className="gallery-card__media">
                <img
                  src={item.src}
                  alt={item.alt}
                  width="1600"
                  height="1100"
                  loading="lazy"
                />
                <span className="gallery-card__expand" aria-hidden="true">
                  <Expand size={17} strokeWidth={1.4} />
                </span>
                <span className="gallery-card__wash" aria-hidden="true" />
              </div>
              <div className="gallery-card__meta">
                <span>{item.label}</span>
                <span>{item.caption}</span>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <div className="gallery__foot">
        <span>APEX / STUDIO SERIES</span>
        <span>ALL VEHICLES SHOWN IN DEVELOPMENT SPECIFICATION</span>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <Lightbox index={openIndex} onClose={close} onNavigate={navigate} />
        )}
      </AnimatePresence>
    </section>
  )
}
