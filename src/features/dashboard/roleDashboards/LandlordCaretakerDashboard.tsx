import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { HomeIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, SearchIcon } from '../components/icons'
import { ClockIcon, CalendarIcon, DownloadIcon } from './shared'
import { RoleDashboardShell, type NotificationItem, type ShellUser } from './RoleDashboardShell'
import {
  DashboardModal,
  StatusPill,
  PageHeading,
  EmptyState,
  DataErrorBanner,
  useToast,
} from './shared'
import {
  ManagedProperty,
  InspectionRequest,
  AgreementRecord,
  PaymentRecord,
} from './data'
import { naira } from './data'
import { getMyProperties, type PropertyRecord } from '../../../services/api/propertyApi'
import {
  searchListings,
  unpublishListing,
  publishListing,
  ListingStatus,
  type ListingRecord,
} from '../../../services/api/listingApi'
import { getUser } from '../../../services/api/tokens'
import { refreshProfile } from '../../../services/api/authApi'
import {
  listCallerLeases,
  confirmInspection,
  declineInspection,
  moveToLegalReview,
  getLeaseAgreementPdf,
} from '../../../services/api/leaseApi'
import { getTransactions } from '../../../services/api/dashboardApi'
import { loadWithFallback, apiErrorMessage } from '../../../services/api/fallback'
import {
  leaseToInspectionRequest,
  leaseToAgreementRecord,
  transactionToLandlordPayment,
  isUuid,
} from '../../../services/api/mappers'
import { SettingsContent } from '../settings/SettingsPage'

const roleLabel = (role: 'landlord' | 'caretaker', verified: boolean) => {
  const base = role === 'landlord' ? 'Landlord' : 'Caretaker'
  return verified ? `Verified ${base}` : base
}

function notifTime(slot: string): string {
  return slot ? 'New' : 'Just now'
}

export function LandlordCaretakerDashboard({ role }: { role: 'landlord' | 'caretaker' }) {
  const navigate = useNavigate()
  const authUser = getUser()

  const [user, setUser] = useState({
    name:
      authUser?.name ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      roleLabel(role, false),
    email: authUser?.email || '',
    phone: authUser?.phone || '',
  })
  const [verifiedLabel, setVerifiedLabel] = useState(roleLabel(role, authUser?.verified === true))
  const [activeTab, setActiveTab] = useState<string>('properties')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [properties, setProperties] = useState<ManagedProperty[]>([])
  const [inspections, setInspections] = useState<InspectionRequest[]>([])
  const [agreements, setAgreements] = useState<AgreementRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    let active = true
    refreshProfile().then((profile) => {
      if (!active || !profile) return
      setUser((prev) => ({
        name:
          profile.name ||
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          prev.name,
        email: profile.email || prev.email,
        phone: profile.phone || prev.phone,
      }))
      setVerifiedLabel(roleLabel(role, profile.verified === true))
    })
    return () => {
      active = false
    }
  }, [role])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [mine, listings] = await Promise.all([
          getMyProperties({ Page: 1, PageSize: 50 }),
          searchListings({ Page: 1, PageSize: 50, Mine: true }),
        ])
        if (!active) return
        const byProperty = new Map((mine ?? []).map((p) => [p.id, p]))
        const records = (listings ?? [])
          .filter((l) => byProperty.has(l.propertyId as string))
          .map((l): ManagedProperty => {
            const prop = byProperty.get(String(l.propertyId))
            return propertyFromListing(l, prop)
          })
        setProperties(records)
      } catch (err) {
        const message = apiErrorMessage(err)
        if (active && message) setLoadError(message)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => (await listCallerLeases(1, 50)).map(leaseToInspectionRequest),
      [] as InspectionRequest[],
    ).then((result) => {
      if (active) {
        setInspections(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => (await listCallerLeases(1, 50)).map(leaseToAgreementRecord),
      [] as AgreementRecord[],
    ).then((result) => {
      if (active) {
        setAgreements(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadWithFallback(
      async () => (await getTransactions(1, 50)).map(transactionToLandlordPayment),
      [] as PaymentRecord[],
    ).then((result) => {
      if (active) {
        setPayments(result.data)
        if (result.error) setLoadError(result.error)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null)

  const { show } = useToast()

  const publishedCount = properties.filter((p) => p.published).length

  const notifications: NotificationItem[] = inspections
    .filter((i) => i.status === 'pending')
    .map((i) => {
      const prop = properties.find((p) => p.id === i.propertyId)
      return {
        id: `notif-${i.id}`,
        text: `${i.tenant} requested an inspection of ${prop?.title ?? 'your property'}.`,
        time: notifTime(i.slot),
      }
    })

  const shellUser: ShellUser = {
    name: user.name,
    verifiedLabel,
    notificationCount: notifications.length,
  }

  const tabs = [
    { id: 'properties', label: 'My properties', Icon: HomeIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
  ]

  const togglePublished = async (id: string) => {
    const current = properties.find((p) => p.id === id)
    if (!current) return
    const isRemote = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(id)
    try {
      if (isRemote) {
        if (current.published) await unpublishListing(id)
        else await publishListing(id)
      }
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
      )
      show('Listing updated')
    } catch {
      show('Could not update this listing right now.')
    }
  }

  const handleUnpublishConfirm = (id: string) => {
    togglePublished(id)
    setUnpublishConfirm(null)
  }

  const handleAcceptInspection = async (id: string) => {
    if (isUuid(id)) {
      try {
        await confirmInspection(id)
      } catch {
        show('Could not confirm this inspection right now.')
        return
      }
    }
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'confirmed' as const } : i)))
    show('Inspection confirmed')
  }

  const handleDeclineInspection = async (id: string) => {
    if (isUuid(id)) {
      try {
        await declineInspection(id)
      } catch {
        show('Could not decline this inspection right now.')
        return
      }
    }
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'declined' as const } : i)))
    show('Inspection declined')
  }

  const handleSendAgreement = async (id: string) => {
    if (isUuid(id)) {
      try {
        await moveToLegalReview(id)
      } catch {
        show('Could not send this agreement right now.')
        return
      }
    }
    setAgreements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'with-lawyer' as const, updated: 'Updated just now' } : a)),
    )
    show('Sent to lawyer for review')
  }

  const handleDownloadAgreement = async (id: string) => {
    if (isUuid(id)) {
      try {
        const blob = await getLeaseAgreementPdf(id)
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        window.setTimeout(() => URL.revokeObjectURL(url), 60000)
        return
      } catch {
        show('Could not download the agreement PDF right now.')
        return
      }
    }
    show('Agreement PDF downloaded')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'properties':
        return (
          <>
            <PageHeading
              title="My properties"
              subtitle={`${properties.length} properties \u00B7 ${publishedCount} published`}
              action={
                <button
                  type="button"
                  onClick={() => navigate(role === 'landlord' ? '/dashboard/landlord/publish' : '/dashboard/caretaker/publish')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
                >
                  + Publish another apartment
                </button>
              }
            />
            {properties.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  icon={<HomeIcon className="text-2xl" />}
                  title="No properties yet"
                  body="Publish your first apartment so tenants can find it in search results."
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {properties.map((prop, i) => (
                  <article
                    key={prop.id}
                    className="anim-rise group flex flex-col overflow-hidden rounded-xl border border-sage bg-white transition-shadow hover:shadow-md"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <StatusPill
                        tone={prop.published ? 'published' : 'unpublished'}
                        className="absolute bottom-3 right-3"
                      >
                        {prop.published ? 'PUBLISHED' : 'UNPUBLISHED'}
                      </StatusPill>
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <p className="text-sm text-mist">{prop.location}</p>
                      <h3 className="mt-1 font-serif text-[22px] font-semibold leading-snug text-forest group-hover:underline">
                        {prop.title}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-[22px] font-bold text-ink">{naira(prop.rent)}</span>
                        <span className="text-sm text-mist">/ year</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-mist">
                        <span className="capitalize">{prop.typeLabel}</span>
                        {prop.beds > 0 && <span>· {prop.beds} bed</span>}
                        {prop.baths > 0 && <span>· {prop.baths} bath</span>}
                      </div>
                      <div className="my-5 border-t border-sage-line" />
                      <div className="mt-auto flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUnpublishConfirm(prop.id)
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                        >
                          {prop.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <span className="text-sm text-mist shrink-0">
                          {inspections.filter((ir) => ir.propertyId === prop.id).length} inspection requests
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <DashboardModal open={!!unpublishConfirm} onClose={() => setUnpublishConfirm(null)} title="Unpublish listing?">
              <div className="space-y-2 text-sm text-[#374151]">
                <p>This will hide the listing from search results.</p>
                <p className="font-medium">You can publish it again anytime.</p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUnpublishConfirm(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-sage bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUnpublishConfirm(unpublishConfirm!)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
                >
                  Unpublish
                </button>
              </div>
            </DashboardModal>
          </>
        )

      case 'inspections':
        return (
          <>
            <PageHeading
              title="Inspection requests"
              subtitle={`${inspections.filter((i) => i.status === 'pending').length} awaiting your response`}
            />
            <div className="mt-8 space-y-3">
              {inspections.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="text-2xl" />}
                  title="No inspection requests"
                  body="When prospective tenants request viewings, they will appear here."
                />
              ) : (
                inspections.map((insp) => {
                  const prop = properties.find((p) => p.id === insp.propertyId)
                  return (
                    <div
                      key={insp.id}
                      className="flex flex-col gap-3 rounded-xl border border-sage bg-white p-4 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft font-semibold text-forest">
                        {insp.tenant.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] text-ink truncate">{insp.tenant}</p>
                        <p className="mt-0.5 text-sm text-mist">{prop?.title ?? 'Listing'}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-mist">
                          <ClockIcon /> {insp.slot}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusPill
                          tone={
                            insp.status === 'pending' ? 'pending' :
                            insp.status === 'confirmed' ? 'confirmed' : 'declined'
                          }
                        >
                          {insp.status}
                        </StatusPill>
                        {insp.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptInspection(insp.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-dark"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineInspection(insp.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sage bg-white px-3.5 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )

      case 'agreement':
        return (
          <>
            <PageHeading title="Agreements" subtitle="Tenancy agreements prepared for your listings." />
            <div className="mt-8 space-y-3">
              {agreements.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon className="text-2xl" />}
                  title="No agreements yet"
                  body="Agreements will appear here when a tenant expresses interest in your listing."
                />
              ) : (
                agreements.map((ag) => (
                  <div
                    key={ag.id}
                    className="flex flex-col gap-3 rounded-xl border border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest">
                        <SearchIcon />
                      </span>
                      <div>
                        <p className="font-semibold text-[15px] text-ink">{ag.propertyTitle}</p>
                        <p className="mt-0.5 text-sm text-mist">Tenant: {ag.tenant}</p>
                        <p className="text-sm text-mist">Lawyer: {ag.lawyer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill
                        tone={
                          ag.status === 'draft' ? 'draft' :
                          ag.status === 'with-lawyer' ? 'withlawyer' : 'signed'
                        }
                      >
                        {ag.status.replace('-', ' ')}
                      </StatusPill>
                      <p className="text-sm text-mist shrink-0">{ag.updated}</p>
                      {ag.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleSendAgreement(ag.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                        >
                          Send to lawyer
                        </button>
                      )}
                      {ag.status === 'signed' && (
                        <button
                          type="button"
                          onClick={() => handleDownloadAgreement(ag.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-sage bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                        >
                          <DownloadIcon /> Download
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )

      case 'payments':
        const paid = payments.filter((p) => p.status === 'paid')
        const pendingPmts = payments.filter((p) => p.status === 'pending')
        const collected = paid.reduce((s, p) => s + p.amount, 0)
        const pendingTotal = pendingPmts.reduce((s, p) => s + p.amount, 0)
        return (
          <>
            <PageHeading title="Payments" subtitle="Rent collected across your listings." />
            <div className="mt-8 rounded-xl border border-sage bg-white p-6 grid grid-cols-2 divide-x divide-sage">
              <div className="px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.07em] text-mist">Collected</p>
                <p className="mt-1 font-serif text-2xl font-bold text-ink">{naira(collected)}</p>
                <p className="text-sm text-mist">{paid.length} payment{paid.length === 1 ? '' : 's'}</p>
              </div>
              <div className="px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.07em] text-mist">Outstanding</p>
                <p className="mt-1 font-serif text-2xl font-bold text-ink">{naira(pendingTotal)}</p>
                <p className="text-sm text-mist">{pendingPmts.length} pending</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {payments.map((pm) => (
                <div
                  key={pm.id}
                  className="flex flex-col gap-2 rounded-xl border border-sage bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[15px] text-ink">{pm.tenant}</p>
                    <p className="text-sm text-mist">{pm.propertyTitle}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 shrink-0">
                    <span className="text-sm text-mist">{pm.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[17px] font-bold text-ink shrink-0">{naira(pm.amount)}</span>
                      <StatusPill tone={pm.status === 'paid' ? 'paid' : 'pending'}>{pm.status}</StatusPill>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )

      case 'settings':
        return (
          <SettingsContent
            role={role}
            user={user}
            verifiedLabel={verifiedLabel}
            onProfileSave={setUser}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      <Seo
        title={`${role === 'landlord' ? 'Landlord' : 'Caretaker'} Dashboard \u00B7 Rent Bridge`}
        description="Manage your properties, inspections, agreements and payments"
      />
      <RoleDashboardShell
        user={shellUser}
        notifications={notifications}
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      >
        <DataErrorBanner message={loadError} />
        {renderContent()}
      </RoleDashboardShell>
    </>
  )
}

function propertyFromListing(l: ListingRecord, prop: PropertyRecord | undefined): ManagedProperty {
  const status = Number(l.status)
  const propType = (prop?.propertyType as string) || 'Property'
  const beds = num(prop?.bedrooms ?? prop?.beds)
  const baths = num(prop?.bathrooms ?? prop?.baths)
  return {
    id: l.id ?? String(l.propertyId),
    title: l.title ?? (prop?.title as string) ?? 'Untitled listing',
    location:
      (prop?.location as string) ||
      [(prop?.area as string), (prop?.city as string), (prop?.state as string)].filter(Boolean).join(', ') ||
      (prop?.street as string) ||
      '',
    rent: num(l.priceAmount ?? prop?.price),
    beds,
    baths,
    typeLabel: propType,
    image: (prop?.coverImage as string) ?? (prop?.images as string[] | undefined)?.[0] ?? '/home1.jpg',
    published: status === ListingStatus.Published,
    description: (l.description as string) || (prop?.description as string) || '',
  }
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}