export function PropertyAmenities({ amenities }: { amenities: string[] }) {
  return (
    <section className="rounded-card border border-green/15 bg-white p-6">
      <h2 className="font-serif text-xl font-semibold text-green-dark">Amenities</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((a) => (
          <li key={a} className="flex items-center gap-2 text-ink/80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B7A3E" strokeWidth="2.4">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
            {a}
          </li>
        ))}
      </ul>
    </section>
  )
}
