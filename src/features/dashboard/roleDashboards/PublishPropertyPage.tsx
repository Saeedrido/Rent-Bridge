import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { ChevronLeftIcon, CameraIcon } from '../components/icons'
import { cn } from '../../../utils/cn'
import { RoleDashboardShell, landlordNotifications, caretakerNotifications } from './RoleDashboardShell'
import { HomeIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, ProfileIcon } from '../components/icons'
import { inputClass, useToast } from './shared'

const apartmentTypes = ['1-bedroom', '2-bedroom', '3-bedroom', 'Mini flat', 'Studio', 'Self-contain', 'Duplex', 'Terrace']

const sampleImages = [
  '/home1.jpg',
  '/home4.jpg',
  '/home2.jpg',
]

export function PublishPropertyPage({ role }: { role: 'landlord' | 'caretaker' }) {
  const profile = role === 'landlord' 
    ? { name: 'Adaeze Okonkwo', email: 'adaeze.okonkwo@rentbridge.ng', phone: '+234 803 555 0142', verifiedLabel: 'Verified Landlord' }
    : { name: 'Segun Balogun', email: 'segun.balogun@rentbridge.ng', phone: '+234 802 555 0187', verifiedLabel: 'Verified Caretaker' }

  const navigate = useNavigate()
  const { show } = useToast()

  const [formData, setFormData] = useState({
    listingTitle: '2-bedroom flat, newly serviced',
    address: '14 Herbert Macaulay Way, Sabo, Yaba',
    annualRent: '1400000',
    bedrooms: '2',
    bathrooms: '2',
    apartmentType: '2-bedroom',
    availableFrom: '1 Sept 2026',
    description: 'Borehole water, prepaid meter, gated compound with a resident caretaker.',
    hasCautionFee: true,
    cautionFeeAmount: '140000',
    otherExpenses: 'e.g. service charge ₦60,000 / year',
    accountNumber: '0123456789 · GTBank',
  })

  const [photos, setPhotos] = useState<string[]>([...sampleImages])
  const [cautionFeeActive, setCautionFeeActive] = useState<'yes' | 'no'>('yes')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    show('Listing published successfully')
    navigate(role === 'landlord' ? '/dashboard/landlord' : '/dashboard/caretaker')
  }

  const handleAddPhoto = () => {
    if (photos.length >= 6) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPhotos((prev) => [...prev, event.target?.result as string])
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'properties', label: 'My properties', Icon: HomeIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
    { id: 'profile', label: 'Profile', Icon: ProfileIcon },
  ]

  const shellUser = { name: profile.name, verifiedLabel: profile.verifiedLabel, notificationCount: 3 }
  const notifications = role === 'landlord' ? landlordNotifications : caretakerNotifications

  return (
    <>
      <Seo title="Publish Property · Rent Bridge" description="Publish a new apartment listing" />
      <RoleDashboardShell
        user={shellUser}
        notifications={notifications}
        tabs={tabs}
        active="properties"
        onChange={(id) => navigate(role === 'landlord' ? `/dashboard/${id}` : `/dashboard/caretaker`)}
      >
        <div className="mt-8 max-w-[1025px]">
          <Link
            to={role === 'landlord' ? '/dashboard/landlord' : '/dashboard/caretaker'}
            className="inline-flex items-center gap-1.5 text-forest font-medium hover:underline mb-6"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to my properties
          </Link>

          <h1 className="font-serif text-3xl font-bold text-forest mb-10">Property details</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-sage p-6 md:p-10 space-y-8">
            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Listing title</label>
              <input
                type="text"
                value={formData.listingTitle}
                onChange={(e) => setFormData({ ...formData, listingTitle: e.target.value })}
                className={inputClass}
                placeholder="e.g. 2-bedroom flat, newly serviced"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputClass}
                placeholder="e.g. 14 Herbert Macaulay Way, Sabo, Yaba"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Annual rent (₦)</label>
                <input
                  type="number"
                  value={formData.annualRent}
                  onChange={(e) => setFormData({ ...formData, annualRent: e.target.value })}
                  className={inputClass}
                  placeholder="1400000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className={inputClass}
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className={inputClass}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Apartment type</label>
                <div className="relative">
                  <select
                    value={formData.apartmentType}
                    onChange={(e) => setFormData({ ...formData, apartmentType: e.target.value })}
                    className={`${inputClass} appearance-none pr-12`}
                  >
                    {apartmentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-mist">
                    <ChevronDownIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Available from</label>
                <input
                  type="text"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  className={inputClass}
                  placeholder="1 Sept 2026"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} min-h-[140px] resize-y`}
                placeholder="Describe the property features and amenities..."
              />
            </div>

            <div className="rounded-xl border border-sage p-6 bg-white">
              <h3 className="font-semibold uppercase tracking-[0.1em] text-[13px] text-forest mb-6">
                CAUTION FEE & OTHER EXPENSES
              </h3>

              <p className="text-sm font-semibold text-forest mb-3">Is there a caution fee?</p>
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setCautionFeeActive('yes')}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                    cautionFeeActive === 'yes'
                      ? 'bg-forest text-white'
                      : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setCautionFeeActive('no')}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                    cautionFeeActive === 'no'
                      ? 'bg-forest text-white'
                      : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                  )}
                >
                  No
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-forest mb-3">How much? (₦)</label>
                  <input
                    type="number"
                    value={formData.cautionFeeAmount}
                    onChange={(e) => setFormData({ ...formData, cautionFeeAmount: e.target.value })}
                    className={inputClass}
                    placeholder="140000"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-forest mb-3">Other expenses</label>
                  <input
                    type="text"
                    value={formData.otherExpenses}
                    onChange={(e) => setFormData({ ...formData, otherExpenses: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. service charge ₦60,000 / year"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Account number for payouts</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className={inputClass}
                placeholder="0123456789 · GTBank"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3 flex items-center gap-2">
                Photos of the house
                <CameraIcon className="w-5 h-5" />
              </label>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative flex-shrink-0 w-[220px] aspect-[4/3] rounded-xl overflow-hidden">
                    <img
                      src={photo}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {photos.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removePhoto(index) }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                        aria-label="Remove photo"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={photos.length >= 6}
                  className={cn(
                    'flex-shrink-0 w-[220px] aspect-[4/3] rounded-xl border-2 border-dashed border-sage flex flex-col items-center justify-center gap-3 transition-colors',
                    photos.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sage-soft hover:border-forest'
                  )}
                >
                  <CameraIcon className="w-8 h-8 text-forest" />
                  <span className="text-forest font-medium">+ Add photo</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark"
            >
              Publish listing
            </button>
          </form>
        </div>
      </RoleDashboardShell>
    </>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}