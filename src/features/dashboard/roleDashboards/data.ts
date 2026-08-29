export interface ManagedProperty {
  id: string
  title: string
  location: string
  rent: number
  beds: number
  baths: number
  typeLabel: string
  image: string
  published: boolean
  description: string
}

export interface InspectionRequest {
  id: string
  tenant: string
  propertyId: string
  slot: string
  status: 'pending' | 'confirmed' | 'declined'
}

export interface AgreementRecord {
  id: string
  propertyTitle: string
  tenant: string
  lawyer: string
  status: 'draft' | 'with-lawyer' | 'signed'
  updated: string
}

export interface PaymentRecord {
  id: string
  tenant: string
  propertyTitle: string
  amount: number
  date: string
  status: 'paid' | 'pending'
}

export type ReviewStatus = 'in-review' | 'waiting' | 'signed'

export interface NewListing {
  id: string
  title: string
  location: string
  lister: string
  rent: number
  image: string
}

export interface QueueItem {
  id: string
  shortTitle: string
  party: string
  landlord: string
  rent: number
  submitted: string
  status: ReviewStatus
}

export const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`

export const landlordProfile = {
  landlord: { name: 'Samuel Okafor', email: 'samuel.okafor@rentbridge.ng', phone: '+234 803 555 0142', verifiedLabel: 'Verified Landlord' },
  caretaker: { name: 'Segun Balogun', email: 'segun.balogun@rentbridge.ng', phone: '+234 802 555 0187', verifiedLabel: 'Verified Caretaker' },
}

export const lawyerUserProfile = {
  name: 'Simisola Adeyemi',
  email: 'barr.simisola@rentbridge.ng',
  phone: '+234 809 555 0311',
  verifiedLabel: 'Verified Lawyer',
}

export const initialProperties: ManagedProperty[] = [
  {
    id: 'lp1',
    title: '2-bedroom flat, newly serviced',
    location: 'Sabo, Yaba',
    rent: 1400000,
    beds: 2,
    baths: 2,
    typeLabel: 'Flat',
    image: '/home1.jpg',
    published: true,
    description:
      'Newly serviced 2-bedroom flat on a quiet street off Herbert Macaulay Way. Prepaid meter, borehole water, secure gate and dedicated parking for one car.',
  },
  {
    id: 'lp2',
    title: '2-bedroom terrace',
    location: 'Gbagada Phase 1',
    rent: 1750000,
    beds: 2,
    baths: 3,
    typeLabel: 'Terrace',
    image: '/home4.jpg',
    published: true,
    description:
      'Well-finished 2-bedroom terrace in a gated estate off Millennium Estate Road. 24-hour security, estate generator and children\u2019s playground.',
  },
]

export const initialInspections: InspectionRequest[] = [
  { id: 'ir1', tenant: 'Chiamaka Obi', propertyId: 'lp1', slot: 'Fri 28 Aug · 10:00 AM', status: 'pending' },
  { id: 'ir2', tenant: 'Emeka Nwosu', propertyId: 'lp1', slot: 'Sat 29 Aug · 2:00 PM', status: 'pending' },
  { id: 'ir3', tenant: 'Fatima Yusuf', propertyId: 'lp1', slot: 'Mon 24 Aug · 9:00 AM', status: 'confirmed' },
  { id: 'ir4', tenant: 'Tunde Alabi', propertyId: 'lp2', slot: 'Sat 29 Aug · 12:30 PM', status: 'pending' },
  { id: 'ir5', tenant: 'Ngozi Okafor', propertyId: 'lp2', slot: 'Sun 30 Aug · 11:00 AM', status: 'pending' },
  { id: 'ir6', tenant: 'Bola Adebayo', propertyId: 'lp2', slot: 'Tue 25 Aug · 4:00 PM', status: 'confirmed' },
]

export const initialAgreements: AgreementRecord[] = [
  {
    id: 'ag1',
    propertyTitle: '2-bedroom flat, newly serviced — Sabo, Yaba',
    tenant: 'Adaeze Okonkwo',
    lawyer: 'Barr. Simisola Adeyemi',
    status: 'with-lawyer',
    updated: 'Updated 12 Aug',
  },
  {
    id: 'ag2',
    propertyTitle: '2-bedroom terrace — Gbagada Phase 1',
    tenant: 'Chinedu Obi',
    lawyer: 'Barr. Simisola Adeyemi',
    status: 'draft',
    updated: 'Updated 10 Aug',
  },
]

export const initialPayments: PaymentRecord[] = [
  {
    id: 'pm1',
    tenant: 'Fatima Yusuf',
    propertyTitle: 'Mini flat, serviced — Surulere',
    amount: 850000,
    date: 'Paid 14 Aug 2026',
    status: 'paid',
  },
  {
    id: 'pm2',
    tenant: 'Chinedu Obi',
    propertyTitle: '2-bedroom terrace — Gbagada Phase 1',
    amount: 875000,
    date: 'Due 5 Sep 2026',
    status: 'pending',
  },
]

export const initialNewListings: NewListing[] = [
  { id: 'nl1', title: '2-bedroom flat, newly serviced', location: 'Sabo, Yaba', lister: 'Emeka Adeyemi', rent: 1400000, image: '/home1.jpg' },
  { id: 'nl2', title: '3-bedroom apartment', location: 'Ogudu, Kosofe', lister: 'Ngozi Eze', rent: 2100000, image: '/home2.jpg' },
  { id: 'nl3', title: 'Mini flat, serviced', location: 'Surulere', lister: 'Bimbo Salami', rent: 850000, image: '/home3.jpg' },
]

export const initialQueue: QueueItem[] = [
  { id: 'q1', shortTitle: 'Sabo, Yaba — 2-bed flat', party: 'Adaeze Okonkwo', landlord: 'Emeka Adeyemi', rent: 1400000, submitted: 'submitted 12 Aug', status: 'in-review' },
  { id: 'q2', shortTitle: 'Gbagada — 2-bed terrace', party: 'Chinedu Obi', landlord: 'Samuel Okafor', rent: 1750000, submitted: 'submitted 12 Aug', status: 'waiting' },
  { id: 'q3', shortTitle: 'Surulere — mini flat', party: 'Halima Bello', landlord: 'Bimbo Salami', rent: 850000, submitted: 'submitted 11 Aug', status: 'waiting' },
  { id: 'q4', shortTitle: 'Ikeja GRA — studio', party: 'Tunde Ajayi', landlord: 'Kunle Adebayo', rent: 1200000, submitted: 'signed 9 Aug', status: 'signed' },
]

export const AGREEMENT_CLAUSES = [
  'Parties & identification verified',
  'Rent amount & payment schedule',
  'Caution deposit clause (1 month)',
  'Service charge & utilities',
  'Notice period & exit terms',
  'Signature & witness lines',
]

export const publishImageCycle = ['/home5.jpg', '/home3.jpg', '/home6.jpg', '/home2.jpg']
