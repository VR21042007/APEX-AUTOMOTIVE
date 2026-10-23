import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { STORY_STAGES } from '../data/content'
import { cinematicState } from '../lib/cinematicState'
import { scrollToPageProgress, smoothScrollTo, supportsWebGL } from '../lib/scroll'
import { CinematicScene } from '../three/CinematicScene'
import { ArrowLink, Button, SectionLabel } from './ui'
import { useReducedMotion } from '../hooks/useMediaQuery'

gsap.registerPlugin(ScrollTrigger)

const STAGE_THRESHOLDS = [0.09, 0.2, 0.3, 0.4, 0.52, 0.64, 0.76, 0.88]

function syncCinematicComposition(frame, progress) {
  if (!frame) return
  const p = Math.max(0, Math.min(1, progress))
  const studioDark = Math.max(0, Math.min(1, (p - 0.46) / 0.11))
  const easedDark = studioDark * studioDark * (3 - 2 * studioDark)
  frame.style.setProperty('--story-progress', `${p * 100}%`)
  frame.style.setProperty('--intro-away', String(Math.max(0, Math.min(1, p / 0.105))))
  frame.style.setProperty('--bright-studio', `${(1 - easedDark) * 100}%`)
  frame.style.setProperty('--studio-opacity', String(1 - easedDark))
}

function getStage(progress) {
  const nextStage = STAGE_THRESHOLDS.findIndex((threshold) => progress < threshold)
  return nextStage === -1 ? STAGE_THRESHOLDS.length : nextStage
}

function StageAnnotation({ stage, active }) {
  if (stage.final) return null
  return (
    <div
      className={`stage-annotation stage-annotation--${stage.id}${active ? ' is-visible' : ''}`}
      aria-hidden="true"
    >
      <span className="stage-annotation__rule" />
      <span>{stage.focusLabel}</span>
    </div>
  )
}

function StoryPanel({ stage, active }) {
  return (
    <article
      className={`story-panel story-panel--${stage.side}${active ? ' is-active' : ''}${
        stage.final ? ' story-panel--final' : ''
      }`}
      aria-hidden={!active}
    >
      <div className="story-panel__inner">
        <SectionLabel index={stage.index}>{stage.label}</SectionLabel>
        <h2 className="story-panel__title">
          {stage.title.map((line, index) => (
            <span key={line} style={{ '--line-index': index }}>
              {line}
            </span>
          ))}
        </h2>
        <p className="story-panel__copy">{stage.paragraph}</p>

        {stage.details.length > 0 && (
          <dl className="story-panel__details">
            {stage.details.map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        )}

        {stage.final && (
          <div className="story-panel__actions">
            <Button
              onClick={(event) => {
                event.preventDefault()
                smoothScrollTo('#design')
              }}
              as="a"
              href="#design"
            >
              Discover the details
            </Button>
            <ArrowLink
              href="#contact"
              light
              onClick={(event) => {
                event.preventDefault()
                smoothScrollTo('#contact')
              }}
            >
              Arrange a private viewing
            </ArrowLink>
          </div>
        )}
      </div>
      <StageAnnotation stage={stage} active={active} />
    </article>
  )
}

export function CinematicJourney({ model, ready }) {
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const frameRef = useRef(null)
  const progressFillRef = useRef(null)
  const [activeStage, setActiveStage] = useState(0)
  const [inView, setInView] = useState(true)
  const [webgl] = useState(() => supportsWebGL())
  const staticMode = reducedMotion || !webgl
  const activeLabel = activeStage === 0 ? 'Front reveal' : STORY_STAGES[activeStage - 1]?.label

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '80px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => ScrollTrigger.refresh(), 120)
    return () => window.clearTimeout(timer)
  }, [ready])

  useLayoutEffect(() => {
    if (staticMode) {
      cinematicState.progress = 0
      setActiveStage(0)
      syncCinematicComposition(frameRef.current, 0)
      if (progressFillRef.current) progressFillRef.current.style.transform = 'scaleX(0)'
      return undefined
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * (window.innerWidth < 780 ? 8 : 7.4)}`,
          pin: frameRef.current,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            window.__apexStory = { start: self.start, end: self.end }
            syncCinematicComposition(frameRef.current, self.progress)
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleX(${self.progress})`
            }
          },
          onUpdate: (self) => {
            syncCinematicComposition(frameRef.current, self.progress)
            const next = getStage(self.progress)
            setActiveStage((current) => (current === next ? current : next))
            if (progressFillRef.current) {
              progressFillRef.current.style.transform = `scaleX(${self.progress})`
            }
          },
        },
      })
      timeline.to(cinematicState, { progress: 1, ease: 'none' }, 0)
    }, sectionRef)

    return () => {
      context.revert()
      window.__apexStory = null
      cinematicState.progress = 0
    }
  }, [staticMode])

  useEffect(() => {
    if (reducedMotion) return undefined
    const onPointerMove = (event) => {
      cinematicState.pointerX = (event.clientX / window.innerWidth) * 2 - 1
      cinematicState.pointerY = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [reducedMotion])

  return (
    <section
      ref={sectionRef}
      id="top"
      className={`cinematic-track${staticMode ? ' cinematic-track--static' : ''}${
        ready ? ' cinematic-track--ready' : ''
      }`}
      aria-label="APEX Astra nine-shot cinematic introduction"
    >
      <div ref={frameRef} className="cinematic-frame" data-stage={activeStage}>
        <div className="cinematic-ambient" aria-hidden="true">
          <span className="cinematic-ambient__orb" />
          <span className="cinematic-ambient__grid" />
          <span className="cinematic-ambient__architecture" />
        </div>

        {webgl && model && ready ? (
          <CinematicScene model={model} active={inView} reduced={reducedMotion} />
        ) : (
          <div className="journey-fallback" aria-hidden="true">
            {(!webgl || (!model && ready)) && <img src="/images/astra-hero.jpg" alt="" />}
          </div>
        )}

        <div className="cinematic-grain" aria-hidden="true" />
        <div className="cinematic-edge cinematic-edge--left" aria-hidden="true" />
        <div className="cinematic-edge cinematic-edge--right" aria-hidden="true" />

        <div className={`hero-stage${activeStage === 0 ? ' is-active' : ''}`} aria-hidden={activeStage !== 0}>
          <div className="hero-stage__top">
            <p className="hero-kicker">
              <span className="hero-kicker__dot" aria-hidden="true" />
              APEX AUTOMOTIVE <span>/</span> ASTRA 001
            </p>
            <p className="hero-edition">Limited series — MMXXVI</p>
          </div>

          <h1 className="hero-title">
            <span className="hero-title__line hero-title__line--one">POWER,</span>
            <span className="hero-title__line hero-title__line--two">
              SCULPTED<span className="hero-title__period">.</span>
            </span>
          </h1>

          <div className="hero-side-note" aria-hidden="true">
              <span>01 / 09</span>
            <span className="hero-side-note__line" />
            <span>A study in motion</span>
          </div>

          <div className="hero-stage__bottom">
            <div className="hero-intro">
              <p>
                The ASTRA / 001. A new species of performance, shaped by air and
                finished without compromise.
              </p>
              <div className="hero-actions">
                <Button
                  as="a"
                  href="#design"
                  onClick={(event) => {
                    event.preventDefault()
                    smoothScrollTo('#design')
                  }}
                >
                  Discover APEX
                </Button>
                <button className="text-button" type="button" onClick={() => scrollToPageProgress(0.215)}>
                  <span>Explore the form</span>
                  <ArrowDown size={15} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>

            <dl className="hero-specs">
              <div>
                <dt>0—100 km/h</dt>
                <dd>2.9<small>s</small></dd>
              </div>
              <div>
                <dt>Top speed</dt>
                <dd>340<small>km/h</small></dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>850<small>hp</small></dd>
              </div>
            </dl>
          </div>

          <button
            className="scroll-cue"
            type="button"
            onClick={() => scrollToPageProgress(0.18)}
            aria-label="Scroll into the APEX story"
          >
            <span className="scroll-cue__track" aria-hidden="true">
              <span className="scroll-cue__dot" />
            </span>
            <span>Scroll to begin</span>
          </button>
        </div>

        {STORY_STAGES.map((stage, index) => (
          <StoryPanel key={stage.id} stage={stage} active={activeStage === index + 1} />
        ))}

        <div className="journey-progress">
          <div className="journey-progress__meta">
            <span>{String(activeStage + 1).padStart(2, '0')} / 09</span>
            <span className="journey-progress__label">{activeLabel}</span>
          </div>
          <span className="journey-progress__track" aria-hidden="true">
            <span ref={progressFillRef} className="journey-progress__fill" />
          </span>
          <span className="journey-progress__brand">ASTRA / 001</span>
        </div>

        <a
          href="#design"
          className="cinematic-scroll-hint"
          aria-label="Skip the cinematic story and continue to the vehicle"
          onClick={(event) => {
            event.preventDefault()
            smoothScrollTo('#design')
          }}
        >
          <span>Skip to the story</span>
          <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
