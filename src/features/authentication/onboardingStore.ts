export interface OnboardingData {
  fullName?: string
  email?: string
  password?: string
  role?: string
}

const KEY = 'rb:onboarding'

export function getOnboarding(): OnboardingData {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') as OnboardingData
  } catch {
    return {}
  }
}

export function saveOnboarding(patch: Partial<OnboardingData>) {
  const current = getOnboarding()
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }))
}
