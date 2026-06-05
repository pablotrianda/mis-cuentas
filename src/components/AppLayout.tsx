import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { InstallAppButton } from './InstallAppButton'
import { PortfolioPromoModal } from './PortfolioPromoModal'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg font-nunito">
      <PortfolioPromoModal imageUrl="/images/banner_kerux.png" />
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="h-6 w-6" />
          <h1 className="text-lg font-bold text-text-primary">MisCuentas</h1>
        </div>
      </header>
      <main className="px-4 pb-24 pt-4">
        <InstallAppButton />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
