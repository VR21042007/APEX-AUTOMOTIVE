export function smoothScrollTo(target, options = {}) {
  if (typeof window === 'undefined') return
  const element = typeof target === 'string' ? document.querySelector(target) : target
  if (!element) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: options.block || 'start',
  })
}

export function scrollToPageProgress(progress) {
  if (typeof window === 'undefined') return
  const story = window.__apexStory
  if (!story) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = story.start + (story.end - story.start) * progress
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
}

export function supportsWebGL() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch {
    return false
  }
}
