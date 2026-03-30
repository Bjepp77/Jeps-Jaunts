interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectFieldProps<T extends string> {
  id: string
  label: string
  value: T
  options: ReadonlyArray<SelectOption<T>>
  helperText?: string
  onChange: (value: T) => void
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  helperText,
  onChange,
}: SelectFieldProps<T>) {
  const helperId = helperText ? `${id}-helper` : undefined

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={id}
        className="text-xs tracking-widest uppercase font-body text-brown-muted select-none"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-describedby={helperId}
        className="editorial-select w-full border border-hairline rounded-md px-3 py-3 text-sm text-charcoal bg-section font-body focus:outline-none focus-visible:ring-1 focus-visible:ring-olive/40 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

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
