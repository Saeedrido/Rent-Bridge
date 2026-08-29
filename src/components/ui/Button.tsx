import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface BaseProps {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded transition-colors cursor-pointer focus-visible:outline-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange-hover',
  outline: 'bg-transparent text-green border border-green/40 hover:border-green hover:bg-green/5',
  ghost: 'bg-transparent text-ink hover:text-orange',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-[15px] px-6 py-3',
  lg: 'text-[15px] px-8 py-4',
}

type ButtonAsButton = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type ButtonAsLink = BaseProps & { to: string }

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', fullWidth, className, children } = props
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    )
  }

  const raw = { ...(props as ButtonAsButton) } as Record<string, unknown>
  delete raw.variant
  delete raw.size
  delete raw.fullWidth
  delete raw.className
  delete raw.children
  delete raw.to
  const native = raw as unknown as ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button className={classes} {...native}>
      {children}
    </button>
  )
}
