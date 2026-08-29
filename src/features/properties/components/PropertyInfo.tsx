export function PropertyInfo({ description }: { description: string }) {
  return (
    <section className="rounded-card border border-green/15 bg-white p-6">
      <h2 className="font-serif text-xl font-semibold text-green-dark">About this property</h2>
      <p className="mt-3 text-ink/80 leading-relaxed">{description}</p>
    </section>
  )
}
