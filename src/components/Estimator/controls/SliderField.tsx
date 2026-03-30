interface SliderFieldProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  helperText?: string
  valueLabel?: (v: number) => string
  onChange: (value: number) => void
}

export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  helperText,
  valueLabel,
  onChange,
}: SliderFieldProps) {
  const helperId = helperText ? `${id}-helper` : undefined
  const displayValue = valueLabel ? valueLabel(value) : String(value)
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-4">
      {/* Label row */}
      <div className="flex items-baseline justify-between gap-4">
        <label
          htmlFor={id}
          className="text-xs tracking-widest uppercase font-body text-brown-muted select-none"
        >
          {label}
        </label>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="text-2xl font-display text-charcoal tabular-nums leading-none"
        >
          {displayValue}
        </span>
      </div>

      {/* Track */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={helperId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        className="editorial-slider"
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
      />

      {/* Range endpoints */}
      <div className="flex justify-between text-xs text-brown-muted font-body italic select-none">
        <span>{valueLabel ? valueLabel(min) : min}</span>
        <span>{valueLabel ? valueLabel(max) : max}</span>
      </div>

      {/* Helper */}
      {helperText && (
        <p
          id={helperId}
          className="text-xs text-brown-muted font-body italic leading-relaxed"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
