import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface SectionLoadingState {
  isLoading: boolean
  message?: string
}

interface LoadingContextValue {
  sections: Record<string, SectionLoadingState>
  startLoading: (sectionId: string, message?: string) => void
  stopLoading: (sectionId: string) => void
  isSectionLoading: (sectionId: string) => boolean
  getLoadingMessage: (sectionId: string) => string | undefined
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function SectionLoadingProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Record<string, SectionLoadingState>>({})

  const startLoading = useCallback((sectionId: string, message?: string) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: { isLoading: true, message }
    }))
  }, [])

  const stopLoading = useCallback((sectionId: string) => {
    setSections(prev => {
      const next = { ...prev }
      delete next[sectionId]
      return next
    })
  }, [])

  const isSectionLoading = useCallback((sectionId: string) => {
    return sections[sectionId]?.isLoading ?? false
  }, [sections])

  const getLoadingMessage = useCallback((sectionId: string) => {
    return sections[sectionId]?.message
  }, [sections])

  return (
    <LoadingContext.Provider value={{ sections, startLoading, stopLoading, isSectionLoading, getLoadingMessage }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useSectionLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useSectionLoading must be used within a SectionLoadingProvider')
  }
  return context
}

export function useSectionLoader(sectionId: string) {
  const { startLoading, stopLoading, isSectionLoading, getLoadingMessage } = useSectionLoading()
  
  const withLoading = useCallback(async <T,>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(sectionId, message)
    try {
      const result = await promise
      return result
    } finally {
      stopLoading(sectionId)
    }
  }, [sectionId, startLoading, stopLoading])

  return {
    isLoading: isSectionLoading(sectionId),
    message: getLoadingMessage(sectionId),
    withLoading,
    startLoading: (msg?: string) => startLoading(sectionId, msg),
    stopLoading: () => stopLoading(sectionId),
  }
}