import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { HomeIcon, InspectionsIcon, AgreementIcon, PaymentsIcon, ProfileIcon } from '../components/icons'
import { ClockIcon, CalendarIcon, DownloadIcon } from './shared'
import { SearchIcon } from '../components/icons'
import { RoleDashboardShell, landlordNotifications, caretakerNotifications } from './RoleDashboardShell'
import {
  DashboardModal,
  StatusPill,
  PageHeading,
  EmptyState,
  ProfileSection,
  useToast,
} from './shared'
import {
  ManagedProperty,
  InspectionRequest,
  AgreementRecord,
  PaymentRecord,
} from './data'
import { initialProperties, initialInspections, initialAgreements, initialPayments, naira, landlordProfile } from './data'

const testProperties: ManagedProperty[] = [
  {
    id: 'lp3',
    title: '3-bedroom duplex, newly renovated',
    location: 'Ogudu, Kosofe',
    rent: 2100000,
    beds: 3,
    baths: 3,
    typeLabel: 'Duplex',
    image: '/home2.jpg',
    published: true,
    description: 'Spacious 3-bedroom duplex in a quiet estate off Ogudu Road. Modern fittings, fitted kitchen, borehole water, and generator space.',
  },
  {
    id: 'lp4',
    title: 'Mini flat, fully serviced',
    location: 'Surulere',
    rent: 850000,
    beds: 1,
    baths: 1,
    typeLabel: 'Mini flat',
    image: '/home3.jpg',
    published: true,
    description: 'Cozy mini flat on a calm street in Surulere. Prepaid meter, running water, tiled throughout, and secure compound.',
  },
]

export function LandlordCaretakerDashboard({ role }: { role: 'landlord' | 'caretaker' }) {
  const profile = landlordProfile[role]
  const navigate = useNavigate()

  const [user, setUser] = useState({ name: profile.name, email: profile.email, phone: profile.phone })
  const [activeTab, setActiveTab] = useState<string>('properties')

  const allProperties = [...initialProperties, ...testProperties]
  const [properties, setProperties] = useState<ManagedProperty[]>(allProperties)
  const [inspections, setInspections] = useState<InspectionRequest[]>(initialInspections)
  const [agreements, setAgreements] = useState<AgreementRecord[]>(initialAgreements)
  const [payments] = useState<PaymentRecord[]>(initialPayments)

  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null)

  const { show } = useToast()

  const publishedCount = properties.filter((p) => p.published).length

  // Ensure shellUser uses updated count
  const shellUser = { name: user.name, verifiedLabel: profile.verifiedLabel, notificationCount: 3 }

  const tabs = [
    { id: 'properties', label: 'My properties', Icon: HomeIcon },
    { id: 'inspections', label: 'Inspections', Icon: InspectionsIcon },
    { id: 'agreement', label: 'Agreement', Icon: AgreementIcon },
    { id: 'payments', label: 'Payments', Icon: PaymentsIcon },
    { id: 'profile', label: 'Profile', Icon: ProfileIcon },
  ]

  const togglePublished = (id: string) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
    )
    show('Listing updated')
  }

  const handleUnpublishConfirm = (id: string) => {
    togglePublished(id)
    setUnpublishConfirm(null)
  }

  const handleAcceptInspection = (id: string) => {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'confirmed' as const } : i)))
    show('Inspection confirmed')
  }

  const handleDeclineInspection = (id: string) => {
    setInspections((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'declined' as const } : i)))
    show('Inspection declined')
  }

  const handleSendAgreement = (id: string) => {
    setAgreements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'with-lawyer' as const, updated: 'Updated just now' } : a)),
    )
    show('Sent to Barr. Adeyemi')
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
                        <p className="mt-0.5 text-sm text-mist">{prop?.title}</p>
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
                          onClick={() => show('Agreement PDF downloaded')}
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
        const collected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
        const pending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
        return (
          <>
            <PageHeading title="Payments" subtitle="Rent collected across your listings." />
            <div className="mt-8 rounded-xl border border-sage bg-white p-6 grid grid-cols-2 divide-x divide-sage">
              <div className="px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.07em] text-mist">Collected in 2026</p>
                <p className="mt-1 font-serif text-2xl font-bold text-ink">{naira(collected)}</p>
                <p className="text-sm text-mist">1 payment</p>
              </div>
              <div className="px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.07em] text-mist">Outstanding</p>
                <p className="mt-1 font-serif text-2xl font-bold text-ink">{naira(pending)}</p>
                <p className="text-sm text-mist">1 pending</p>
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

      case 'profile':
        return (
          <>
            <PageHeading title="Profile" />
            <ProfileSection
              initial={user}
              verifiedLabel={profile.verifiedLabel}
              onSave={(data) => setUser(data)}
            />
          </>
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
        notifications={role === 'landlord' ? landlordNotifications : caretakerNotifications}
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      >
        {renderContent()}
      </RoleDashboardShell>
    </>
  )
}

