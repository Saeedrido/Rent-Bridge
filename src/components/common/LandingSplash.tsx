import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'

const FULL = 'Rent Bridge'
const WRITE_MS = 80
const HOLD_FULL_MS = 800
const HOLD_EMPTY_MS = 200
const CYCLES = 2

interface SplashProps {
  onComplete: () => void
}

export function LandingSplash({ onComplete }: SplashProps) {
  const location = useLocation()
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'typing' | 'hold' | 'reveal' | 'done'>('typing')
  const [showContent, setShowContent] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Skip if not on landing page or already completed
  useEffect(() => {
    if (location.pathname !== '/') {
      onCompleteRef.current()
      return
    }
  }, [location])

  useEffect(() => {
    if (location.pathname !== '/') {
      onCompleteRef.current()
      return
    }

    let cancelled = false
    const timers: number[] = []
    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const runCycle = (cycle: number) => {
      let i = 0
      const typeNext = () => {
        if (cancelled || location.pathname !== '/') return
        setTyped(FULL.slice(0, i))
        if (i < FULL.length) {
          i += 1
          schedule(typeNext, WRITE_MS)
        } else {
          // Hold full text
          schedule(() => {
            if (cancelled || location.pathname !== '/') return
            setPhase('hold')
            schedule(() => {
              if (cancelled || location.pathname !== '/') return
              setTyped('')
              setPhase('typing')
              if (cycle < CYCLES) {
                runCycle(cycle + 1)
              } else {
                setPhase('reveal')
                setShowContent(true)
                schedule(() => {
                  onCompleteRef.current()
                  setPhase('done')
                }, 400)
              }
            }, HOLD_EMPTY_MS)
          }, HOLD_FULL_MS)
        }
      }
      typeNext()
    }

    runCycle(1)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [location])

  if (location.pathname !== '/') return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-cream transition-opacity duration-700',
        showContent ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      role="img"
      aria-label="Loading Rent Bridge"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green/10 blur-3xl animate-[pulse_3s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-orange/5 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Animated house logo with construction lines */}
        <div className="relative">
          <svg
            className={cn(
              'block',
              phase === 'reveal' && 'animate-[fadeOut_0.5s_ease-out_forwards]'
            )}
            width={120}
            height={120}
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            {/* Construction lines that draw in */}
            <g className={cn('stroke-green-dark stroke-2.5', phase === 'typing' && 'animate-[drawLine_1.5s_ease-out_forwards]')}>
              <path d="M8 30 32 10l24 20v24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            
            {/* House fill that appears on hold */}
            <g className={cn('fill-green-dark', phase === 'hold' && 'animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]')}>
              <path d="M8 30 32 10l24 20v24a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
            </g>

            {/* Roof accent */}
            <g className={cn('fill-orange', phase === 'hold' && 'animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards_0.1s]')}>
              <path d="M8 30 32 10l24 20" stroke="orange" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Door that animates last */}
            <g className={cn('fill-orange', phase === 'hold' && 'animate-[popIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards_0.2s]')}>
              <rect x="27" y="34" width="10" height="22" rx="1.5" />
            </g>

            {/* Windows that blink in */}
            <g className={cn('stroke-cream stroke-2.5', phase === 'hold' && 'animate-[blinkIn_0.5s_ease-out_forwards_0.3s]')}>
              <path d="M14 52c0-5 3.6-9 8-9s8 4 8 9M34 52c0-5 3.6-9 8-9s8 4 8 9" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          </svg>

          {/* Text typing animation */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
            <span className="font-serif text-3xl font-bold text-green-dark whitespace-nowrap invisible">
              Rent Bridge
            </span>
            <span className="absolute left-0 top-0 font-serif text-3xl font-bold text-green-dark whitespace-nowrap">
              {typed}
              <span className={cn('typed-caret', phase === 'typing' && 'animate-blink')} />
            </span>
          </div>
        </div>

        {/* Tagline that fades in */}
        <p
          className={cn(
            'text-center text-ink/70 text-lg font-medium mt-6',
            phase === 'hold' && 'animate-[fadeInUp_0.6s_ease-out_forwards]',
            phase === 'reveal' && 'animate-[fadeOut_0.5s_ease-out_forwards]'
          )}
          style={{ animationDelay: '300ms' }}
        >
          Verified homes. Lawyer-reviewed leases. No agent wahala.
        </p>

        {/* Progress indicator */}
        <div
          className={cn(
            'mt-8 w-64 h-1 bg-green/20 rounded-full overflow-hidden',
            phase === 'reveal' && 'animate-[fadeOut_0.5s_ease-out_forwards]'
          )}
        >
          <div
            className={cn(
              'h-full bg-gradient-to-r from-green to-orange rounded-full',
              phase === 'typing' && 'animate-[progress_1.5s_ease_out_infinite]',
              phase === 'hold' && 'animate-[progressComplete_0.8s_ease-out_forwards]',
              phase === 'reveal' && 'w-full'
            )}
          />
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => {
          onCompleteRef.current()
        }}
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-ink/50 hover:text-forest transition-colors',
          showContent && 'pointer-events-none opacity-0'
        )}
      >
        Skip
      </button>

      {/* Reveal content overlay */}
      {showContent && (
        <div
          className="absolute inset-0 bg-cream z-10 flex items-center justify-center animate-[fadeIn_0.6s_ease-out_forwards]"
        >
          <div className="text-center">
            <span className="font-serif text-5xl font-bold text-green-dark animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
              Rent Bridge
            </span>
            <p className="mt-4 text-ink/70 text-xl animate-[fadeInUp_0.6s_ease-out_forwards_0.2s]">
              Welcome home. Let's find your verified property.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}