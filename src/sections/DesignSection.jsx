import { ArrowUpRight } from 'lucide-react'
import { DESIGN_FEATURES } from '../data/content'
import { ArrowLink, Reveal, SectionLabel } from '../components/ui'
import { smoothScrollTo } from '../lib/scroll'

export function DesignSection() {
  return (
    <section id="design" className="design section-pad" aria-labelledby="design-title">
      <SectionLabel index="01" className="design__label">
        The design
      </SectionLabel>

      <div className="design__intro">
        <Reveal className="design__heading">
          <h2 id="design-title">
            FORM MEETS
            <br />
            <em>FUNCTION.</em>
          </h2>
        </Reveal>
        <Reveal className="design__intro-copy" delay={0.1}>
          <p>
            A low, cab-rear silhouette wraps the carbon monocoque in one
            uninterrupted gesture. The ASTRA does not wear its engineering. It is
            shaped by it.
          </p>
          <ArrowLink
            href="#gallery"
            onClick={(event) => {
              event.preventDefault()
              smoothScrollTo('#gallery')
            }}
          >
            View the form studies
          </ArrowLink>
        </Reveal>
      </div>

      <div className="design__visual">
        <Reveal className="design-figure__wrap">
          <figure className="design-figure">
            <div className="design-figure__media">
              <img
                src="/images/astra-side.jpg"
                alt="Profile view of the APEX Astra, its orange bodywork reflecting studio light"
                width="1600"
                height="1100"
                loading="lazy"
              />
              <span className="design-figure__index">FIG. 01</span>
              <span className="design-figure__target" aria-hidden="true">
                <i />
              </span>
            </div>
            <figcaption>
              <span>ASTRA / 001 — PROFILE</span>
              <span>2,658 MM WHEELBASE</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="design__features">
          {DESIGN_FEATURES.map((feature, index) => (
            <Reveal key={feature.index} className="design-feature" delay={0.08 + index * 0.08}>
              <div className="design-feature__head">
                <span>{feature.index}</span>
                <ArrowUpRight size={17} strokeWidth={1.3} aria-hidden="true" />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="design__detail-band">
        <Reveal className="design__detail-copy">
          <p className="eyebrow">MATERIAL STUDY / 02</p>
          <h3>
            Tension, held
            <br />
            <em>at rest.</em>
          </h3>
        </Reveal>
        <Reveal className="design__detail-image" delay={0.12}>
          <img
            src="/images/astra-detail.jpg"
            alt="Detail view of the APEX Astra's forged wheel, orange brake caliper, and sculpted side intake"
            width="1600"
            height="1100"
            loading="lazy"
          />
        </Reveal>
        <Reveal className="design__detail-note" delay={0.18}>
          <span className="design__detail-number">01</span>
          <p>
            Hand-finished carbon. Forged aluminium. A surface designed to be
            touched, not simply seen.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
