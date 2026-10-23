import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { SectionLabel } from '../components/ui'

const initialForm = {
  name: '',
  email: '',
  interest: 'Private viewing',
  message: '',
}

const fields = {
  name: {
    label: 'Your name',
    placeholder: 'Full name',
    validate: (value) => (value.trim().length < 2 ? 'Please enter your name.' : ''),
  },
  email: {
    label: 'Email address',
    placeholder: 'name@example.com',
    validate: (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Enter a valid email address.',
  },
  message: {
    label: 'What would you like to discuss?',
    placeholder: 'Tell us a little about what you have in mind.',
    validate: (value) =>
      value.trim().length < 10 ? 'Please add a little more detail.' : '',
  },
}

export function ContactSection() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }))
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    Object.entries(fields).forEach(([name, field]) => {
      const error = field.validate(form[name])
      if (error) nextErrors[name] = error
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus()
      return
    }
    setSubmitted(true)
  }

  return (
    <section id="contact" className="contact section-pad" aria-labelledby="contact-title">
      <SectionLabel index="05" className="contact__label">
        Private enquiries
      </SectionLabel>

      <div className="contact__layout">
        <div className="contact__intro">
          <h2 id="contact-title">
            THE NEXT
            <br />
            STEP IS
            <br />
            <em>PRIVATE.</em>
          </h2>
          <p className="contact__lead">
            The ASTRA / 001 is limited to 199 commissions. Every conversation
            begins in confidence, and on your terms.
          </p>

          <div className="contact__details">
            <div>
              <span>ATELIER</span>
              <p>
                Coventry, England
                <br />
                Visits by appointment
              </p>
            </div>
            <div>
              <span>ENQUIRIES</span>
              <a href="mailto:studio@apex.example">
                studio@apex.example
                <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
              </a>
              <p>Private commissions &amp; press</p>
            </div>
          </div>

          <p className="contact__promise">
            <span className="contact__promise-line" />
            A considered reply, without obligation.
          </p>
        </div>

        <div className="contact__form-wrap">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                className="contact-success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="contact-success__icon">
                  <Check size={25} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <p className="eyebrow">ENQUIRY CAPTURED</p>
                <h3>Thank you, {form.name.split(' ')[0]}.</h3>
                <p>
                  This is a demonstration form, so no information was transmitted
                  or stored. In a production studio, your enquiry would arrive with
                  the APEX private client team.
                </p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSubmitted(false)
                    setForm(initialForm)
                  }}
                >
                  Return to the form <ArrowUpRight size={14} aria-hidden="true" />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                className="enquiry-form"
                onSubmit={submit}
                noValidate
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="enquiry-form__head">
                  <span>PRIVATE CLIENT FORM</span>
                  <span>01 — 04</span>
                </div>

                <div className="form-field">
                  <label htmlFor="name">Your name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={update('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <span className="form-error" id="name-error">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={update('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <span className="form-error" id="email-error">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="interest">I am interested in</label>
                  <div className="select-wrap">
                    <select
                      id="interest"
                      name="interest"
                      value={form.interest}
                      onChange={update('interest')}
                    >
                      <option>Private viewing</option>
                      <option>Commission enquiry</option>
                      <option>Press &amp; media</option>
                      <option>Something else</option>
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="message">What would you like to discuss?</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    placeholder="Tell us a little about what you have in mind."
                    value={form.message}
                    onChange={update('message')}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                  />
                  {errors.message && (
                    <span className="form-error" id="message-error">
                      {errors.message}
                    </span>
                  )}
                </div>

                <button className="form-submit" type="submit">
                  <span>Send private enquiry</span>
                  <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>

                <p className="form-note">
                  Demonstration form — no information is transmitted or stored.
                  By submitting, you agree to a fictional privacy policy.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
