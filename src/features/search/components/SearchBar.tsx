import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ListingType } from '../../properties/types/property'
import { Input, Button } from '../../../components/ui'
import { cn } from '../../../utils/cn'

interface SearchBarProps {
  className?: string
}

export function SearchBar({ className }: SearchBarProps) {
  const navigate = useNavigate()
  const [type, setType] = useState<ListingType>('rent')
  const [location, setLocation] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/${type}`, { state: { location } })
  }

  return (
    <form onSubmit={submit} className={cn("mx-auto w-full max-w-2xl", className)}>
      <div className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-[0_22px_40px_-30px_rgba(18,74,40,.5)] border border-green/15 sm:flex-row sm:items-center">
        <div className="flex rounded-md border border-green/15 p-1">
          {(['rent', 'buy'] as ListingType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded px-4 py-2 text-sm font-semibold capitalize transition-colors',
                type === t ? 'bg-green text-white' : 'text-ink hover:text-green',
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, area or neighbourhood"
          aria-label="Location"
          className="flex-1 border-0 focus:ring-0"
        />
        <Button type="submit">Search</Button>
      </div>
    </form>
  )
}
