interface ProgressIndicatorProps {
  value: number
}

export function ProgressIndicator({ value }: ProgressIndicatorProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-green/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}
