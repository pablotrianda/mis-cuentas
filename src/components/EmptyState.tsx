interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
      <div className="mb-3 text-4xl opacity-30">--</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}
