import { useEffect, useRef, useState } from 'react'

const FULL = 'Rent Bridge'
const WRITE_MS = 100
const HOLD_FULL_MS = 600
const HOLD_EMPTY_MS = 300
const CYCLES = 3

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [typed, setTyped] = useState('')
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []
    const schedule = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    const runCycle = (cycle: number) => {
      let i = 0
      const typeNext = () => {
        if (cancelled) return
        setTyped(FULL.slice(0, i))
        if (i < FULL.length) {
          i += 1
          schedule(typeNext, WRITE_MS)
        } else {
          schedule(() => {
            setTyped('')
            schedule(() => {
              if (cycle < CYCLES) runCycle(cycle + 1)
              else onCompleteRef.current()
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
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cream">
      <div className="flex items-center" role="img" aria-label="Loading Rent Bridge">
        <span className="logo-spin block" aria-hidden="true">
          <svg width={84} height={84} viewBox="0 0 64 64" fill="none">
            <path d="M8 30 32 10l24 20v24a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="#124A28" />
            <path
              d="M8 30 32 10l24 20"
              stroke="#E4661F"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="27" y="34" width="10" height="22" rx="1.5" fill="#E4661F" />
            <path
              d="M14 52c0-5 3.6-9 8-9s8 4 8 9M34 52c0-5 3.6-9 8-9s8 4 8 9"
              stroke="#F5A97A"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>

        <div className="relative ml-4">
          <span className="invisible font-serif text-4xl font-bold text-green-dark whitespace-nowrap">
            Rent Bridge
          </span>
          <span className="absolute left-0 top-0 font-serif text-4xl font-bold text-green-dark whitespace-nowrap">
            {typed}
            <span className="typed-caret" />
          </span>
        </div>
      </div>
    </div>
  )
}
