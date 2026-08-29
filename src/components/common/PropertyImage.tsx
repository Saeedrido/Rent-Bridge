import { cn } from '../../utils/cn'

interface PropertyImageProps {
  src: string
  alt: string
  className?: string
  eager?: boolean
}

export function PropertyImage({ src, alt, className, eager }: PropertyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('block w-full h-full object-cover', className)}
    />
  )
}
