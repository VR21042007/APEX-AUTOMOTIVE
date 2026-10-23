import { useEffect, useState } from 'react'
import { loadCarModel, subscribeToLoadProgress } from '../lib/carModel'

export function useCarModel() {
  const [state, setState] = useState({
    scene: null,
    progress: 0,
    error: null,
    loading: true,
  })

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToLoadProgress((progress) => {
      if (active) setState((current) => ({ ...current, progress }))
    })

    loadCarModel()
      .then((scene) => {
        if (!active) return
        setState({ scene, progress: 100, error: null, loading: false })
      })
      .catch((error) => {
        if (!active) return
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error : new Error('The 3D experience failed to load.'),
        }))
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return state
}
