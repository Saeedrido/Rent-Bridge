import { useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Seo } from '../../../components/common'
import { dashboardProperties } from '../../../features/dashboard/data/dashboardProperties'
import { cn } from '../../../utils/cn'
import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon, CheckIcon, SaveIcon } from '../components/icons'

interface MediaItem {
  id: string
  url: string
  alt: string
  type: 'image' | 'video'
  preview?: string
}

const MEDIA_ITEMS: Record<string, MediaItem[]> = {
  '1': [
    { id: '1a', url: '/home1.jpg', alt: 'Living room', type: 'image' },
    { id: '1b', url: '/home2.jpg', alt: 'Bedroom', type: 'image' },
    { id: '1c', url: '/home3.jpg', alt: 'Exterior', type: 'image' },
    { id: '1d', url: '/home4.jpg', alt: 'Kitchen', type: 'image' },
    { id: '1e', url: '/home5.jpg', alt: 'Bathroom', type: 'image' },
  ],
  '2': [
    { id: '2a', url: '/home2.jpg', alt: 'Living room', type: 'image' },
    { id: '2b', url: '/home1.jpg', alt: 'Kitchen', type: 'image' },
    { id: '2c', url: '/home3.jpg', alt: 'Exterior', type: 'image' },
  ],
  '3': [
    { id: '3a', url: '/home3.jpg', alt: 'Living room', type: 'image' },
    { id: '3b', url: '/home1.jpg', alt: 'Bedroom', type: 'image' },
    { id: '3c', url: '/home2.jpg', alt: 'Exterior', type: 'image' },
    { id: '3d', url: '/home4.jpg', alt: 'Kitchen', type: 'image' },
    { id: '3e', url: '/home5.jpg', alt: 'Bathroom', type: 'image' },
    { id: '3f', url: '/home6.jpg', alt: 'Compound', type: 'image' },
  ],
}

function getMediaForProperty(propertyId: string): MediaItem[] {
  return MEDIA_ITEMS[propertyId] || [{ id: 'main', url: '/home1.jpg', alt: 'Property', type: 'image' }]
}

function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

const PROPERTY_DETAILS: Record<string, { description: string; landlord: { name: string; role: string } }> = {
  'd1': {
    description: 'Second-floor flat in a four-unit block off Herbert Macaulay Way. Borehole water, prepaid meter, tiled throughout, gated compound with a resident caretaker.',
    landlord: { name: 'Emeka Adeyemi', role: 'Verified Landlord · 4 properties' }
  },
  'd2': {
    description: 'Spacious three-bedroom on a quiet street, fitted kitchen, 24-hour security and dedicated parking for two cars.',
    landlord: { name: 'Ngozi Eze', role: 'Verified Landlord · 2 properties' }
  },
  'd3': {
    description: 'Newly painted mini flat with fitted wardrobes, water heater and inverter backup. Close to National Stadium.',
    landlord: { name: 'Bimbo Salami', role: 'Verified Agent · Caretaker on site' }
  },
  'd4': {
    description: 'Well-finished 2-bedroom terrace in a gated estate off Millennium Estate Road. 24-hour security, estate generator and children\'s playground.',
    landlord: { name: 'Samuel Okafor', role: 'Verified Landlord · 3 properties' }
  },
  'd5': {
    description: 'Compact studio ideal for a young professional. Inverter, fitted kitchenette and a short walk to the tech hub on Herbert Macaulay.',
    landlord: { name: 'Fatima Bello', role: 'Verified Landlord · 3 properties' }
  },
  'd6': {
    description: 'Detached duplex with a boys quarter, fitted kitchen, jacuzzi, smart-home wiring and a compound that parks four cars.',
    landlord: { name: 'Tunde Bakare', role: 'Verified Landlord · 6 properties' }
  },
}

function getPropertyDetails(propertyId: string) {
  return PROPERTY_DETAILS[propertyId] || { 
    description: 'A beautiful property in a great location with modern amenities.', 
    landlord: { name: 'Property Manager', role: 'Verified Landlord' } 
  }
}

export default function TenantPropertyDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const property = dashboardProperties.find((p) => p.id === id)
  const media = getMediaForProperty(id || '')
  const details = getPropertyDetails(id || '')

  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isGalleryDragging, setIsGalleryDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragScrollLeft, setDragScrollLeft] = useState(0)
const galleryRef = useRef<HTMLDivElement>(null)
const featuredRef = useRef<HTMLDivElement>(null)

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

  if (!property) {
    return (
      <div className="px-[clamp(16px,4vw,40px)] pt-8 pb-16 text-center">
        <h1 className="font-serif text-2xl font-semibold text-forest">Property not found</h1>
        <p className="mt-2 text-mist">This listing may have been rented or removed.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-flame font-semibold hover:underline">
          Back to properties
        </Link>
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
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">WATER</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink">Borehole</p>
                  </div>
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">POWER</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink">Prepaid meter</p>
                  </div>
                  <div className="rounded-lg border border-sage p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-mist">AVAILABLE</p>
                    <p className="mt-1 font-serif text-xl font-bold text-ink">1 Sept 2026</p>
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
                    <span className="font-semibold text-ink">{formatPrice(Math.round(property.price * 0.05))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Lawyer review</span>
                    <span className="font-semibold text-ink">{formatPrice(45000)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#374151]">
                    <span>Caution fee (refundable)</span>
                    <span className="font-semibold text-ink">{formatPrice(140000)}</span>
                  </div>
                </div>

                <div className="border-t border-sage pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg text-ink">Total package</span>
                    <span className="font-serif text-2xl font-bold text-forest">
                      {formatPrice(property.price + Math.round(property.price * 0.05) + 45000 + 140000)}
                    </span>
                  </div>
                </div>

                <button className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-flame px-6 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-flame-dark">
                  Request Inspection
                </button>

                <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-sage bg-white px-6 py-3 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-sage-soft">
                  <SaveIcon className="w-5 h-5" />
                  Save property
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