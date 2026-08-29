import { Link } from 'react-router-dom'
import { Container } from './Container'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Verified listings', to: '/properties' },
      { label: 'Buy', to: '/buy' },
      { label: 'Rent', to: '/rent' },
      { label: 'How it works', to: '/#how' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'For landlords', to: '/dashboard' },
      { label: 'For agents & caretakers', to: '/dashboard' },
      { label: 'For lawyers', to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-green-dark" style={{ padding: '56px 28px 40px' }}>
      <Container>
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', borderBottom: '1px solid rgba(250,249,246,.16)', paddingBottom: 30 }}
        >
          {columns.map((col) => (
            <div key={col.title} className="grid content-start gap-2.5">
              <div className="font-bold uppercase text-orange-light text-[11px] tracking-[.12em]">{col.title}</div>
              {col.links.map((l) => (
                <Link key={l.label} to={l.to} className="no-underline text-cream/75 text-sm hover:text-orange-light transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="grid content-start gap-2.5">
            <div className="font-bold uppercase text-orange-light text-[11px] tracking-[.12em]">Get the app</div>
            <span className="text-cream/75 text-sm">Listings, lawyer review and escrow — in your pocket soon.</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3.5 pt-5 text-[12.5px] text-cream/50">
          <span>© 2026 Rent Bridge Technologies Ltd. Lagos, Nigeria.</span>
          <span>Verify. Review. Release.</span>
        </div>
      </Container>
    </footer>
  )
}
