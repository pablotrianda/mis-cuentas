import { useCategories } from '../../hooks/useCategories'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export function CategoriesPage() {
  const { categories, loading } = useCategories()

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-text-primary">Categorías de gasto</h2>
      {categories.map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: `${c.color}20`, color: c.color }}
          >
            {c.icon.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{c.name}</p>
            {c.isDefault && (
              <span className="text-[10px] text-text-secondary">Por defecto</span>
            )}
          </div>
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: c.color }}
          />
        </div>
      ))}
    </div>
  )
}
