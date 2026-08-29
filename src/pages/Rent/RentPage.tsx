import { Container } from '../../components/layout'
import { Seo } from '../../components/common'
import { ListingView } from '../../features/properties/components/ListingView'
import type { SearchFilters } from '../../features/search/types/search'

export default function RentPage() {
  const initial: Partial<SearchFilters> = { listingType: 'rent' }
  return (
    <>
      <Seo
        title="Homes for Rent in Nigeria | Rent Bridge"
        description="Rent verified homes across Nigeria. Every landlord is NIN-verified and every tenancy agreement is checked by a licensed lawyer."
        path="/rent"
      />
      <Container className="py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Homes for rent</h1>
          <p className="mt-2 text-ink/70">Verified landlords, lawyer-reviewed leases, no agent wahala.</p>
        </header>
        <ListingView initialFilters={initial} />
      </Container>
    </>
  )
}
