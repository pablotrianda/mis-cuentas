import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/incomes', label: 'Ingresos' },
  { to: '/expenses', label: 'Gastos' },
  { to: '/settings', label: 'Ajustes' },
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
              `flex flex-1 flex-col items-center py-3 text-sm font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
