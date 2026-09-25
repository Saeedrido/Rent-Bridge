import { Container } from '../../../components/layout'
import { PropertyCard } from '../../../components/common'
import { Button, Spinner } from '../../../components/ui'
import { DataErrorBanner } from '../../../features/dashboard/roleDashboards/shared'
import { useProperties } from '../../../features/properties/hooks/useProperties'

export function FeaturedListings() {
  const { properties, loading, error } = useProperties()
  const featured = properties.slice(0, 3)

  return (
    <section className="mx-auto" style={{ maxWidth: 1180, padding: '0 28px 84px' }}>
      <Container>
        <h2 className="font-serif font-bold text-green-dark" style={{ fontSize: 'clamp(26px, 3vw, 34px)', letterSpacing: '-.02em', margin: '0 0 28px' }}>
          Verified Listings Near You
        </h2>
        <DataErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Button to="/properties" variant="outline">
            View all listings
          </Button>
        </div>
      </Container>
    </section>
  )
}
