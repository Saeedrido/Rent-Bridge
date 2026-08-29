import { useState } from 'react'
import type { Property } from '../types/property'
import { useFavorites } from '../../favorites/hooks/useFavorites'
import { Modal, Button, Input, Field } from '../../../components/ui'

export function PropertyActions({ property }: { property: Property }) {
  const { isFavorite, toggle } = useFavorites()
  const favorite = isFavorite(property.id)
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setOpen(false)
    }, 1800)
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, url })
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="rounded-card border border-green/15 bg-white p-6">
      <div className="flex items-center gap-3">
        <Button fullWidth onClick={() => setOpen(true)}>
          Request a viewing
        </Button>
        <button
          onClick={() => toggle(property.id)}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-green/30 text-orange hover:bg-orange/5 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={favorite ? '#E4661F' : 'none'} stroke="#E4661F" strokeWidth="1.8">
            <path d="M12 21s-7.5-4.6-10-9.3C.4 8.3 2 4.8 5.4 4.8c2 0 3.4 1.1 4.6 2.7C11.2 5.9 12.6 4.8 14.6 4.8c3.4 0 5 3.5 3.4 6.9C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
        <button
          onClick={share}
          aria-label="Share property"
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-green/30 text-green hover:bg-green/5 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
      </div>

      <div className="mt-5 border-t border-green/15 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green/10 font-serif text-green-dark">
            {property.landlord.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-ink">{property.landlord.name}</div>
            <div className="text-sm text-ink/60">{property.landlord.role}</div>
          </div>
        </div>
        {property.landlord.phone && (
          <a href={`tel:${property.landlord.phone.replace(/\s/g, '')}`} className="mt-3 block text-sm font-medium text-orange hover:underline">
            {property.landlord.phone}
          </a>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Request a viewing">
        {sent ? (
          <p className="text-center text-green-dark font-medium py-4">
            Thanks! The landlord will reach out to confirm your viewing.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name">
              <Input required name="name" placeholder="Your name" />
            </Field>
            <Field label="Email">
              <Input required type="email" name="email" placeholder="you@example.com" />
            </Field>
            <Field label="Phone">
              <Input required name="phone" placeholder="+234 ..." />
            </Field>
            <Field label="Preferred date">
              <Input required type="date" name="date" />
            </Field>
            <Field label="Message">
              <textarea
                name="message"
                rows={3}
                className="w-full rounded border border-green/20 bg-white px-3.5 py-2.5 text-ink text-[15px] focus:border-orange focus:outline-none"
                placeholder="Anything the landlord should know?"
              />
            </Field>
            <Button type="submit" fullWidth>
              Send request
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
