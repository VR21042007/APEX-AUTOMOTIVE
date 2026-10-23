import { useEffect, useRef, useState } from 'react'
import { Wordmark } from './Brand'

export function Loader({ progress = 0, ready = false, onComplete }) {
  const [display, setDisplay] = useState(0)
  const [minimumElapsed, setMinimumElapsed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  onCompleteRef.current = onComplete

  useEffect(() => {
    document.body.classList.add('is-loading')
    return () => document.body.classList.remove('is-loading')
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let frame
    const tick = () => {
      setDisplay((current) => {
        const target = ready ? 100 : Math.max(7, Math.min(progress, 96))
        const delta = target - current
        if (Math.abs(delta) < 0.35) return target
        return current + delta * 0.08
      })
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [progress, ready])

  useEffect(() => {
    if (!ready || !minimumElapsed || display < 99.5 || leaving) return
    setLeaving(true)
  }, [ready, minimumElapsed, display, leaving])

  useEffect(() => {
    if (!leaving) return undefined
    const timer = window.setTimeout(() => {
      if (completedRef.current) return
      completedRef.current = true
      onCompleteRef.current?.()
    }, 950)
    return () => window.clearTimeout(timer)
  }, [leaving])

  return (
    <div
      className={`loader${leaving ? ' loader--leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading the APEX experience. ${Math.round(display)} percent.`}
    >
      <div className="loader__noise" aria-hidden="true" />
      <div className="loader__top">
        <Wordmark />
        <span className="loader__chapter">ASTRA / 001</span>
      </div>

      <div className="loader__center">
        <p className="loader__eyebrow">A new species of performance</p>
        <div className="loader__counter" aria-hidden="true">
          <span>{String(Math.floor(display)).padStart(3, '0')}</span>
          <sup>%</sup>
        </div>
        <div className="loader__track" aria-hidden="true">
          <span style={{ transform: `scaleX(${display / 100})` }} />
        </div>
      </div>

      <div className="loader__bottom">
        <span>Calibrating the experience</span>
        <span>Scroll / Drive / Discover</span>
      </div>
    </div>
  )
}
