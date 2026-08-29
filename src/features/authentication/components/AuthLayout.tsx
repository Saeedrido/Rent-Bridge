import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" aria-label="Rent Bridge home" className="block mb-[-30px]">
          <img
            src="/rentbridge-logo.png"
            alt="Rent Bridge"
            className="block"
            style={{ height: 150, width: 'auto', objectFit: 'contain' }}
          />
        </Link>
        {children}
      </div>
    </div>
  )
}
