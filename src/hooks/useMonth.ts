import { useState } from 'react'

function getCurrentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y! * 12 + (m! - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}

export function useMonth(initial?: string) {
  const [month, setMonth] = useState(initial ?? getCurrentMonth())
  return {
    month,
    prevMonth: () => setMonth((m) => addMonths(m, -1)),
    nextMonth: () => setMonth((m) => addMonths(m, 1)),
    setMonth,
  }
}
