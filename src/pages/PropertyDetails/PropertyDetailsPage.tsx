import { useParams } from 'react-router-dom'
import { Container } from '../../components/layout'
import { Seo, PropertyCard, Breadcrumbs } from '../../components/common'
import { Spinner, EmptyState } from '../../components/ui'
import { useProperty } from '../../features/properties/hooks/useProperty'
import { properties } from '../../features/properties/data/properties'
import { PropertyGallery } from '../../features/properties/components/PropertyGallery'
import { PropertyHeader } from '../../features/properties/components/PropertyHeader'
import { PropertyInfo } from '../../features/properties/components/PropertyInfo'
import { PropertyAmenities } from '../../features/properties/components/PropertyAmenities'
import { PropertyLocation } from '../../features/properties/components/PropertyLocation'
import { PropertyActions } from '../../features/properties/components/PropertyActions'

export default function PropertyDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { property, loading } = useProperty(slug)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!property) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Property not found"
          description="This listing may have been rented or removed."
          action={<a href="/properties" className="text-orange font-medium hover:underline">Back to listings</a>}
        />
      </Container>
    )
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': property.propertyType === 'house' || property.propertyType === 'duplex' ? 'SingleFamilyResidence' : 'Apartment',
    name: property.title,
    description: property.description,
    url: window.location.href,
    image: property.coverImage,
    numberOfRooms: property.beds,
    numberOfBathroomsTotal: property.baths,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressRegion: property.state,
      addressCountry: 'NG',
    },
    ...(property.listingType === 'rent'
      ? { leaseLength: 'P1Y', priceCurrency: 'NGN', price: property.price }
      : { priceCurrency: 'NGN', price: property.price }),
  }

  const related = properties.filter((p) => p.id !== property.id && p.city === property.city).slice(0, 3)

  return (
    <>
      <Seo
        title={`${property.title} in ${property.location} | Rent Bridge`}
        description={`View this verified ${property.title.toLowerCase()} ${property.listingType === 'rent' ? 'for rent' : 'for sale'} in ${property.location}, ${property.city}. ${property.beds} beds, ${property.baths} baths. ${property.description.slice(0, 90)}…`}
        path={`/properties/${property.slug}`}
        image={property.coverImage}
        type="article"
        jsonLd={jsonLd}
      />
      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Listings', to: '/properties' },
            { label: property.title },
          ]}
        />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <PropertyGallery images={property.images} />
            <PropertyHeader property={property} />
            <PropertyInfo description={property.description} />
            <PropertyAmenities amenities={property.amenities} />
            <PropertyLocation property={property} />
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PropertyActions property={property} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-2xl font-semibold text-green-dark">More in {property.city}</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  )
}
