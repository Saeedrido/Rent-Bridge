import { useEffect, useState } from 'react'
import { Seo } from '../../../components/common'
import { useToast, PageHeading, StatusPill, EmptyState, Field, inputClass, cn, DataErrorBanner } from './shared'
import { RoleDashboardShell, type NotificationItem } from './RoleDashboardShell'
import {
  EMPTY_ADMIN_METRICS,
  EMPTY_FEE_SETTINGS,
  ADMIN_VERIFIED_LABEL,
  AdminLawyerRecord,
  AdminListingRecord,
  AdminDashboardMetrics,
  TransactionPoint,
  LawyerApprovalStatus,
  AdminListingStatus,
} from './adminData'
import { naira } from './data'
import { getUser } from '../../../services/api/tokens'
import { refreshProfile } from '../../../services/api/authApi'
import { ApiError } from '../../../services/api/client'
import { apiErrorMessage } from '../../../services/api/fallback'
import {
  extractArray,
  adminDashboardToMetrics,
  adminTransactionToPoint,
  adminLawyerToRecord,
  adminListingToRecord,
  adminFeeSettingsToRecord,
  isUuid,
} from '../../../services/api/mappers'
import {
  getAdminDashboard,
  getAdminTransactionMetrics,
  getLawyers,
  getAdminListings,
  getFeeSettings,
  updateFeeSettings,
  verifyLawyer,
  suspendLawyer,
  rejectLawyer,
} from '../../../services/api/adminApi'
import { publishListing, unpublishListing, closeListing } from '../../../services/api/listingApi'
import { MetricsGranularity } from '../../../services/api/dashboardApi'
import { SettingsContent } from '../settings/SettingsPage'
import { OwnershipReviewQueue } from './OwnershipReviewQueue'

export function AdminDashboard() {
  const { show } = useToast()
  const authUser = getUser()
  const [user, setUser] = useState({
    name:
      authUser?.name ||
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') ||
      authUser?.email?.split('@')[0] ||
      'Administrator',
    email: authUser?.email || '',
    phone: authUser?.phone || '',
  })

  const [activeTab, setActiveTab] = useState<string>('overview')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(EMPTY_ADMIN_METRICS)
  const [series, setSeries] = useState<TransactionPoint[]>([])
  const [lawyers, setLawyers] = useState<AdminLawyerRecord[]>([])
  const [listings, setListings] = useState<AdminListingRecord[]>([])
  const [fees, setFees] = useState(EMPTY_FEE_SETTINGS)
  const [feesDirty, setFeesDirty] = useState(false)
  const [lawyerFilter, setLawyerFilter] = useState<LawyerApprovalStatus | 'all'>('all')
  const [listingFilter, setListingFilter] = useState<AdminListingStatus | 'all' | 'pending'>('all')

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
    })
    return () => {
      active = false
    }
  }, [])

  const notifications: NotificationItem[] = [
    ...(metrics.pendingLawyers > 0
      ? [{
          id: 'n-lawyers',
          text: `${metrics.pendingLawyers} lawyer${metrics.pendingLawyers === 1 ? '' : 's'} awaiting approval.`,
          time: 'Now',
        }]
      : []),
    ...(metrics.pendingListings > 0
      ? [{
          id: 'n-listings',
          text: `${metrics.pendingListings} listing${metrics.pendingListings === 1 ? '' : 's'} pending ownership verification.`,
          time: 'Now',
        }]
      : []),
    ...(metrics.escrowHeld > 0
      ? [{
          id: 'n-escrow',
          text: `${naira(metrics.escrowHeld)} held in active escrow.`,
          time: 'Now',
        }]
      : []),
  ]

  const notificationCount = metrics.pendingLawyers + metrics.pendingListings + (metrics.escrowHeld > 0 ? 1 : 0)

  useEffect(() => {
    let active = true
    const messages: string[] = []
    const report = (err: unknown) => {
      const message = apiErrorMessage(err)
      if (message) messages.push(message)
    }
    const setIfActive = <T,>(setter: (value: T) => void, value: T) => {
      if (active) setter(value)
    }
    ;(async () => {
      try {
        const data = adminDashboardToMetrics(await getAdminDashboard())
        setIfActive(setMetrics, data)
      } catch (err) {
        report(err)
      }
      try {
        const rows = await getAdminTransactionMetrics({ granularity: MetricsGranularity.Month })
        const points = extractArray(rows, 'points').map(adminTransactionToPoint)
        setIfActive(setSeries, points)
      } catch (err) {
        report(err)
      }
      try {
        const rows = await getLawyers({ page: 1, pageSize: 100 })
        const records = extractArray(rows).map(adminLawyerToRecord)
        setIfActive(setLawyers, records)
      } catch (err) {
        report(err)
      }
      try {
        const rows = await getAdminListings({ page: 1, pageSize: 100 })
        const records = extractArray(rows).map(adminListingToRecord)
        setIfActive(setListings, records)
      } catch (err) {
        report(err)
      }
      try {
        const fee = adminFeeSettingsToRecord(await getFeeSettings())
        setIfActive(setFees, fee)
      } catch (err) {
        report(err)
      }
      if (active && messages.length > 0) setLoadError(messages[0])
    })()
    return () => {
      active = false
    }
  }, [])

  const m = metrics

  const handleLawyerAction = async (id: string, next: LawyerApprovalStatus, message: string) => {
    const apply = () => {
      setLawyers((prev) => prev.map((l) => (l.id === id ? { ...l, status: next } : l)))
      show(message)
    }
    if (!isUuid(id)) {
      apply()
      return
    }
    try {
      if (next === 'verified') await verifyLawyer(id)
      else if (next === 'rejected') await rejectLawyer(id)
      else await suspendLawyer(id)
      apply()
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Could not update this lawyer right now.')
    }
  }

  const handleListingAction = async (id: string, status: AdminListingStatus, message: string) => {
    const apply = () => {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
      show(message)
    }
    if (!isUuid(id)) {
      apply()
      return
    }
    try {
      if (status === 'published') await publishListing(id)
      else if (status === 'closed') await closeListing(id)
      else await unpublishListing(id)
      apply()
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Could not update this listing right now.')
    }
  }

  const saveFees = async () => {
    if (fees.platformCommissionRate + fees.legalFeeRate >= 100) {
      show('Combined rates must be below 100%')
      return
    }
    try {
      await updateFeeSettings(fees)
      setFeesDirty(false)
      show('Fee settings saved')
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Could not save fee settings right now.')
    }
  }

  const filteredLawyers = lawyerFilter === 'all' ? lawyers : lawyers.filter((l) => l.status === lawyerFilter)
  const filteredListings =
    listingFilter === 'all'
      ? listings
      : listingFilter === 'pending'
        ? listings.filter((l) => l.status === 'pending')
        : listings.filter((l) => l.status === listingFilter)

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: (props: { className?: string }) => <LineChartIcon {...props} /> },
    { id: 'lawyers', label: 'Lawyers', Icon: (props: { className?: string }) => <ScalesIcon {...props} /> },
    { id: 'ownership', label: 'Ownership reviews', Icon: (props: { className?: string }) => <ShieldIcon {...props} /> },
    { id: 'listings', label: 'Listings', Icon: (props: { className?: string }) => <HouseIcon {...props} /> },
    { id: 'fees', label: 'Fees & settings', Icon: (props: { className?: string }) => <CoinsIcon {...props} /> },
  ]

  const renderOverview = () => (
    <div className="space-y-8">
      <PageHeading
        title="Platform overview"
        subtitle="Operational view of users, listings, leases and escrow."
      />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total users"
          value={m.totalUsers.toLocaleString('en-NG')}
          sub={`${m.totalLandlords} landlords · ${m.totalCaretakers} caretakers`}
          icon={<UsersIcon className="h-5 w-5" />}
          accent="forest"
        />
        <KpiCard
          label="Active listings"
          value={m.publishedListings.toLocaleString('en-NG')}
          sub={`${m.pendingListings} pending moderation`}
          icon={<HouseIcon className="h-5 w-5" />}
          accent="flame"
        />
        <KpiCard
          label="Active leases"
          value={m.activeLeases.toLocaleString('en-NG')}
          sub={`${m.leasesCount} total leases`}
          icon={<AgreementIcon className="h-5 w-5" />}
          accent="flame"
        />
        <KpiCard
          label="Escrow held"
          value={naira(m.escrowHeld)}
          sub={`${m.totalTransactions.toLocaleString('en-NG')} transactions`}
          icon={<ShieldIcon className="h-5 w-5" />}
          accent="forest"
        />
      </div>

      {/* Transaction volume chart */}
      <div className="rounded-xl border border-sage bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-forest">Transaction volume</h2>
            <p className="text-sm text-mist">Monthly escrow volume, funded + released</p>
          </div>
        </div>
        {series.length === 0 ? (
          <EmptyState icon={<LineChartIcon className="h-6 w-6" />} title="No transaction volume yet" body="Escrow activity will appear here as leases are funded." />
        ) : (
          <TransactionChart data={series} />
        )}
      </div>

      {/* Two-column: escrow ledger + needs attention */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-sage bg-white">
          <div className="flex items-center justify-between border-b border-sage-line px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-forest">Escrow ledger</h2>
            <span className="text-xs font-bold uppercase tracking-[0.07em] text-mist">All time</span>
          </div>
          {m.ledgerTotals.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState icon={<CoinsIcon className="h-6 w-6" />} title="No ledger entries" body="Ledger totals will appear once transactions are recorded." />
            </div>
          ) : (
            <ul className="divide-y divide-sage-line">
              {m.ledgerTotals.map((row) => (
                <li key={row.type} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{ledgerTypeLabel(row.type)}</p>
                    <p className="text-xs text-mist">{row.count} transaction{row.count === 1 ? '' : 's'}</p>
                  </div>
                  <span className="font-semibold text-forest">{naira(row.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-sage bg-white">
          <div className="flex items-center justify-between border-b border-sage-line px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-forest">Needs attention</h2>
            <button type="button" onClick={() => setActiveTab('lawyers')} className="text-sm font-semibold text-flame hover:text-flame-dark">
              View all
            </button>
          </div>
          <ul className="divide-y divide-sage-line">
            <li className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flame-soft text-flame"><ScalesIcon className="h-4.5 w-4.5" /></span>
              <div>
                <p className="text-sm text-ink"><span className="font-semibold">{m.pendingLawyers} lawyer{m.pendingLawyers === 1 ? '' : 's'}</span> awaiting approval</p>
                <p className="text-xs text-mist">Identity + bar number review required</p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flame-soft text-flame"><HouseIcon className="h-4.5 w-4.5" /></span>
              <div>
                <p className="text-sm text-ink"><span className="font-semibold">{m.pendingListings} listing{m.pendingListings === 1 ? '' : 's'}</span> pending ownership verification</p>
                <p className="text-xs text-mist">C of O / deed review needed</p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-forest"><CoinsIcon className="h-4.5 w-4.5" /></span>
              <div>
                <p className="text-sm text-ink"><span className="font-semibold">{naira(m.escrowHeld)}</span> held in escrow</p>
                <p className="text-xs text-mist">{m.activeLeases} active escrow lease{m.activeLeases === 1 ? '' : 's'} in flight</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )

  const renderLawyers = () => (
    <div className="space-y-6">
      <PageHeading
        title="Lawyer approvals"
        subtitle="Review, approve or reject bar membership applications."
        action={
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'verified', 'suspended', 'rejected'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setLawyerFilter(f)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  lawyerFilter === f
                    ? 'bg-forest text-white'
                    : 'border border-sage bg-white text-mist hover:text-forest',
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-sage bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-sage-line bg-sand/60 text-xs font-bold uppercase tracking-[0.07em] text-mist">
              <th className="px-5 py-3.5 font-bold">Lawyer</th>
              <th className="px-5 py-3.5 font-bold">Bar number</th>
              <th className="px-5 py-3.5 font-bold">KYC</th>
              <th className="px-5 py-3.5 font-bold">Submitted</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-line">
            {filteredLawyers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={<ScalesIcon className="h-6 w-6" />} title="No lawyers" body="No lawyer application matches this filter." />
                </td>
              </tr>
            ) : (
              filteredLawyers.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-sand/50">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-ink">{l.name}</p>
                  <p className="text-xs text-mist">{l.email}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-[13px] text-mist">{l.barNumber}</td>
                <td className="px-5 py-3.5">
                  <StatusPill tone={l.kycVerified ? 'signed' : 'failed'}>{l.kycVerified ? 'Verified' : 'Missing'}</StatusPill>
                </td>
                <td className="px-5 py-3.5 text-[13px] text-mist">{l.submittedAt}</td>
                <td className="px-5 py-3.5">
                  <StatusPill tone={statusTone(l.status)}>{l.status}</StatusPill>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {l.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleLawyerAction(l.id, 'verified', `${l.name} approved`)}
                        className="rounded-md bg-forest px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-forest-deep"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLawyerAction(l.id, 'rejected', `${l.name} rejected`)}
                        className="rounded-md border border-[#E4C7C7] px-3 py-1.5 text-[13px] font-semibold text-[#B42318] transition-colors hover:bg-[#FDE8E8]"
                      >
                        Reject
                      </button>
                    </div>
                  ) : l.status === 'verified' ? (
                    <button
                      type="button"
                      onClick={() => handleLawyerAction(l.id, 'suspended', `${l.name} suspended`)}
                      className="rounded-md border border-sage px-3 py-1.5 text-[13px] font-semibold text-mist transition-colors hover:border-forest/40 hover:text-forest"
                    >
                      Suspend
                    </button>
                  ) : (
                    <span className="text-[13px] text-mist">—</span>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderListings = () => (
    <div className="space-y-6">
      <PageHeading
        title="Listing moderation"
        subtitle="Verify ownership and publish, unpublish or close listings."
        action={
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'published', 'unpublished', 'closed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setListingFilter(f)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                  listingFilter === f
                    ? 'bg-forest text-white'
                    : 'border border-sage bg-white text-mist hover:text-forest',
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-hidden rounded-xl border border-sage bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-sage-line bg-sand/60 text-xs font-bold uppercase tracking-[0.07em] text-mist">
              <th className="px-5 py-3.5 font-bold">Listing</th>
              <th className="px-5 py-3.5 font-bold">Owner</th>
              <th className="px-5 py-3.5 font-bold">Rent/yr</th>
              <th className="px-5 py-3.5 font-bold">Ownership</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-line">
            {filteredListings.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={<HouseIcon className="h-6 w-6" />} title="No listings" body="No listing matches this filter." />
                </td>
              </tr>
            ) : (
              filteredListings.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-sand/50">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{l.title}</p>
                    <p className="text-xs text-mist">{l.location || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-ink">{l.owner}</td>
                  <td className="px-5 py-3.5 font-semibold text-forest">{naira(l.rent)}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={l.ownershipVerified ? 'signed' : 'pending'}>{l.ownershipVerified ? 'Verified' : 'Pending'}</StatusPill>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={listingStatusTone(l.status)}>{l.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {l.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'published', `${l.title} published`)}
                          className="rounded-md bg-forest px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-forest-deep"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'unpublished', `${l.title} unpublished`)}
                          className="rounded-md border border-sage px-3 py-1.5 text-[13px] font-semibold text-mist transition-colors hover:text-forest"
                        >
                          Hold
                        </button>
                      </div>
                    ) : l.status === 'published' ? (
                      <button
                        type="button"
                        onClick={() => handleListingAction(l.id, 'unpublished', `${l.title} unpublished`)}
                        className="rounded-md border border-sage px-3 py-1.5 text-[13px] font-semibold text-mist transition-colors hover:text-forest"
                      >
                        Unpublish
                      </button>
                    ) : l.status === 'unpublished' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'published', `${l.title} published`)}
                          className="rounded-md bg-forest px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-forest-deep"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'closed', `${l.title} closed`)}
                          className="rounded-md border border-[#E4C7C7] px-3 py-1.5 text-[13px] font-semibold text-[#B42318] transition-colors hover:bg-[#FDE8E8]"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <span className="text-[13px] text-mist">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderFees = () => (
    <div className="space-y-6 max-w-2xl">
      <PageHeading title="Fees & settings" subtitle="Global escrow fee-split percentages for platform and legal review." />
      <div className="rounded-xl border border-sage bg-white p-6 sm:p-8">
        <div className="space-y-6">
          <Field label="Platform commission rate (%)" required>
            <input
              type="number"
              min={0}
              max={100}
              value={fees.platformCommissionRate}
              onChange={(e) => { setFees({ ...fees, platformCommissionRate: Number(e.target.value) }); setFeesDirty(true) }}
              className={inputClass}
            />
          </Field>
          <Field label="Legal review fee rate (%)" required>
            <input
              type="number"
              min={0}
              max={100}
              value={fees.legalFeeRate}
              onChange={(e) => { setFees({ ...fees, legalFeeRate: Number(e.target.value) }); setFeesDirty(true) }}
              className={inputClass}
            />
          </Field>
          <div className="rounded-lg bg-sage-soft p-4">
            <p className="text-sm text-forest"><span className="font-semibold">Combined remaining</span> — {100 - fees.platformCommissionRate - fees.legalFeeRate}% stays with the property owner.</p>
            {fees.platformCommissionRate + fees.legalFeeRate >= 100 && (
              <p className="mt-1 text-[13px] font-medium text-[#B42318]">Combined rates must stay below 100%.</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveFees}
              disabled={!feesDirty}
              className="rounded-lg bg-flame px-6 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'lawyers': return renderLawyers()
      case 'ownership': return <OwnershipReviewQueue role="admin" />
      case 'listings': return renderListings()
      case 'fees': return renderFees()
      case 'settings': return (
        <SettingsContent role="admin" user={user} verifiedLabel={ADMIN_VERIFIED_LABEL} onProfileSave={() => undefined} />
      )
      default: return null
    }
  }

  return (
    <>
      <Seo title="Admin Dashboard · Rent Bridge" description="Platform operations and moderation" />
      <RoleDashboardShell
        user={{ name: user.name, verifiedLabel: ADMIN_VERIFIED_LABEL, notificationCount }}
        notifications={notifications}
        tabs={tabs}
        active={activeTab}
        onChange={setActiveTab}
      >
        <DataErrorBanner message={loadError} />
        <div key={activeTab} className="anim-rise">
          {renderContent()}
        </div>
      </RoleDashboardShell>
    </>
  )
}

/* ------------------------------ sub-components ------------------------------ */

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: string; sub: string; icon: React.ReactNode; accent: 'forest' | 'flame' }) {
  return (
    <div className="rounded-xl border border-sage bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-mist">{label}</p>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accent === 'forest' ? 'bg-sage-soft text-forest' : 'bg-flame-soft text-flame')}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl font-semibold tracking-tight text-forest">{value}</p>
      <p className="mt-1 text-[13px] text-mist">{sub}</p>
    </div>
  )
}

function TransactionChart({ data }: { data: TransactionPoint[] }) {
  const innerW = 720
  const innerH = 180
  const maxVal = Math.max(1, ...data.map((p) => p.volume))
  const denom = Math.max(1, data.length - 1)
  const points = data.map((p, i) => ({
    ...p,
    x: (i / denom) * innerW,
    y: innerH - (p.volume / maxVal) * (innerH - 16),
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${innerW},${innerH} L0,${innerH} Z`

  return (
    <div className="mt-4 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${innerW} ${innerH + 24}`} className="min-w-[520px] w-full" role="img" aria-label="Monthly transaction volume chart">
        <defs>
          <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E4661F" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#E4661F" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={innerW} y1={innerH * (1 - g)} y2={innerH * (1 - g)} stroke="#E3ECE6" strokeWidth="1" />
        ))}
        <path d={areaPath} fill="url(#volFill)" />
        <path d={linePath} fill="none" stroke="#E4661F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#FFF" stroke="#E4661F" strokeWidth="2" />
            <text x={p.x} y={innerH + 18} textAnchor="middle" className="fill-mist" fontSize="11">{p.date}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ---------------------------- admin dash icons ----------------------------- */

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3 3-4.5 6.5-4.5s6.5 1.5 6.5 4.5" />
      <path d="M16 5a3.5 3.5 0 0 1 0 6M18.5 15.8c1.8.6 3 1.8 3 3.2" />
    </svg>
  )
}

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

function AgreementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" />
      <path d="M9 12l2.2 2.2L15.5 9.7" />
    </svg>
  )
}

function ScalesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 4v16" />
      <path d="M6 20h12" />
      <path d="M5 7h14" />
      <path d="M5 7 2 13h6z" />
      <path d="M19 7l-3 6h6z" />
    </svg>
  )
}

function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M18.5 9.5a5.5 5.5 0 1 1-9 4.3" />
      <circle cx="16" cy="16" r="5.5" />
    </svg>
  )
}

function LineChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

function ledgerTypeLabel(type: number): string {
  switch (type) {
    case 0: return 'Escrow funded'
    case 1: return 'Platform commission'
    case 2: return 'Legal fee share'
    case 3: return 'Landlord payout'
    default: return `Ledger type ${type}`
  }
}

function statusTone(status: LawyerApprovalStatus): 'pending' | 'signed' | 'waiting' | 'failed' {
  switch (status) {
    case 'pending': return 'pending'
    case 'verified': return 'signed'
    case 'suspended': return 'waiting'
    case 'rejected': return 'failed'
  }
}

function listingStatusTone(status: AdminListingStatus): 'pending' | 'published' | 'unpublished' | 'waiting' {
  switch (status) {
    case 'pending': return 'pending'
    case 'published': return 'published'
    case 'unpublished': return 'unpublished'
    case 'closed': return 'waiting'
  }
}