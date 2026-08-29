import { Container } from '../../../components/layout'

const steps = [
  { num: '01', title: 'Discover', desc: 'Browse verified listings.' },
  { num: '02', title: 'Verify', desc: 'Confirm your identity in minutes.' },
  { num: '03', title: 'Lawyer Review', desc: 'A licensed lawyer checks your agreement.' },
  { num: '04', title: 'Move In', desc: 'Sign and move, stress-free.' },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto" style={{ maxWidth: 1180, padding: '84px 28px' }}>
      <Container>
        <h2 className="font-serif font-bold text-green-dark" style={{ fontSize: 'clamp(28px, 3vw, 38px)', letterSpacing: '-.02em', margin: '0 0 40px' }}>
          How it works
        </h2>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 1, background: 'rgba(27,122,62,.16)', border: '1px solid rgba(27,122,62,.16)' }}
        >
          {steps.map((s) => (
            <div key={s.num} className="bg-cream" style={{ padding: '30px 26px' }}>
              <div className="font-serif text-orange" style={{ fontSize: 34, lineHeight: 1, marginBottom: 18 }}>
                {s.num}
              </div>
              <div className="font-semibold text-green-dark" style={{ fontSize: 17, marginBottom: 8 }}>
                {s.title}
              </div>
              <p className="text-ink/70" style={{ fontSize: '14.5px', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
