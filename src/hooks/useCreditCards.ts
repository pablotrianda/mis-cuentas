import { useEffect, useState } from 'react'
import type { CreditCard } from '@miscuentas/shared'
import { db } from '../lib/db'

export function useCreditCards() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.creditCards.toArray()
      .then(setCards)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { cards, loading }
}
