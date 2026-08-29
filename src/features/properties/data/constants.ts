import type { PropertyType } from '../types/property'

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'mini-flat', label: 'Mini flat' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'studio', label: 'Studio' },
]

export const AMENITIES: string[] = [
  'Prepaid meter',
  'Borehole water',
  'Gated compound',
  'Security',
  'Parking',
  'Fitted kitchen',
  'Generator',
  'Inverter backup',
  'Air conditioning',
  'Swimming pool',
  'Gym',
  'CCTV',
]
