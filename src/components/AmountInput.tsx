import { useRef, useCallback } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function formatAmount(raw: string): string {
  const parts = raw.split(',')
  const intPart = parts[0]!.replace(/\D/g, '')
  if (!intPart && (!parts[1] || parts[1] === '')) return raw
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return parts.length > 1 ? `${formattedInt},${parts[1]!.slice(0, 2)}` : formattedInt
}

export function AmountInput({ value, onChange, placeholder = '$ 0,00' }: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,]/g, '')
    const parts = raw.split(',')
    if (parts.length > 2) return
    if (parts[1] !== undefined && parts[1].length > 2) return

    const cursor = e.target.selectionStart ?? 0
    const dotsBefore = (e.target.value.slice(0, cursor).match(/\./g) || []).length
    const rawCursor = cursor - dotsBefore

    const formatted = formatAmount(raw)
    onChange(formatted)

    requestAnimationFrame(() => {
      if (!inputRef.current) return
      const formattedBefore = formatted.slice(0, rawCursor)
      const newCursor = rawCursor + (formattedBefore.match(/\./g) || []).length
      inputRef.current.setSelectionRange(newCursor, newCursor)
    })
  }, [onChange])

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-secondary">
        $
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
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
