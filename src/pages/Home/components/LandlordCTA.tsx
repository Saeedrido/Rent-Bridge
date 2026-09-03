import { Container } from '../../../components/layout'
import { Button } from '../../../components/ui'

export function LandlordCTA() {
  return (
    <section className="mx-auto w-full" style={{ maxWidth: 1180, padding: '0 24px 84px' }}>
      <Container className="w-full">
        <div
          className="bg-green-dark rounded-card grid items-center"
          style={{
            padding: '40px 28px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 28,
          }}
        >
          <div className="min-w-0">
            <div className="font-bold uppercase text-orange-light" style={{ fontSize: '11.5px', letterSpacing: '.12em', marginBottom: 14 }}>
              For Landlords
            </div>
            <h3 className="font-serif font-semibold text-cream" style={{ fontSize: 'clamp(22px, 5vw, 28px)', lineHeight: 1.3, margin: 0 }}>
              List with landlords tenants actually trust — verified tenants, faster fills, one flat fee.
            </h3>
          </div>
          <div className="sm:justify-self-end justify-self-start min-w-0">
            <Button to="/dashboard" size="lg" className="whitespace-nowrap">
              List Your Property
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}