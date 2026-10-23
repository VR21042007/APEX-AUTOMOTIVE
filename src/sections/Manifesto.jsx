import { Reveal, SectionLabel } from '../components/ui'

const marqueeItems = ['APEX ASTRA 001', '850 HP', '340 KM/H', 'ALL-WHEEL DRIVE', 'LIMITED TO 199']

function MotionStamp() {
  return (
    <div className="motion-stamp" aria-hidden="true">
      <svg viewBox="0 0 160 160">
        <defs>
          <path
            id="stamp-circle"
            d="M 80, 80 m -61, 0 a 61,61 0 1,1 122,0 a 61,61 0 1,1 -122,0"
          />
        </defs>
        <text>
          <textPath href="#stamp-circle" startOffset="0%">
            FORM FOLLOWS FEELING · APEX AUTOMOTIVE · ASTRA 001 ·
          </textPath>
        </text>
      </svg>
      <span className="motion-stamp__core">
        <svg viewBox="0 0 36 36">
          <path d="M4 31 15.3 6h5.4L32 31h-7l-1.9-4.6H12.9L11 31H4Zm10.8-10h3.4L16.5 15l-1.7 6Z" fill="currentColor" />
        </svg>
      </span>
    </div>
  )
}

export function Manifesto() {
  return (
    <>
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-strip__track">
          {[0, 1].map((group) => (
            <div className="marquee-strip__group" key={group}>
              {marqueeItems.map((item) => (
                <span key={`${group}-${item}`}>
                  {item}
                  <i />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="manifesto section-pad" id="philosophy">
        <SectionLabel index="00" className="manifesto__label">
          The philosophy
        </SectionLabel>

        <div className="manifesto__layout">
          <Reveal className="manifesto__statement">
            <h2>
              NOTHING ADDED.
              <br />
              <em>Nothing left to chance.</em>
            </h2>
          </Reveal>

          <Reveal className="manifesto__body" delay={0.12}>
            <p className="manifesto__lead">
              True luxury is not excess. It is the confidence to remove everything
              that does not serve the whole.
            </p>
            <p>
              APEX was founded on a single conviction: a car should feel inevitable.
              Every surface, every material, every system in the ASTRA / 001 exists
              because the one beside it demanded it. The result is not a collection
              of features. It is a single, coherent sensation.
            </p>
            <div className="manifesto__signature">
              <span className="manifesto__signature-line" />
              <span>Elena Voss, Founder</span>
            </div>
          </Reveal>

          <Reveal className="manifesto__aside" delay={0.2}>
            <MotionStamp />
            <p className="manifesto__quote">
              “We did not set out to make a faster car. We set out to make a more
              honest one.”
            </p>
          </Reveal>
        </div>

        <div className="manifesto__foot">
          <span>EST. MMXXI</span>
          <span>COVENTRY, ENGLAND</span>
          <span>BY APPOINTMENT ONLY</span>
        </div>
      </section>
    </>
  )
}
