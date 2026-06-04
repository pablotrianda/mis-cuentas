interface StepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function Stepper({ value, min = 1, max = 999, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg font-bold text-text-primary transition-colors hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &minus;
      </button>
      <span className="min-w-[2ch] text-center text-lg font-bold text-text-primary tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg font-bold text-text-primary transition-colors hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  )
}
