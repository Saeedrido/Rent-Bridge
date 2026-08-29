import { Container } from '../../../components/layout'
import { Button } from '../../../components/ui'

export function FinalCTA() {
  return (
    <section className="bg-green-dark" style={{ padding: '72px 28px 40px' }}>
      <Container>
        <div className="text-center" style={{ paddingBottom: 56 }}>
          <p className="font-serif text-cream" style={{ fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.25, margin: '0 0 26px' }}>
            Renting shouldn’t be a gamble.
          </p>
          <Button to="/register" size="lg">
            Get Started
          </Button>
        </div>
      </Container>
    </section>
  )
}
