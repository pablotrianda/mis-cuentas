interface CategoryChipProps {
  name: string
  color: string
}

export function CategoryChip({ name, color }: CategoryChipProps) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {name}
    </span>
  )
}
