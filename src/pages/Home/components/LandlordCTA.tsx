import { Container } from '../../../components/layout'
import { Button } from '../../../components/ui'

export function LandlordCTA() {
  return (
    <section className="mx-auto" style={{ maxWidth: 1180, padding: '0 28px 84px' }}>
      <Container>
        <div
          className="bg-green-dark rounded-card grid items-center"
          style={{ padding: '48px 40px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}
        >
          <div>
            <div className="font-bold uppercase text-orange-light" style={{ fontSize: '11.5px', letterSpacing: '.12em', marginBottom: 14 }}>
              For Landlords
            </div>
            <h3 className="font-serif font-semibold text-cream" style={{ fontSize: 28, lineHeight: 1.3, margin: 0 }}>
              List with landlords tenants actually trust — verified tenants, faster fills, one flat fee.
            </h3>
          </div>
          <div className="justify-self-end">
            <Button to="/dashboard" size="lg">
              List Your Property
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
