import { Container } from '../../../components/layout'
import { SearchBar } from '../../../features/search/components/SearchBar'
import { Button } from '../../../components/ui'

export function Hero() {
  return (
    <section className="relative text-center landing-hero-enter" style={{ padding: '72px 28px 56px' }}>
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green/10 landing-glow-pulse blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-orange/5 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      </div>
      
      <Container>
        <div className="mx-auto relative z-10" style={{ maxWidth: 900 }}>
          <h1
            className="font-serif font-bold text-green-dark landing-text-reveal"
            style={{ fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.12, letterSpacing: '-.025em', margin: '0 0 18px' }}
          >
            Rent a Homes you can trust is verified. Lawyer-Reviewed Leases.
          </h1>
          <p className="text-ink/75 mx-auto landing-text-reveal landing-delay-1" style={{ fontSize: 18, lineHeight: 1.6, margin: '0 auto 30px', maxWidth: '52ch' }}>
            Every landlord verified. Every agreement checked by a real lawyer. No agent wahala.
          </p>
          <SearchBar className="landing-search-slide landing-delay-2" />
          <div className="mt-6 flex flex-wrap justify-center gap-3 landing-cta-pop landing-delay-3">
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
