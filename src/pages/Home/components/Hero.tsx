import { Container } from '../../../components/layout'
import { SearchBar } from '../../../features/search/components/SearchBar'
import { Button } from '../../../components/ui'

export function Hero() {
  return (
    <section className="text-center" style={{ padding: '72px 28px 56px' }}>
      <Container>
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <h1
            className="font-serif font-bold text-green-dark"
            style={{ fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.12, letterSpacing: '-.025em', margin: '0 0 18px' }}
          >
            Rent a Homes you can trust is verified. Lawyer-Reviewed Leases.
          </h1>
          <p className="text-ink/75 mx-auto" style={{ fontSize: 18, lineHeight: 1.6, margin: '0 auto 30px', maxWidth: '52ch' }}>
            Every landlord verified. Every agreement checked by a real lawyer. No agent wahala.
          </p>
          <SearchBar />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button to="/rent" size="lg">
              Find a verified Home
            </Button>
            <Button to="/dashboard" variant="outline" size="lg">
              List a Property
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
