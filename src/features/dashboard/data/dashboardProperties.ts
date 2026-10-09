export interface DashboardProperty {
  id: string
  slug: string
  location: string
  title: string
  price: number
  beds: number
  baths: number
  type: string
  typeLabel: string
  image: string
  verified: boolean
  rentFrequency?: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'
}

export const dashboardProperties: DashboardProperty[] = [
  {
    id: 'd1',
    slug: '2-bedroom-flat-newly-serviced-sabo-yaba',
    location: 'Sabo, Yaba',
    title: '2-bedroom flat, newly serviced',
    price: 1400000,
    beds: 2,
    baths: 2,
    type: '2-bedroom',
    typeLabel: '2-bedroom',
    image: '/home1.jpg',
    verified: true,
  },
  {
    id: 'd2',
    slug: '3-bedroom-apartment-ogudu-kosofe',
    location: 'Ogudu, Kosofe',
    title: '3-bedroom apartment',
    price: 2100000,
    beds: 3,
    baths: 3,
    type: '3-bedroom',
    typeLabel: '3-bedroom',
    image: '/home2.jpg',
    verified: true,
  },
  {
    id: 'd3',
    slug: 'mini-flat-serviced-surulere',
    location: 'Surulere',
    title: 'Mini flat, serviced',
    price: 850000,
    beds: 1,
    baths: 1,
    type: 'mini-flat',
    typeLabel: 'Mini flat',
    image: '/home3.jpg',
    verified: true,
  },
  {
    id: 'd4',
    slug: '2-bedroom-terrace-gbagada-phase-1',
    location: 'Gbagada Phase 1',
    title: '2-bedroom terrace',
    price: 1750000,
    beds: 2,
    baths: 2,
    type: '2-bedroom',
    typeLabel: '2-bedroom',
    image: '/home4.jpg',
    verified: true,
  },
  {
    id: 'd5',
    slug: 'studio-apartment-ikeja-gra',
    location: 'Ikeja GRA',
    title: 'Studio apartment',
    price: 1200000,
    beds: 1,
    baths: 1,
    type: 'self-contained',
    typeLabel: 'Self-contain',
    image: '/home5.jpg',
    verified: true,
  },
  {
    id: 'd6',
    slug: '3-bedroom-duplex-ajah-lekki',
    location: 'Ajah, Lekki',
    title: '3-bedroom duplex',
    price: 2600000,
    beds: 3,
    baths: 4,
    type: 'duplex',
    typeLabel: 'Duplex',
    image: '/home6.jpg',
    verified: true,
  },
]
