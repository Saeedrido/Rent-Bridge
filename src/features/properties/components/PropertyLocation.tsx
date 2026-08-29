import type { Property } from '../types/property'

export function PropertyLocation({ property }: { property: Property }) {
  return (
    <section className="rounded-card border border-green/15 bg-white p-6">
      <h2 className="font-serif text-xl font-semibold text-green-dark">Location</h2>
      <p className="mt-3 text-ink/80">{property.location}, {property.city}, {property.state}</p>
      <div
        className="mt-4 flex items-center justify-center rounded border border-green/15 bg-green/5 text-ink/60"
        style={{ height: 220 }}
        role="img"
        aria-label={`Map showing ${property.location}, ${property.city}`}
      >
        <div className="text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1B7A3E" strokeWidth="1.4" className="mx-auto">
            <path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="mt-2 block text-sm">Map view · {property.coordinates?.lat.toFixed(3)}, {property.coordinates?.lng.toFixed(3)}</span>
        </div>
      </div>
    </section>
  )
}
