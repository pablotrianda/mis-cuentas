import { NavLink } from 'react-router-dom'
import { Home, TrendingUp, TrendingDown, Settings } from 'lucide-react'

const links = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/incomes', label: 'Ingresos', icon: TrendingUp },
  { to: '/expenses', label: 'Gastos', icon: TrendingDown },
  { to: '/settings', label: 'Ajustes', icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-2xl">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }
          >
            <link.icon className="h-6 w-6" />
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
