export type ListingType = 'rent' | 'sale'

export type RentFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'annually'

export type PropertyType = 'flat' | 'apartment' | 'house' | 'mini-flat' | 'duplex' | 'studio'

export interface PropertyImage {
  id: string
  url: string
  alt: string
}

export interface Landlord {
  id: string
  name: string
  role: string
  verified: boolean
  phone?: string
  avatar?: string
  rating?: number
}

export interface Property {
  id: string
  slug: string
  title: string
  listingType: ListingType
  propertyType: PropertyType
  location: string
  city: string
  state: string
  price: number
  beds: number
  baths: number
  area?: number
  rentFrequency?: RentFrequency
  verified: boolean
  description: string
  amenities: string[]
  images: PropertyImage[]
  coverImage: string
  landlord: Landlord
  coordinates?: { lat: number; lng: number }
  featured?: boolean
  createdAt: string
}
