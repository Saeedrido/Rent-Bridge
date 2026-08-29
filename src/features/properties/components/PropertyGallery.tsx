import { useState } from 'react'
import type { PropertyImage as PropertyImageType } from '../types/property'
import { PropertyImage } from '../../../components/common'

export function PropertyGallery({ images }: { images: PropertyImageType[] }) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-green/15 bg-[#E7E2D8]" style={{ height: 420 }}>
        <PropertyImage src={current.url} alt={current.alt} eager />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-20 w-28 flex-shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === active ? 'border-orange' : 'border-transparent'
              }`}
            >
              <PropertyImage src={img.url} alt={img.alt} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
