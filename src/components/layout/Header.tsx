import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Button } from '../ui'
import { cn } from '../../utils/cn'

const navLinks = [
  { label: 'Buy', to: '/buy' },
  { label: 'Rent', to: '/rent' },
  { label: 'Listings', to: '/properties' },
  { label: 'Favorites', to: '/favorites' },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cn('text-sm font-medium no-underline transition-colors', isActive ? 'text-orange' : 'text-ink hover:text-orange')
}

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 bg-cream/95 backdrop-blur"
      style={{ borderBottom: '1px solid rgba(27,122,62,.14)' }}
    >
      <div
        className="flex w-full items-center gap-6"
        style={{ height: 92, paddingLeft: 'clamp(16px, 4vw, 64px)', paddingRight: 'clamp(16px, 4vw, 64px)' }}
      >
        <Link to="/" className="mr-auto flex items-center" aria-label="Rent Bridge home">
          <img
            src="/rentbridge-logo.png"
            alt="Rent Bridge"
            className="block"
            style={{ height: 150, width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {l.label}
            </NavLink>
          ))}
          <Button to="/login" variant="ghost">
            Log in
          </Button>
          <Button to="/register" size="sm">
            Get Started
          </Button>
        </nav>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="md:hidden flex flex-col gap-1 bg-none cursor-pointer"
          style={{ border: '1px solid rgba(27,122,62,.25)', borderRadius: 4, padding: '9px 11px' }}
        >
          <span className="block bg-green" style={{ width: 18, height: 1.5 }} />
          <span className="block bg-green" style={{ width: 18, height: 1.5 }} />
          <span className="block bg-green" style={{ width: 18, height: 1.5 }} />
        </button>
      </div>

      {open && (
        <div className="md:hidden flex flex-col gap-4" style={{ borderTop: '1px solid rgba(27,122,62,.14)', padding: '16px clamp(16px, 4vw, 64px) 22px' }}>
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={navClass}>
              {l.label}
            </NavLink>
          ))}
          <Button to="/login" variant="ghost" className="justify-start">
            Log in
          </Button>
          <Button to="/register" size="sm" className="self-start">
            Get Started
          </Button>
        </div>
      )}
    </header>
  )
}
