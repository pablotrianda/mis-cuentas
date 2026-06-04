import { useEffect, useState } from 'react'
import type { ExpenseCategory } from '../lib/shared-types'
import { db } from '../lib/db'
import { ensureDefaultCategories } from '../lib/db'

export function useCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ensureDefaultCategories().then(() =>
      db.expenseCategories.toArray()
        .then(setCategories)
        .catch(() => {})
        .finally(() => setLoading(false))
    )
  }, [])

  return { categories, loading }
}
