import { useEffect, useState } from 'react'
import { inputClass, useToast } from './shared'
import {
  getBanks,
  resolvePayoutAccount,
  setPayoutAccount,
  getPayoutAccount,
  type Bank,
  type PayoutAccountRecord,
} from '../../../services/api/payoutApi'
import { ApiError } from '../../../services/api/client'

function maskAccount(value?: string): string {
  const raw = value ?? ''
  if (raw.length <= 4) return raw
  return `${'*'.repeat(raw.length - 4)}${raw.slice(-4)}`
}

export function PayoutAccountSection() {
  const { show } = useToast()
  const [account, setAccount] = useState<PayoutAccountRecord | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [loadedAccount, loadedBanks] = await Promise.all([
        getPayoutAccount().catch(() => null),
        getBanks().catch(() => [] as Bank[]),
      ])
      if (!active) return
      setAccount(loadedAccount)
      setBanks(loadedBanks.filter((bank) => bank.code && bank.active !== false))
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const handleResolve = async () => {
    if (!bankCode || accountNumber.length < 10 || resolving) return
    setResolving(true)
    try {
      const result = await resolvePayoutAccount({ bankCode, accountNumber })
      setAccountName(result?.accountName ?? '')
      if (!result?.accountName) show('Account could not be resolved. Check the details.')
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Account could not be resolved.')
    } finally {
      setResolving(false)
    }
  }

  const handleSave = async () => {
    if (saving) return
    if (!bankCode || !accountNumber || !accountName) {
      show('Resolve the account first, then save.')
      return
    }
    setSaving(true)
    try {
      const bank = banks.find((entry) => entry.code === bankCode)
      const saved = await setPayoutAccount({
        bankCode,
        bankName: bank?.name ?? '',
        accountNumber,
      })
      setAccount(saved)
      show('Payout account saved')
    } catch (err) {
      show(err instanceof ApiError ? err.message : 'Could not save the payout account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-sage bg-white p-6 sm:p-8">
      <h2 className="font-serif text-xl font-semibold text-forest">Payout account</h2>
      <p className="mt-1 text-sm text-mist">
        Rent settlements are paid out to this account. Required before publishing listings.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-mist">Loading payout details…</p>
      ) : account?.accountNumber ? (
        <div className="mt-4 rounded-lg border border-sage bg-sage-soft/50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.07em] text-forest">Linked account</p>
          <p className="mt-2 font-semibold text-ink">{account.accountName || 'Account holder'}</p>
          <p className="text-sm text-mist">
            {account.bankName || account.bankCode} · {account.accountNumberMasked || maskAccount(account.accountNumber)}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#374151]" htmlFor="payout-bank">
              Bank
            </label>
            <select
              id="payout-bank"
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value)
                setAccountName('')
              }}
              className={inputClass}
            >
              <option value="">
                {banks.length > 0 ? 'Select your bank' : 'Bank list unavailable'}
              </option>
              {banks.map((bank, index) => (
                <option key={`${bank.code}-${index}`} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#374151]" htmlFor="payout-account-number">
              Account number
            </label>
            <input
              id="payout-account-number"
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''))
                setAccountName('')
              }}
              className={inputClass}
              placeholder="0123456789"
            />
          </div>
          {accountName && (
            <div className="rounded-lg border border-forest/30 bg-sage-soft/50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.07em] text-forest">Resolved name</p>
              <p className="mt-1 font-semibold text-ink">{accountName}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleResolve}
              disabled={resolving || !bankCode || accountNumber.length < 10}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-forest/30 bg-white px-5 py-2.5 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resolving ? 'Resolving…' : 'Resolve account'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !accountName}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save payout account'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
