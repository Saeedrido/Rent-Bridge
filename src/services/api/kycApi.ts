import { apiGet, apiPost } from './client'

export interface KycVerifyPayload {
  nin?: string
}

export interface DojahSessionData {
  appId?: string
  publicKey?: string
  widgetId?: string
  environment?: string
}

export interface KycVerifyResult {
  referenceId?: string
  data?: DojahSessionData
}

interface KycVerifyResponse {
  kycId?: string
  provider?: string
  status?: string
  session?: {
    referenceId?: string
    data?: DojahSessionData
  }
}

export type KycStatusValue = 'none' | 'pending' | 'verified' | 'rejected'

export interface KycStatusResult {
  kycId?: string
  provider?: string
  status?: KycStatusValue
  completedAt?: string
}

export async function verifyKyc(payload: KycVerifyPayload): Promise<KycVerifyResult> {
  const body = await apiPost<KycVerifyResponse>('/kyc/verify', payload)
  return {
    referenceId: body.session?.referenceId,
    data: body.session?.data,
  }
}

export async function getKycStatus(): Promise<KycStatusResult> {
  return apiGet<KycStatusResult>('/kyc/status')
}

export async function getSmileToken(nin: string): Promise<{ token?: string; userId?: string }> {
  return apiPost<{ token?: string; userId?: string }>('/kyc/smile-token', { nin })
}