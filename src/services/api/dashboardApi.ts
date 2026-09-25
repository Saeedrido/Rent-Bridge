import { apiGet, buildQuery } from './client'
import { extractArray } from './mappers'

export enum MetricsGranularity {
  Day = 0,
  Week = 1,
  Month = 2,
}

export interface DashboardSnapshot {
  listings?: unknown
  leases?: unknown
  escrowHeld?: number
  payoutTotals?: number
  recentLedgerLines?: unknown[]
  [key: string]: unknown
}

export interface TransactionBucket {
  period?: string
  amount?: number
  count?: number
  [key: string]: unknown
}

export async function getOwnerDashboard(): Promise<DashboardSnapshot> {
  return apiGet('/dashboard')
}

export async function getOwnerTransactionMetrics(params: {
  from?: string
  to?: string
  granularity?: MetricsGranularity
} = {}): Promise<TransactionBucket[]> {
  return apiGet(`/dashboard/metrics/transactions${buildQuery(params)}`)
}

export async function getTransactions(page = 1, pageSize = 20): Promise<unknown[]> {
  const payload = await apiGet<unknown>(`/transactions${buildQuery({ page, pageSize })}`)
  return extractArray(payload)
}