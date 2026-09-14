import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { ChevronLeftIcon, CameraIcon } from '../components/icons'
import { cn } from '../../../utils/cn'
import { RoleDashboardShell, landlordNotifications, caretakerNotifications } from './RoleDashboardShell'
import { HomeIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, ProfileIcon, CheckIcon } from '../components/icons'
import { inputClass, useToast } from './shared'
import { naira } from './data'

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

  const [listingMode, setListingMode] = useState<'rent' | 'sale'>('rent')
  const [paymentPlan, setPaymentPlan] = useState<'outright' | 'installment'>('outright')
  const [realHouseFee, setRealHouseFee] = useState('')
  const [agentFee, setAgentFee] = useState('')

  const [formData, setFormData] = useState({
    listingTitle: '2-bedroom flat, newly serviced',
    address: '14 Herbert Macaulay Way, Sabo, Yaba',
    annualRent: '1400000',
    bedrooms: '2',
    bathrooms: '2',
    apartmentType: '2-bedroom',
    availableFrom: '1 Sept 2026',
    description: 'Borehole water, prepaid meter, gated compound with a resident caretaker.',
    cautionFeeAmount: '140000',
    otherExpenses: 'e.g. service charge ₦60,000 / year',
    accountNumber: '0123456789 · GTBank',
  })

  const [photos, setPhotos] = useState<string[]>([...sampleImages])
  const [cautionFeeActive, setCautionFeeActive] = useState<'yes' | 'no'>('yes')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')

  const totalPackage = (Number(realHouseFee) || 0) + (Number(agentFee) || 0)

  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value) return
    setAmenities((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setAmenityInput('')
  }

  const removeAmenity = (value: string) => {
    setAmenities((prev) => prev.filter((item) => item !== value))
  }

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
              <label className="block text-sm font-semibold text-forest mb-3">Listing purpose</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setListingMode('rent')}
                  className={cn(
                    'flex-1 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                    listingMode === 'rent'
                      ? 'bg-forest text-white'
                      : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                  )}
                >
                  For rent
                </button>
                <button
                  type="button"
                  onClick={() => setListingMode('sale')}
                  className={cn(
                    'flex-1 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                    listingMode === 'sale'
                      ? 'bg-forest text-white'
                      : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                  )}
                >
                  For sale
                </button>
              </div>
            </div>

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
                <label className="block text-sm font-semibold text-forest mb-3">
                  {listingMode === 'rent' ? 'Annual rent (₦)' : 'Sale price (₦)'}
                </label>
                <input
                  type="number"
                  value={formData.annualRent}
                  onChange={(e) => setFormData({ ...formData, annualRent: e.target.value })}
                  className={inputClass}
                  placeholder={listingMode === 'rent' ? '1400000' : '65000000'}
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

            {listingMode === 'sale' && (
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Payment plan</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('outright')}
                    className={cn(
                      'flex-1 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                      paymentPlan === 'outright'
                        ? 'bg-forest text-white'
                        : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                    )}
                  >
                    Outright
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('installment')}
                    className={cn(
                      'flex-1 rounded-lg px-5 py-3 text-[15px] font-semibold transition-colors',
                      paymentPlan === 'installment'
                        ? 'bg-forest text-white'
                        : 'border border-sage bg-white text-[#374151] hover:border-forest hover:bg-sage-soft'
                    )}
                  >
                    Installment
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-forest mb-3">Apartment type</label>
                <TypeableSelect
                  value={formData.apartmentType}
                  onChange={(value) => setFormData({ ...formData, apartmentType: value })}
                  options={apartmentTypes}
                  placeholder="Search or type a type e.g. 2-bedroom"
                />
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

            {role === 'caretaker' && (
              <div className="rounded-xl border border-sage p-6 bg-white">
                <h3 className="font-semibold uppercase tracking-[0.1em] text-[13px] text-forest mb-1">
                  AGENT BREAKDOWN
                </h3>
                <p className="text-sm text-mist mb-6">
                  Set the real house fee and your agent fee for this package.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-forest mb-3">Real House Fee (₦)</label>
                    <input
                      type="number"
                      value={realHouseFee}
                      onChange={(e) => setRealHouseFee(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 1400000"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-forest mb-3">Agent Fee (₦)</label>
                    <input
                      type="number"
                      value={agentFee}
                      onChange={(e) => setAgentFee(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 150000"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-sage-soft flex items-center justify-between px-5 py-4">
                  <span className="font-semibold text-forest">Total Package</span>
                  <span className="text-xl font-bold text-forest">{naira(totalPackage)}</span>
                </div>
              </div>
            )}

            {listingMode === 'rent' && (
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
            )}

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Amenities</label>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addAmenity()
                      }
                    }}
                    className={inputClass}
                    placeholder="e.g. Parking, 24/7 security"
                  />
                </div>
                <button
                  type="button"
                  onClick={addAmenity}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-forest bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:bg-sage-soft"
                >
                  Add
                </button>
              </div>
              {amenities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-2 rounded-full border border-sage bg-white py-1.5 pl-3 pr-2"
                    >
                      <CheckIcon className="text-forest" />
                      <span className="text-sm font-semibold text-ink">{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        aria-label={`Remove ${amenity}`}
                        className="text-mist transition-colors hover:text-flame"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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

function TypeableSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery(value)
      return
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, value])

  const trimmed = query.trim()
  const lower = trimmed.toLowerCase()
  const searching = trimmed !== value
  const filtered = options.filter((o) => {
    if (!searching) return true
    return o.toLowerCase().includes(lower)
  })
  const exactMatch = options.some((o) => o.toLowerCase() === lower)

  const commit = (next: string) => {
    onChange(next)
    setQuery(next)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          if (trimmed) commit(trimmed)
        }}
        placeholder={placeholder}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle apartment types"
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 text-mist transition-transform',
          open && 'rotate-180',
        )}
      >
        <ChevronDownIcon className="w-5 h-5" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-sage bg-white py-1 shadow-lg"
        >
          {filtered.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(option)}
                className={cn(
                  'flex w-full items-center px-3.5 py-2 text-left text-[15px] transition-colors hover:bg-sage-soft',
                  option === value ? 'font-semibold text-green-dark' : 'text-ink',
                )}
              >
                {option === value && <CheckIcon className="mr-2 text-forest" />}
                {option}
              </button>
            </li>
          ))}
          {searching && trimmed && !exactMatch && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(trimmed)}
                className="flex w-full items-center px-3.5 py-2 text-left text-[15px] font-medium text-orange transition-colors hover:bg-sage-soft"
              >
                Use &ldquo;{trimmed}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
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