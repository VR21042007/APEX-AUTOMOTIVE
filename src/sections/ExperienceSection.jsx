import { useEffect, useRef, useState } from 'react'
import { Move3d, RotateCcw } from 'lucide-react'
import { VIEWER_VIEWS } from '../data/content'
import { InteractiveViewer } from '../three/InteractiveViewer'
import { SectionLabel } from '../components/ui'
import { supportsWebGL } from '../lib/scroll'

function ViewerFallback({ unavailable = false }) {
  return (
    <div className="viewer-fallback">
      <img
        src="/images/astra-front.jpg"
        alt="Front three-quarter view of the APEX Astra in a dark studio"
        width="1600"
        height="1100"
      />
      {unavailable && <p>Your browser does not support the interactive 3D viewer.</p>}
    </div>
  )
}

export function ExperienceSection({ model }) {
  const [view, setView] = useState({ name: 'home', nonce: 0 })
  const [isFreeOrbit, setIsFreeOrbit] = useState(false)
  const [inView, setInView] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [webgl] = useState(() => supportsWebGL())
  const viewerRef = useRef(null)

  useEffect(() => {
    const node = viewerRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting) setMounted(true)
    }, {
      rootMargin: '180px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const selectView = (name) => {
    setIsFreeOrbit(false)
    setView((current) => ({ name, nonce: current.nonce + 1 }))
  }

  const available = webgl && Boolean(model)

  return (
    <section id="experience" className="experience section-pad" aria-labelledby="experience-title">
      <SectionLabel index="04" className="experience__label">
        The experience
      </SectionLabel>

      <div className="experience__intro">
        <h2 id="experience-title">
          GET <em>CLOSER.</em>
        </h2>
        <div className="experience__intro-copy">
          <p>
            Walk around the ASTRA from wherever you are. Rotate it, inspect it,
            see how the light finds every surface.
          </p>
          <span>LIVE 3D / RENDERED IN REAL TIME</span>
        </div>
      </div>

      <div
        ref={viewerRef}
        className={`viewer${available ? ' viewer--interactive' : ' viewer--static'}`}
      >
        <div className="viewer__chrome">
          <span className="viewer__live">
            <i />
            ASTRA / 001 — LIVE MODEL
          </span>
          <span>{String(VIEWER_VIEWS.findIndex((item) => item.id === view.name) + 1).padStart(2, '0')} / 04</span>
        </div>

        {available && mounted ? (
          <InteractiveViewer
            model={model}
            active={inView}
            view={view.name}
            viewNonce={view.nonce}
            onOrbitStart={() => setIsFreeOrbit(true)}
          />
        ) : (
          <ViewerFallback unavailable={!available} />
        )}

        <div className="viewer__grid" aria-hidden="true" />

        <div className="viewer__guide">
          <Move3d size={15} strokeWidth={1.4} aria-hidden="true" />
          <span>{isFreeOrbit ? 'Free orbit' : 'Drag to orbit · Scroll to zoom'}</span>
        </div>

        <div className="viewer__controls" role="group" aria-label="Vehicle camera views">
          {VIEWER_VIEWS.map((item) => {
            const selected = !isFreeOrbit && view.name === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={selected ? 'is-active' : ''}
                aria-pressed={selected}
                onClick={() => selectView(item.id)}
                disabled={!available}
              >
                {item.id === 'home' && <RotateCcw size={13} strokeWidth={1.5} aria-hidden="true" />}
                <span>{item.id === 'home' ? 'Reset' : item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="experience__foot">
        <div>
          <span className="eyebrow">Live model</span>
          <p>
            The vehicle above is a real-time 3D asset, not a video or image
            sequence. It moves with you.
          </p>
        </div>
        <div>
          <span className="eyebrow">Controls</span>
          <p>Drag to orbit. Scroll or pinch to zoom. Select a preset to reset the angle.</p>
        </div>
        <div>
          <span className="eyebrow">Bespoke</span>
          <p>Paint, trim, and detail specifications are developed privately with each owner.</p>
        </div>
      </div>

      <p className="experience__credit">
        Live vehicle model: “Mclaren P1 | www.vecarz.com” by vecarz, licensed
        CC BY 4.0 via Sketchfab. Repainted and optimised for the web.
      </p>
    </section>
  )
}
