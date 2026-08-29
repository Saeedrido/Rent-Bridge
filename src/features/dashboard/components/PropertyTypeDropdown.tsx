import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../utils/cn'
import { ChevronDownIcon } from './icons'

export const APARTMENT_TYPES = [
  { value: 'all', label: 'All types' },
  { value: '1-bedroom', label: '1-bedroom' },
  { value: '2-bedroom', label: '2-bedroom' },
  { value: '3-bedroom', label: '3-bedroom' },
  { value: 'flat', label: 'Flat' },
  { value: 'mini-flat', label: 'Mini flat' },
  { value: 'self-contained', label: 'Self-contained' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'apartment', label: 'Apartment' },
]

interface PropertyTypeDropdownProps {
  value: string
  onChange: (value: string) => void
}

export function PropertyTypeDropdown({ value, onChange }: PropertyTypeDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = APARTMENT_TYPES.find((o) => o.value === value) ?? APARTMENT_TYPES[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between rounded border border-green/20 bg-white px-3.5 py-2.5 text-left text-[15px] text-ink transition-colors',
          open ? 'border-orange' : 'hover:border-green/40 focus:border-orange focus:outline-none',
        )}
      >
        <span className={value === 'all' ? '!text-green/50' : '!text-green-dark'}>{selected.label}</span>
        <ChevronDownIcon className={cn('text-ink/50 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded border border-green/15 bg-white py-1 shadow-lg"
        >
          {APARTMENT_TYPES.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center px-3.5 py-2 text-left text-[15px] transition-colors hover:bg-green/5',
                  option.value === value ? 'font-semibold text-green-dark' : 'text-green-dark',
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
