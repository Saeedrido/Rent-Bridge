import { apiGet, apiPost, apiPut } from './client'

export interface Bank {
  code?: string
  name?: string
  slug?: string
  active?: boolean
  [key: string]: unknown
}

export interface ResolvePayoutAccountPayload {
  bankCode?: string
  accountNumber?: string
}

export interface SetPayoutAccountPayload {
  bankCode?: string
  bankName?: string
  accountNumber?: string
}

export interface PayoutAccountRecord {
  id?: string
  bankCode?: string
  bankName?: string
  accountNumber?: string
  accountNumberMasked?: string
  accountNumberLast4?: string
  accountName?: string
  resolved?: boolean
  verifiedAt?: string
  isActive?: boolean
  provider?: string
  [key: string]: unknown
}

export async function getBanks(): Promise<Bank[]> {
  return apiGet('/payout-account/banks')
}

export async function resolvePayoutAccount(payload: ResolvePayoutAccountPayload): Promise<{ accountName?: string; accountNumber?: string; status?: boolean }> {
  return apiPost('/payout-account/resolve', payload)
}

export async function setPayoutAccount(payload: SetPayoutAccountPayload): Promise<PayoutAccountRecord> {
  return apiPut('/payout-account', payload)
}

export async function getPayoutAccount(): Promise<PayoutAccountRecord> {
  return apiGet('/payout-account')
}