import { useEffect, useState } from 'react'
import { Loader } from './components/Loader'
import { Navigation } from './components/Navigation'
import { CinematicJourney } from './components/CinematicJourney'
import { Manifesto } from './sections/Manifesto'
import { DesignSection } from './sections/DesignSection'
import { PerformanceSection } from './sections/PerformanceSection'
import { GallerySection } from './sections/GallerySection'
import { ExperienceSection } from './sections/ExperienceSection'
import { ContactSection } from './sections/ContactSection'
import { Footer } from './sections/Footer'
import { useCarModel } from './hooks/useCarModel'

export default function App() {
  const { scene: model, progress, loading } = useCarModel()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      {!entered && (
        <Loader progress={progress} ready={!loading} onComplete={() => setEntered(true)} />
      )}

      <a className="skip-link" href="#story">
        Skip to content
      </a>

      <div className={`site${entered ? ' site--entered' : ''}`}>
        <Navigation />
        <main id="story">
          <CinematicJourney model={model} ready={entered} />
          <Manifesto />
          <DesignSection />
          <PerformanceSection />
          <GallerySection />
          <ExperienceSection model={model} />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  )
}
