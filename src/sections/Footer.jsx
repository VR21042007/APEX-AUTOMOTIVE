import { ArrowUp, ArrowUpRight } from 'lucide-react'
import { NAV_LINKS } from '../data/content'
import { smoothScrollTo } from '../lib/scroll'
import { Wordmark } from '../components/Brand'

export function Footer() {
  const scrollTop = (event) => {
    event.preventDefault()
    smoothScrollTo('#top')
  }

  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__eyebrow">APEX AUTOMOTIVE / ASTRA 001</p>
        <p className="footer__statement">
          The road is only
          <br />
          <em>the beginning.</em>
        </p>
        <a
          href="#contact"
          className="footer__contact"
          onClick={(event) => {
            event.preventDefault()
            smoothScrollTo('#contact')
          }}
        >
          Begin a conversation
          <ArrowUpRight size={18} strokeWidth={1.4} aria-hidden="true" />
        </a>
      </div>

      <div className="footer__main">
        <div className="footer__brand">
          <Wordmark />
          <p>
            A fictional automotive marque,
            <br />
            presented as an original design study.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer navigation">
          <span>EXPLORE</span>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => {
                event.preventDefault()
                smoothScrollTo(link.href)
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="footer__info">
          <span>ENQUIRIES</span>
          <a href="mailto:studio@apex.example">studio@apex.example</a>
          <p>
            Coventry, England
            <br />
            By appointment only
          </p>
        </div>

        <button type="button" className="footer__top-button" onClick={scrollTop}>
          <span>Back to top</span>
          <span className="footer__top-icon">
            <ArrowUp size={17} strokeWidth={1.4} aria-hidden="true" />
          </span>
        </button>
      </div>

      <div className="footer__wordmark" aria-hidden="true">
        APEX
      </div>

      <div className="footer__legal">
        <p>
          © MMXXVI APEX Automotive. All rights reserved. This is a fictional
          concept website. Specifications and vehicle details are illustrative.
        </p>
        <p>
          Vehicle model:{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            McLaren P1 model by vecarz, CC BY 4.0
          </a>
          . Adapted for this concept.
        </p>
        <span>DESIGNED FOR THE FEW</span>
      </div>
    </footer>
  )
}
