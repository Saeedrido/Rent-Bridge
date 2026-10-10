import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { ChevronLeftIcon, CameraIcon } from '../components/icons'
import { cn } from '../../../utils/cn'
import { RoleDashboardShell, type NotificationItem } from './RoleDashboardShell'
import { HomeIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, CheckIcon } from '../components/icons'
import { inputClass, useToast, DataErrorBanner } from './shared'
import { naira } from './data'
import { createProperty } from '../../../services/api/propertyApi'
import { createListing, publishListing } from '../../../services/api/listingApi'
import { ApiError } from '../../../services/api/client'
import { uploadFile } from '../../../services/api/uploadApi'
import { getUser } from '../../../services/api/tokens'
import { refreshProfile } from '../../../services/api/authApi'
import { listCallerLeases } from '../../../services/api/leaseApi'
import { leaseToInspectionRequest } from '../../../services/api/mappers'
import type { InspectionRequest } from './data'
import { getPayoutAccount } from '../../../services/api/payoutApi'
import { apiErrorMessage } from '../../../services/api/fallback'
import { ExternalLinkIcon } from '../components/icons'

const apartmentTypes = ['1-bedroom', '2-bedroom', '3-bedroom', 'Mini flat', 'Studio', 'Self-contain', 'Duplex', 'Terrace']

export function PublishPropertyPage({ role }: { role: 'landlord' | 'caretaker' }) {
  const authUser = getUser()
  const roleLabel = role === 'landlord' ? 'Landlord' : 'Caretaker'
  const profile = {
    name:
      authUser?.name ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      roleLabel,
    email: authUser?.email || '',
    phone: authUser?.phone || '',
    verifiedLabel: authUser?.verified === true ? `Verified ${roleLabel}` : roleLabel,
  }
  const [verifiedLabel, setVerifiedLabel] = useState(profile.verifiedLabel)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    let active = true
    refreshProfile().then((p) => {
      if (!active || !p) return
      if (p.verified === true) setVerifiedLabel(`Verified ${roleLabel}`)
    })
    listCallerLeases(1, 50)
      .then((leases) => {
        if (!active) return
        setNotifications(
          leases
            .map(leaseToInspectionRequest)
            .filter((i): i is InspectionRequest => i !== null && i.status === 'pending')
            .map((i) => ({
              id: `notif-${i.id}`,
              text: `${i.tenant} requested an inspection of your property.`,
              time: 'New',
            })),
        )
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [role])

  useEffect(() => {
    let active = true
    getPayoutAccount()
      .then((acc) => {
        if (!active) return
        // Backend returns accountNumberLast4 and verifiedAt
        if (acc?.accountNumberLast4 && acc?.verifiedAt) {
          setPayoutAccount({
            bankName: acc.bankName || acc.bankCode || 'Bank',
            accountNumberMasked: acc.accountNumberMasked || `****${acc.accountNumberLast4}`,
          })
        }
        setPayoutLoading(false)
      })
      .catch(() => {
        if (active) setPayoutLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const navigate = useNavigate()
  const { show } = useToast()

  const [listingMode, setListingMode] = useState<'rent' | 'sale'>('rent')
  const [paymentPlan, setPaymentPlan] = useState<'outright' | 'installment'>('outright')
  const [realHouseFee, setRealHouseFee] = useState('')
  const [agentFee, setAgentFee] = useState('')
  const [rentFrequency, setRentFrequency] = useState<'monthly' | 'quarterly' | 'semi-annually' | 'annually'>('annually')

  const [formData, setFormData] = useState({
    listingTitle: '',
    address: '',
    annualRent: '',
    bedrooms: '',
    bathrooms: '',
    apartmentType: '',
    availableFrom: '',
    description: '',
    cautionFeeAmount: '',
    otherExpenses: '',
  })

  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [documents, setDocuments] = useState<string[]>([])
  const [documentLink, setDocumentLink] = useState('')
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [cautionFeeActive, setCautionFeeActive] = useState<'yes' | 'no'>('yes')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [payoutAccount, setPayoutAccount] = useState<{ bankName: string; accountNumberMasked: string } | null>(null)
  const [payoutLoading, setPayoutLoading] = useState(true)

  const MAX_DESCRIPTION_LENGTH = 2000

  const totalPackage = (Number(realHouseFee) || 0) + (Number(agentFee) || 0)

  const validateForm = (): string | null => {
    if (!formData.listingTitle || formData.listingTitle.trim().length < 3) {
      return 'Verification required: Listing title must be at least 3 characters.'
    }
    if (!formData.description || formData.description.trim().length < 10) {
      return 'Verification required: Description must be at least 10 characters.'
    }
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      return `Verification required: Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
    }
    if (documents.length === 0) {
      return 'Verification required: Please attach at least one ownership document before publishing.'
    }
    return null
  }

  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value) return
    setAmenities((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setAmenityInput('')
  }

  const removeAmenity = (value: string) => {
    setAmenities((prev) => prev.filter((item) => item !== value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const validationError = validateForm()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    if (payoutLoading || !payoutAccount) {
      setSubmitError('Add a verified payout bank account before you can publish a listing')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const addressParts = formData.address.split(',').map((part) => part.trim())
      const [street = formData.address, ...rest] = addressParts
      const city = rest[rest.length - 2] ?? rest[0] ?? ''
      const state = rest[rest.length - 1] ?? ''
      const area = rest.length > 2 ? rest[rest.length - 3] : (rest.length === 2 ? rest[0] : '')

      const property = await createProperty({
        street,
        city,
        area,
        state,
        propertyType: formData.apartmentType || undefined,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        availableFrom: formData.availableFrom || undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        documentUrls: documents,
        imageUrls: photos.length > 0 ? photos : undefined,
      })
      const listing = await createListing({
        propertyId: property.id,
        title: formData.listingTitle,
        priceAmount: Number(formData.annualRent) || 0,
        description: formData.description,
        listingType: listingMode,
        paymentPlan,
        rentFrequency: rentFrequency,
        cautionFeeAmount:
          listingMode === 'rent' && cautionFeeActive === 'yes'
            ? Number(formData.cautionFeeAmount) || null
            : null,
        otherExpenses: listingMode === 'rent' && formData.otherExpenses ? formData.otherExpenses : undefined,
        realHouseFeeAmount: role === 'caretaker' ? Number(realHouseFee) || null : null,
        agentFeeAmount: role === 'caretaker' ? Number(agentFee) || null : null,
        imageUrls: photos.length > 0 ? photos : undefined,
      })
      try {
        await publishListing(listing.id)
        show('Listing published successfully')
        navigate(role === 'landlord' ? '/dashboard/landlord' : '/dashboard/caretaker')
      } catch (publishErr) {
        if (publishErr instanceof ApiError && /(identity|payout|verified|verification|ownership|document)/i.test(publishErr.message)) {
          const origin = publishErr.message.includes('Property must be verified') ? 'ownership' : 'profile'
          show(
            origin === 'ownership'
              ? 'Property and documents submitted. Your listing goes live once the lawyer verifies ownership.'
              : 'Listing saved as a draft. Complete identity verification and add a payout account to go live.',
          )
          navigate(role === 'landlord' ? '/dashboard/landlord' : '/dashboard/caretaker')
        } else {
          throw publishErr
        }
      }
    } catch (err) {
      const msg = apiErrorMessage(err) || (err instanceof ApiError ? err.message : 'Failed to publish listing. Please try again.')
      if (/identity|verify|kyc/i.test(msg)) setSubmitError(msg)
      show(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddPhoto = () => {
    if (photos.length >= 6 || uploadingPhoto) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploadingPhoto(true)
      try {
        const url = await uploadFile(file)
        setPhotos((prev) => (prev.length >= 6 ? prev : [...prev, url]))
      } catch (err) {
        show(apiErrorMessage(err) || 'Could not upload photo. Please try again.')
      } finally {
        setUploadingPhoto(false)
      }
    }
    input.click()
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const addDocument = () => {
    const value = documentLink.trim()
    if (!value) return
    if (!/^https?:\/\/\S+$/i.test(value)) {
      setDocumentError('Use a full link that starts with https:// pointing to a hosted copy of the document.')
      return
    }
    if (documents.includes(value)) {
      setDocumentError('That document is already attached.')
      return
    }
    setDocuments((prev) => [...prev, value])
    setDocumentLink('')
    setDocumentError(null)
  }

  const uploadDocumentFile = () => {
    if (uploadingDoc) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf,image/jpeg,image/png,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploadingDoc(true)
      try {
        const url = await uploadFile(file)
        setDocuments((prev) => (prev.includes(url) ? prev : [...prev, url]))
      } catch (err) {
        show(apiErrorMessage(err) || 'Could not upload document. Please try again.')
      } finally {
        setUploadingDoc(false)
      }
    }
    input.click()
  }

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'properties', label: 'My properties', Icon: HomeIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
  ]

  const shellUser = { name: profile.name, verifiedLabel, notificationCount: notifications.length }

  return (
    <div>
      <Seo title="Publish Property · Rent Bridge" description="Publish a new apartment listing" />
      <RoleDashboardShell
        user={shellUser}
        notifications={notifications}
        tabs={tabs}
        active="properties"
        onChange={(id) => navigate(role === 'landlord' ? `/dashboard/${id}` : `/dashboard/caretaker`)}
        settingsTo={role === 'landlord' ? '/dashboard/landlord/settings' : '/dashboard/caretaker/settings'}
      >
        <div className="mt-8 max-w-[1025px]">
          <DataErrorBanner message={submitError} />
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
                className={cn(inputClass, formData.listingTitle && formData.listingTitle.length > 0 && formData.listingTitle.length < 3 && 'border-flame focus:border-flame focus:ring-flame/15')}
                placeholder="e.g. 2-bedroom flat, newly serviced"
              />
              {formData.listingTitle && formData.listingTitle.length > 0 && formData.listingTitle.length < 3 && (
                <span className="mt-1 block text-[13px] font-medium text-[#B42318]">Listing title must be at least 3 characters.</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputClass}
                placeholder="Street, Area, City, State (e.g. 14 Herbert Macaulay Way, Sabo, Yaba, Lagos)"
              />
              <p className="mt-1 text-xs text-mist">Format: Street, Area, City, State — all 4 parts required for accurate location</p>
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
            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Rent frequency</label>
              <select
                value={rentFrequency}
                onChange={(e) => setRentFrequency(e.target.value as 'monthly' | 'quarterly' | 'semi-annually' | 'annually')}
                className={inputClass}
              >
                <option value="annually">Annually (per year)</option>
                <option value="semi-annually">Semi-annually (every 6 months)</option>
                <option value="quarterly">Quarterly (every 3 months)</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="mt-1 text-xs text-mist">How often the tenant pays the rent amount</p>
            </div>
          </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${inputClass} min-h-[140px] resize-y`}
                placeholder="Describe the property features and amenities..."
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={cn(
                  'text-sm',
                  formData.description.length > MAX_DESCRIPTION_LENGTH * 0.9 ? 'text-flame' : 'text-mist'
                )}>
                  {formData.description.length} / {MAX_DESCRIPTION_LENGTH} characters
                </span>
                {formData.description.length > MAX_DESCRIPTION_LENGTH * 0.9 && (
                  <span className="text-sm text-flame font-medium">
                    {formData.description.length > MAX_DESCRIPTION_LENGTH ? 'Exceeded' : 'Approaching limit'}
                  </span>
                )}
              </div>
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
              <label className="block text-sm font-semibold text-forest mb-3">Payout account</label>
              {payoutLoading ? (
                <div className="rounded-lg border border-sage bg-sage-soft/50 p-4 animate-pulse">
                  <div className="h-5 w-3/4 bg-white rounded" />
                </div>
              ) : payoutAccount ? (
                <div className="rounded-lg border border-sage bg-sage-soft/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.07em] text-forest">Linked account</p>
                  <p className="mt-2 font-semibold text-ink">{payoutAccount.bankName}</p>
                  <p className="text-sm text-mist">{payoutAccount.accountNumberMasked}</p>
                  <p className="mt-2 text-xs text-forest">✓ Payout account configured</p>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-flame bg-white p-4">
                  <p className="text-sm text-flame mb-3">No payout account configured</p>
                  <button
                    type="button"
                    onClick={() => navigate(role === 'landlord' ? '/dashboard/landlord/settings' : '/dashboard/caretaker/settings', { state: { scrollTo: 'payout' } })}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
                  >
                    <ExternalLinkIcon className="w-5 h-5" />
                    Add payout account in Settings
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-forest mb-3 flex items-center gap-2">
                Ownership documents
                <ShieldCheckIcon className="w-5 h-5 text-forest" />
              </label>
              <p className="text-sm text-mist mb-4">
                Attach the proof(s) of ownership for this property — Certificate of Occupancy, Deed of Assignment,
                Survey plan, tax receipt or utility bill. A lawyer reviews these documents before your listing can go
                live.
              </p>
              <div className="flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  onClick={uploadDocumentFile}
                  disabled={uploadingDoc}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-forest px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UploadIcon className="w-5 h-5 mr-2" />
                  {uploadingDoc ? 'Uploading…' : 'Upload document'}
                </button>
                <span className="inline-flex items-center px-2 py-2.5 text-sm text-mist">or paste a link</span>
                <div className="flex-1 min-w-[240px] flex items-start gap-3">
                  <div className="flex-1">
                    <input
                      type="url"
                      value={documentLink}
                      onChange={(e) => {
                        setDocumentLink(e.target.value)
                        setDocumentError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addDocument()
                        }
                      }}
                      className={inputClass}
                      placeholder="https:// ... hosted copy of the document"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addDocument}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-forest bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:bg-sage-soft"
                  >
                    Attach
                  </button>
                </div>
              </div>
              {documentError && <p className="mt-2 text-sm text-flame">{documentError}</p>}
              <p className="mt-2 text-xs text-mist">
                At least one document is required. Upload a PDF, JPG or PNG and it is hosted for the lawyer to review.
              </p>
              {documents.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {documents.map((doc, index) => (
                    <div key={doc} className="flex items-center gap-3 rounded-lg border border-sage bg-white px-4 py-3">
                      <ShieldCheckIcon className="w-5 h-5 text-forest shrink-0" />
                      <span className="truncate flex-1 text-sm font-medium text-ink">{doc}</span>
                      <span className="shrink-0 text-xs text-mist">Document {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        aria-label={`Remove document ${index + 1}`}
                        className="shrink-0 text-mist transition-colors hover:text-flame"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                  disabled={photos.length >= 6 || uploadingPhoto}
                  className={cn(
                    'flex-shrink-0 w-[220px] aspect-[4/3] rounded-xl border-2 border-dashed border-sage flex flex-col items-center justify-center gap-3 transition-colors',
                    photos.length >= 6 || uploadingPhoto
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-sage-soft hover:border-forest'
                  )}
                >
                  <CameraIcon className="w-8 h-8 text-forest" />
                  <span className="text-forest font-medium">
                    {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Publishing…' : 'Publish listing'}
            </button>
          </form>
        </div>
</RoleDashboardShell>
    </div>
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

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  )
}