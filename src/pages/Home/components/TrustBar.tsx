import { Container } from '../../../components/layout'

const items = [
  {
    label: 'NIN + facial verification',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5A97A" strokeWidth="1.4">
        <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
        <path d="M9 12l2.2 2.2L15.5 10" />
      </svg>
    ),
  },
  {
    label: 'Lawyer-reviewed agreements',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5A97A" strokeWidth="1.4">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
        <path d="M10 12h6M10 16h6" />
      </svg>
    ),
  },
  {
    label: 'Verified property ownership',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5A97A" strokeWidth="1.4">
        <path d="M4 11l8-6 8 6v9H4z" />
        <path d="M10 20v-6h4v6" />
      </svg>
    ),
  },
]

export function TrustBar() {
  return (
    <div className="bg-green" style={{ padding: 26 }}>
      <Container>
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}
        >
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-3.5 text-cream">
              {it.icon}
              <span className="font-medium" style={{ fontSize: 15 }}>
                {it.label}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
