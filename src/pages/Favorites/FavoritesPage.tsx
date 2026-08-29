import { Container } from '../../components/layout'
import { Seo } from '../../components/common'
import { PropertyCard } from '../../components/common'
import { Button, EmptyState } from '../../components/ui'
import { useFavorites } from '../../features/favorites/hooks/useFavorites'
import { properties } from '../../features/properties/data/properties'

export default function FavoritesPage() {
  const { favorites } = useFavorites()
  const saved = properties.filter((p) => favorites.includes(p.id))

  return (
    <>
      <Seo title="Your Saved Properties | Rent Bridge" description="Properties you saved on Rent Bridge." path="/favorites" />
      <Container className="py-12">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-green-dark md:text-4xl">Saved properties</h1>
          <p className="mt-2 text-ink/70">Homes you’ve bookmarked for later.</p>
        </header>
        {saved.length === 0 ? (
          <EmptyState
            title="No saved properties yet"
            description="Tap the heart on any listing to save it here."
            action={<Button to="/properties">Browse listings</Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </Container>
    </>
  )
}
