interface IconProps {
  className?: string
}

const base = {
  width: 30,
  height: 30,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function HouseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function HeartOutlineIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.5s-7-4.3-9.5-8.4C.8 8.6 2.3 5.5 5.4 5.5c2 0 3.3 1.1 4.6 2.7C11.3 6.6 12.6 5.5 14.6 5.5c3.1 0 4.6 3.1 3 6.6C19 16.2 12 20.5 12 20.5z" />
    </svg>
  )
}

export function ScalesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v16" />
      <path d="M6 20h12" />
      <path d="M5 7h14" />
      <path d="M5 7 2 13h6z" />
      <path d="M19 7 16 13h6z" />
    </svg>
  )
}
