import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, icon, children, className = '' }: SectionCardProps) {
  return (
    <div className={`animate-fade-in rounded-xl bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  )
}
