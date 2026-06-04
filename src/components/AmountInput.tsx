interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function AmountInput({ value, onChange, placeholder = '$ 0,00' }: AmountInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-secondary">
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d,]/g, '')
          const parts = raw.split(',')
          if (parts.length > 2) return
          const decimalPart = parts[1]
          if (decimalPart !== undefined && decimalPart.length > 2) return
          onChange(raw)
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-7 pr-4 text-lg font-bold text-text-primary outline-none transition-colors focus:border-primary"
      />
    </div>
  )
}

export function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function displayToCents(display: string): number {
  const normalized = display.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(normalized) * 100)
}
