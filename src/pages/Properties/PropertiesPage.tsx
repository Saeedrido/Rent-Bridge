import { Container } from '../../components/layout'
import { Seo } from '../../components/common'
import { ListingView } from '../../features/properties/components/ListingView'

export default function PropertiesPage() {
  return (
    <>
      <Seo
        title="Property Listings | Rent Bridge"
        description="Browse verified homes for rent and sale across Nigeria. Filter by location, price, bedrooms, amenities and verification status."
        path="/properties"
      />
      <Container className="py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">All listings</h1>
          <p className="mt-2 text-ink/70">Verified homes for rent and sale across Nigeria.</p>
        </header>
        <ListingView />
      </Container>
    </>
  )
}
