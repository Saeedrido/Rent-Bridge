import { Container } from '../../components/layout'
import { Seo } from '../../components/common'
import { ListingView } from '../../features/properties/components/ListingView'
import type { SearchFilters } from '../../features/search/types/search'

export default function BuyPage() {
  const initial: Partial<SearchFilters> = { listingType: 'sale' }
  return (
    <>
      <Seo
        title="Properties for Sale in Nigeria | Rent Bridge"
        description="Buy verified properties across Nigeria with lawyer-reviewed titles and escrow-protected transactions. Browse houses, duplexes and apartments for sale."
        path="/buy"
      />
      <Container className="py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Properties for sale</h1>
          <p className="mt-2 text-ink/70">Verified titles, lawyer review and escrow-protected purchases.</p>
        </header>
        <ListingView initialFilters={initial} />
      </Container>
    </>
  )
}
