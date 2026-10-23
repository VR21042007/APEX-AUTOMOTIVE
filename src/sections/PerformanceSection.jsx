import { ArrowUpRight } from 'lucide-react'
import { PERFORMANCE_ROWS, PERFORMANCE_STATS } from '../data/content'
import { Button, Reveal, SectionLabel } from '../components/ui'
import { smoothScrollTo } from '../lib/scroll'

export function PerformanceSection() {
  return (
    <section id="performance" className="performance section-pad" aria-labelledby="performance-title">
      <div className="performance__watermark" aria-hidden="true">
        850
      </div>

      <SectionLabel index="02" className="performance__label">
        The performance
      </SectionLabel>

      <div className="performance__intro">
        <Reveal className="performance__heading">
          <h2 id="performance-title">
            ENGINEERED
            <br />
            FOR THE <em>EDGE.</em>
          </h2>
        </Reveal>
        <Reveal className="performance__copy" delay={0.12}>
          <p>
            A hybridised twin-turbo V8, an eight-speed dual-clutch gearbox and
            torque vectoring across all four wheels. Not numbers for their own
            sake — a single system for one purpose.
          </p>
          <span className="performance__note">Every drive, transformed.</span>
        </Reveal>
      </div>

      <div className="performance__stats">
        {PERFORMANCE_STATS.map((stat, index) => (
          <Reveal key={stat.label} className="performance-stat" delay={0.06 * index}>
            <span className="performance-stat__index">0{index + 1}</span>
            <div className="performance-stat__value">
              {stat.value}
              <small>{stat.unit}</small>
            </div>
            <span className="performance-stat__label">{stat.label}</span>
          </Reveal>
        ))}
      </div>

      <div className="performance__body">
        <Reveal className="performance__media-wrap">
          <figure className="performance__media">
            <img
              src="/images/astra-rear.jpg"
              alt="Rear three-quarter view of the APEX Astra with its illuminated light blade"
              width="1600"
              height="1100"
              loading="lazy"
            />
            <div className="performance__media-overlay">
              <span>REAR LIGHT BLADE / ACTIVE</span>
              <span>420 KG DOWNFORCE</span>
            </div>
            <figcaption>
              <span className="performance__media-caption">
                <i />
                A signature written in light.
              </span>
              <span>FIG. 03</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="performance__specs">
          <Reveal className="performance__specs-head">
            <p className="eyebrow">TECHNICAL LEDGER</p>
            <h3>The detail behind the feeling.</h3>
          </Reveal>
          <dl className="spec-table">
            {PERFORMANCE_ROWS.map(([term, description], index) => (
              <Reveal key={term} delay={index * 0.035}>
                <div>
                  <dt>{term}</dt>
                  <dd>{description}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
          <Reveal className="performance__cta" delay={0.1}>
            <Button
              variant="outline"
              as="a"
              href="#experience"
              onClick={(event) => {
                event.preventDefault()
                smoothScrollTo('#experience')
              }}
            >
              Explore every angle
            </Button>
            <span className="performance__superscript">
              0.27 CD
              <ArrowUpRight size={13} aria-hidden="true" />
            </span>
          </Reveal>
        </div>
      </div>

      <p className="performance__disclaimer">
        Figures are manufacturer estimates for the ASTRA / 001 development
        prototype. Final production specifications may vary.
      </p>
    </section>
  )
}
