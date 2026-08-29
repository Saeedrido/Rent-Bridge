import { useState, useRef } from 'react'
import { Seo } from '../../../components/common'
import { SearchIcon, AgreementIcon, ProfileIcon } from '../components/icons'
import { ChevronRightIcon, FileSearchIcon as SharedFileSearchIcon } from './shared'
import { RoleDashboardShell, lawyerNotifications } from './RoleDashboardShell'
import {
  StatusPill,
  PageHeading,
  EmptyState,
  ProfileSection,
  inputClass,
  useToast,
} from './shared'
import {
  NewListing,
  QueueItem,
} from './data'
import { initialNewListings, initialQueue, AGREEMENT_CLAUSES, naira, lawyerUserProfile } from './data'

export function LawyerDashboard() {
  const { show } = useToast()
  const [user, setUser] = useState({
    name: lawyerUserProfile.name,
    email: lawyerUserProfile.email,
    phone: lawyerUserProfile.phone,
  })

  const [activeTab, setActiveTab] = useState<string>('desk')
  const [listings, setListings] = useState<NewListing[]>(initialNewListings)
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue)
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [notes, setNotes] = useState('')

  const tabs = [
    { id: 'desk', label: 'Review desk', Icon: SearchIcon },
    { id: 'current', label: 'Current review', Icon: AgreementIcon },
    { id: 'profile', label: 'Profile', Icon: ProfileIcon },
  ]

  const shellUser = { name: user.name, verifiedLabel: lawyerUserProfile.verifiedLabel, notificationCount: 3 }

  const activeItem = queue.find((q) => q.id === activeReviewId)
  const allChecked = AGREEMENT_CLAUSES.every((_, i) => checked[i])

  // Reset review state when active item changes
  const prevActiveId = useRef(activeReviewId)
  if (prevActiveId.current !== activeReviewId) {
    setChecked({})
    setNotes('')
    prevActiveId.current = activeReviewId
  }

  const handleReview = (listing: NewListing) => {
    const newItem: QueueItem = {
      id: `q${Date.now()}`,
      shortTitle: `${listing.location} \u2014 ${listing.title.split(' ').slice(0, 2).join(' ')}`,
      party: listing.lister,
      landlord: listing.lister,
      rent: listing.rent,
      submitted: 'submitted just now',
      status: 'in-review',
    }
    setQueue((prev) => [newItem, ...prev])
    setListings((prev) => prev.filter((l) => l.id !== listing.id))
    setActiveReviewId(newItem.id)
    setActiveTab('current')
    show('Agreement opened for review')
  }

  const handleOpenQueueItem = (item: QueueItem) => {
    if (item.status === 'in-review') {
      setActiveReviewId(item.id)
      setActiveTab('current')
    }
  }

  const handleRequestChanges = (itemId: string) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId ? { ...q, status: 'waiting' as const, submitted: 'waiting on changes' } : q,
      ),
    )
    setActiveReviewId(null)
    setActiveTab('desk')
    show('Changes requested from the landlord')
  }

  const handleApprove = (itemId: string) => {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId
          ? { ...q, status: 'signed' as const, submitted: `signed ${today.toLowerCase()}` }
          : q,
      ),
    )
    setActiveReviewId(null)
    setActiveTab('desk')
    show('Agreement approved and sent for signature')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'desk':
        return (
          <>
            <PageHeading
              title="Newly listed"
              subtitle="Properties awaiting an agreement review."
            />
            <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] items-start">
              <section aria-label="Newly listed">
                {listings.length === 0 ? (
                  <EmptyState
                    icon={<SharedFileSearchIcon className="text-2xl" />}
                    title="No new listings"
                    body="Properties assigned to you will appear here."
                  />
                ) : (
                  <div className="space-y-3">
                    {listings.map((listing, i) => (
                      <button
                        key={listing.id}
                        type="button"
                        onClick={() => handleReview(listing)}
                        className="anim-rise flex items-center gap-3 sm:gap-4 rounded-xl border border-sage bg-white p-3 sm:p-4 transition-shadow hover:shadow-sm"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <img
                          src={listing.image}
                          alt={listing.title}
                          className="shrink-0 w-20 h-16 sm:w-24 h-18 md:w-28 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-[15px] sm:text-[17px] font-semibold leading-snug text-forest truncate">
                            {listing.title} \u2014 {listing.location}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-mist">
                            Listed by {listing.lister} \u00B7 {naira(listing.rent)}/yr
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-3 sm:px-4 py-2 text-[13px] sm:text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark whitespace-nowrap">
                          Review
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <aside className="w-full lg:sticky lg:top-24 lg:self-start" aria-label="Review queue">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-forest mb-4">Review queue</h2>
                <div className="space-y-3">
                  {queue.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenQueueItem(item)}
                      className={`
                        anim-rise w-full flex items-start justify-between gap-3 rounded-xl border border-sage bg-white p-4
                        transition-colors
                        ${item.status === 'in-review' ? 'cursor-pointer hover:border-forest/40' : ''}
                      `}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[14px] text-ink truncate">{item.shortTitle}</p>
                        <p className="mt-1 text-[12px] sm:text-[13px] text-mist">{item.party} \u00B7 {item.submitted}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusPill
                          tone={
                            item.status === 'in-review' ? 'inreview' :
                            item.status === 'waiting' ? 'waiting' : 'signed'
                          }
                        >
                          {item.status.replace('-', ' ')}
                        </StatusPill>
                        {item.status === 'in-review' && <ChevronRightIcon className="text-mist" />}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )

      case 'current':
        if (!activeItem) {
          return (
            <div className="px-[clamp(16px,4vw,40px)]">
              <PageHeading title="Current review" subtitle="No agreement is currently under review." />
              <EmptyState
                icon={<SharedFileSearchIcon className="text-2xl" />}
                title="No agreement under review"
                body="Pick a property from your Review desk to begin."
                action={
                  <button
                    type="button"
                    onClick={() => setActiveTab('desk')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark"
                  >
                    Go to Review desk
                  </button>
                }
              />
            </div>
          )
        }

        return (
            <div className="px-[clamp(16px,4vw,40px)]">
              <PageHeading title="Current review" subtitle={`${activeItem.shortTitle} \u2014 In review`} />
              <div className="mt-8 space-y-6">
                <div className="rounded-xl border border-sage bg-white p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-forest">{activeItem.shortTitle}</h2>
                      <p className="mt-1 text-sm text-mist">
                        Tenant: {activeItem.party} \u00B7 Landlord: {activeItem.landlord} \u00B7 Rent: {naira(activeItem.rent)}/yr
                      </p>
                      <p className="mt-0.5 text-sm text-mist">Term: 12 months \u00B7 Caution deposit: 1 month</p>
                    </div>
                    <StatusPill tone="inreview">In review</StatusPill>
                  </div>
                </div>

                <div className="rounded-xl border border-sage bg-white">
                  <div className="px-4 sm:px-6 py-4 border-b border-sage-line">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="font-semibold text-ink">Agreement clauses</h3>
                      <span className="text-sm text-mist">
                        {AGREEMENT_CLAUSES.filter((_, i) => checked[i]).length} of {AGREEMENT_CLAUSES.length} verified
                      </span>
                    </div>
                  </div>
                  <ul className="divide-y divide-sage-line">
                    {AGREEMENT_CLAUSES.map((clause, i) => (
                      <li key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 sm:px-6">
                        <label className="flex items-center gap-3 cursor-pointer text-[14px] sm:text-[15px] text-ink">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked[i]}
                            onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                            className={`
                              flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors
                              ${checked[i] ? 'bg-forest border-forest text-white' : 'border-sage hover:border-forest/50'}
                          `}
                        >
                          {checked[i] && (
                            <svg
                              width={20}
                              height={20}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="shrink-0"
                              aria-hidden="true"
                            >
                              <path d="M5 12.5l4.5 4.5L19 7" />
                            </svg>
                          )}
                        </button>
                        {clause}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-sage bg-white p-4 sm:p-6">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-[#374151]">Review notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for the landlord or tenant\u2026"
                    className={`${inputClass} min-h-[96px] resize-y`}
                  />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleRequestChanges(activeItem.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft"
                >
                  Request changes
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(activeItem.id)}
                  disabled={!allChecked}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Approve & request signature
                </button>
              </div>
              {!allChecked && (
                <p className="text-[13px] text-mist text-right sm:text-left">
                  Verify all clauses to enable approval.
                </p>
              )}
            </div>
        </div>
      )
      case 'profile':
        return (
          <>
            <PageHeading title="Profile" />
            <ProfileSection
              initial={user}
              verifiedLabel={lawyerUserProfile.verifiedLabel}
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
      <Seo title="Lawyer Dashboard \u00B7 Rent Bridge" description="Review and manage tenancy agreements" />
      <RoleDashboardShell
        user={shellUser}
        notifications={lawyerNotifications}
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      >
        {renderContent()}
      </RoleDashboardShell>
    </>
  )
}