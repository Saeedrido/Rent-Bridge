import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { PropertyGallerySkeleton } from '../../../components/ui'
import type { DashboardProperty } from '../../../features/dashboard/data/dashboardProperties'
import { propertyService } from '../../../features/properties/services/propertyService'
import { propertyToDashboardProperty, isUuid, formatDate } from '../../../services/api/mappers'
import { getListing } from '../../../services/api/listingApi'
import { createLease, requestInspection } from '../../../services/api/leaseApi'
import { apiErrorMessage } from '../../../services/api/fallback'
import { useFavorites } from '../../favorites/hooks/useFavorites'
import { DataErrorBanner, useToast } from '../roleDashboards/shared'
import { cn } from '../../../utils/cn'
import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon, CheckIcon, SaveIcon } from '../components/icons'
import { PendingAgreementBanner } from './PendingAgreementBanner'

interface MediaItem {
  id: string
  url: string
  alt: string
  type: 'image' | 'video'
  preview?: string
}

interface ListingDetails {
  description: string
  landlord: { name: string; role: string }
}

function formatPrice(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  return `₦${amount.toLocaleString('en-NG')}`
}

const PLATFORM_COMMISSION_RATE = 0.05
const LAWYER_REVIEW_FEE = 45000

export default function TenantPropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<DashboardProperty | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [details, setDetails] = useState<ListingDetails>({
    description: 'Contact the listing owner for more details.',
    landlord: { name: 'Rent Bridge host', role: 'Host' },
  })
  const [cautionFee, setCautionFee] = useState(0)
  const [availableFrom, setAvailableFrom] = useState<string | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { show } = useToast()

  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isGalleryDragging, setIsGalleryDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragScrollLeft, setDragScrollLeft] = useState(0)
const galleryRef = useRef<HTMLDivElement>(null)
const featuredRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(null)
    ;(async () => {
      if (!id || !isUuid(id)) {
        setLoading(false)
        return
      }
      try {
        const full = await propertyService.findById(id)
        if (!active) return
        if (!full) {
          setLoading(false)
          return
        }
        const dashboard = propertyToDashboardProperty(full)
        setProperty(dashboard)
        setDetails({
          description: full.description,
          landlord: { name: full.landlord.name, role: full.landlord.verified ? 'Verified host' : 'Host' },
        })
        setMedia(
          full.images.map((img, index) => ({
            id: img.id || `media-${index}`,
            url: img.url,
            alt: img.alt || full.title,
            type: 'image' as const,
          })),
        )
        const detail = await getListing(id).catch(() => null)
        if (!active) return
        setCautionFee(detail?.cautionFeeAmount ?? 0)
        setAvailableFrom(detail?.availableFrom || undefined)
        setLoading(false)
      } catch (err) {
        if (!active) return
        setLoadError(apiErrorMessage(err) || null)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const saved = id ? isFavorite(id) : false

  const inspectingRef = useRef(false)

  const handleRequestInspection = async () => {
    if (!id || inspectingRef.current) return
    inspectingRef.current = true
    setInspecting(true)
    try {
      console.log('[DEBUG] Creating lease for listing:', id)
      const lease = await createLease({ listingId: id })
      console.log('[DEBUG] Lease created:', lease.id)
      
      let inspectionRequested = false
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log('[DEBUG] Requesting inspection, attempt:', attempt + 1)
          await requestInspection(lease.id, {
            preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            note: 'Tenant requested an inspection from the listing page.',
          })
          console.log('[DEBUG] Inspection requested successfully')
          inspectionRequested = true
          break
        } catch (err) {
          lastError = err as Error
          const message = apiErrorMessage(err)
          console.log('[DEBUG] Request inspection error:', message, err)
          if (message?.includes('modified by another process')) {
            await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
            continue
          }
          throw err
        }
      }
      
      if (!inspectionRequested) {
        throw lastError || new Error('Failed to request inspection after retries')
      }
      
      show('Inspection requested — check the Inspections tab')
      navigate('/dashboard/inspections')
    } catch (err) {
      console.error('[DEBUG] Final error:', err)
      show(apiErrorMessage(err) || 'Could not request inspection right now.')
    } finally {
      setInspecting(false)
      inspectingRef.current = false
    }
  }

  const VISIBLE_THUMBNAILS = 4
  const totalMedia = media.length
  const hasMoreMedia = totalMedia > VISIBLE_THUMBNAILS
  const hiddenCount = totalMedia - VISIBLE_THUMBNAILS
  const visibleMedia = media.slice(galleryStartIndex, galleryStartIndex + VISIBLE_THUMBNAILS)

  const currentMedia = media[activeMediaIndex]
  const goToMedia = useCallback((index: number) => {
    if (index >= 0 && index < totalMedia) {
      setActiveMediaIndex(index)
      if (isVideoPlaying) {
        setIsVideoPlaying(false)
        setVideoUrl(null)
      }
    }
  }, [totalMedia])

  const nextMedia = useCallback(() => {
    const next = (activeMediaIndex + 1) % totalMedia
    goToMedia(next)
  }, [activeMediaIndex, totalMedia, goToMedia])

  const prevMedia = useCallback(() => {
    const prev = (activeMediaIndex - 1 + totalMedia) % totalMedia
    goToMedia(prev)
  }, [activeMediaIndex, totalMedia, goToMedia])

  const handleThumbnailClick = useCallback((index: number) => {
    const absoluteIndex = galleryStartIndex + index
    if (absoluteIndex !== activeMediaIndex) {
      setActiveMediaIndex(absoluteIndex)
      if (isVideoPlaying) {
        setIsVideoPlaying(false)
        setVideoUrl(null)
      }
    }
  }, [galleryStartIndex, activeMediaIndex, media])

  const handleGalleryScroll = useCallback(() => {
    if (!galleryRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current
    const maxScroll = scrollWidth - clientWidth
    const progress = scrollLeft / maxScroll
    const newStartIndex = Math.round(progress * (totalMedia - VISIBLE_THUMBNAILS))
    setGalleryStartIndex(Math.max(0, Math.min(newStartIndex, totalMedia - VISIBLE_THUMBNAILS)))
  }, [totalMedia])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsGalleryDragging(true)
    setDragStartX(e.clientX)
    setDragScrollLeft(galleryRef.current?.scrollLeft || 0)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isGalleryDragging || !galleryRef.current) return
    const dx = e.clientX - dragStartX
    galleryRef.current.scrollLeft = dragScrollLeft - dx
  }

  const handleMouseUp = () => {
    setIsGalleryDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX)
    setDragScrollLeft(galleryRef.current?.scrollLeft || 0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!galleryRef.current) return
    const dx = e.touches[0].clientX - dragStartX
    galleryRef.current.scrollLeft = dragScrollLeft - dx
  }

  const playVideo = (url: string) => {
    setVideoUrl(url)
    setIsVideoPlaying(true)
  }

  const closeVideo = () => {
    setIsVideoPlaying(false)
    setVideoUrl(null)
  }

  if (loading) {
    return <PropertyGallerySkeleton />
  }

  if (!property) {
    return (
      <div className="px-[clamp(16px,4vw,40px)] pt-8 pb-16">
        <DataErrorBanner message={loadError} />
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-forest">Property not found</h1>
          <p className="mt-2 text-mist">This listing may have been rented or removed.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-flame font-semibold hover:underline">
            Back to properties
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo
        title={`${property.title} | Rent Bridge`}
        description={`View ${property.title} in ${property.location}. ${property.beds} beds, ${property.baths} baths. ${details.description.slice(0, 90)}…`}
      />
      <div className="bg-sand min-h-screen">
        <main className="px-[clamp(16px,4vw,40px)] pt-8 pb-16">
          <DataErrorBanner message={loadError} />
          {/* Keeps an unfinished agreement visible while the tenant browses other
              properties — otherwise opening a new listing hides the in-progress one. */}
          <PendingAgreementBanner />
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-forest font-medium hover:underline mb-6"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to properties
          </Link>

          <div ref={featuredRef} className="relative overflow-hidden rounded-2xl bg-white" style={{ height: 520 }}>
            {isVideoPlaying && videoUrl && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
                <button
                  onClick={closeVideo}
                  className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  aria-label="Close video"
                >
                  <ChevronRightIcon className="w-6 h-6 rotate-90" />
                </button>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="max-h-[90vh] max-w-[90vw] rounded-lg"
                />
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              {currentMedia?.type === 'video' ? (
                <button
                  onClick={() => playVideo(currentMedia.url)}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                  aria-label="Play video"
                >
                  <PlayCircleIcon className="w-20 h-20 text-white drop-shadow-lg" />
                </button>
              ) : (
                <img
                  src={currentMedia?.url || property.image}
                  alt={currentMedia?.alt || property.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {(totalMedia > 1) && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-forest hover:bg-white shadow-lg transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-forest hover:bg-white shadow-lg transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div
            ref={galleryRef}
            className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-4"
            onScroll={handleGalleryScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {visibleMedia.map((img, index) => (
              <button
                key={img.id}
                onClick={() => handleThumbnailClick(index)}
                aria-label={`View ${img.alt}`}
                className={cn(
                  'flex-shrink-0 w-[180px] aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all',
                  galleryStartIndex + index === activeMediaIndex
                    ? 'border-flame ring-2 ring-flame/20'
                    : 'border-transparent hover:border-flame/30'
                )}
              >
                <div className="relative w-full h-full">
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                  {img.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayCircleIcon className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
            {hasMoreMedia && galleryStartIndex + VISIBLE_THUMBNAILS < totalMedia && (
              <div className="flex-shrink-0 w-[180px] aspect-[4/3] rounded-xl bg-white/80 flex flex-col items-center justify-center gap-2 border border-sage text-forest">
                <span className="text-2xl font-bold">+{hiddenCount}</span>
                <span className="text-xs text-mist">more</span>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
            <div className="space-y-8">
              <div>
                <p className="text-sm text-mist">{property.location}</p>
                <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-forest md:text-4xl">
                  {property.title}
                </h1>
              </div>

              <div className="rounded-xl border border-sage bg-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage-soft text-lg font-semibold text-forest">
                    {details.landlord.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink">{details.landlord.name}</h3>
                    <p className="mt-0.5 text-sm text-mist">{details.landlord.role}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-forest">
                      <CheckIcon className="w-4 h-4" />
                      Verified
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sage bg-white p-6">
                <h3 className="font-semibold uppercase tracking-[0.1em] text-[13px] text-forest mb-4">
                  Spec sheet
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">BEDROOMS</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-ink">{property.beds}</p>
                  </div>
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">BATHROOMS</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-ink">{property.baths}</p>
                  </div>
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">TYPE</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink capitalize">{property.typeLabel}</p>
                  </div>
                  <div className="rounded-lg border border-sage p-4 text-center col-span-3 sm:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">AVAILABLE</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink">{availableFrom ? formatDate(availableFrom) : '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-semibold text-forest mb-3">About this home</h3>
                <p className="text-[15px] text-[#374151] leading-relaxed">{details.description}</p>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-sage bg-white p-6 space-y-6">
                <div className="border-b border-sage pb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-forest">ANNUAL RENT</p>
                  <p className="mt-2 font-serif text-4xl font-bold text-forest">{formatPrice(property.price)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Platform commission (5%)</span>
                    <span className="font-semibold text-ink">{formatPrice(Math.round(property.price * PLATFORM_COMMISSION_RATE))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Lawyer review</span>
                    <span className="font-semibold text-ink">{formatPrice(LAWYER_REVIEW_FEE)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Caution fee (refundable)</span>
                    <span className="font-semibold text-ink">{cautionFee > 0 ? formatPrice(cautionFee) : '—'}</span>
                  </div>
                </div>

                <div className="border-t border-sage pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg text-ink">Total package</span>
                    <span className="font-serif text-2xl font-bold text-forest">
                      {formatPrice(property.price + Math.round(property.price * PLATFORM_COMMISSION_RATE) + LAWYER_REVIEW_FEE + cautionFee)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleRequestInspection}
                  disabled={inspecting}
                  className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark disabled:opacity-60"
                >
                  {inspecting ? 'Requesting…' : 'Request Inspection'}
                </button>

                <button
                  onClick={() => toggleFavorite(id ?? '', { availableFrom })}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3 text-[15px] font-semibold transition-colors',
                    saved
                      ? 'border-forest bg-forest text-white hover:bg-forest-dark'
                      : 'border-sage bg-white text-forest hover:border-forest hover:bg-sage-soft'
                  )}
                >
                  <SaveIcon className="w-5 h-5" />
                  {saved ? 'Saved' : 'Save property'}
                </button>

                <p className="text-center text-sm text-mist">
                  Nothing is payable until a lawyer has reviewed your agreement.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}