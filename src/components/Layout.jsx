import { NavLink, Outlet } from 'react-router-dom'
import { Anchor, Compass, Ship, Users, Wallet } from 'lucide-react'

const navItems = [
  { to: '/trips', label: 'Trips & Accounting', icon: Compass },
  { to: '/vessels', label: 'Vessels', icon: Ship },
  { to: '/crew', label: 'Crew (ABK)', icon: Users },
  { to: '/kasbon', label: 'Cash Advances (Kasbon)', icon: Wallet },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col">
      {/* Top Menu Bar (#FFFFFF) */}
      <header className="bg-brand-surface border-b border-brand-secondary sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-brand-surface shadow-xs">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-brand-navy block leading-none">
                FishCatch
              </span>
              <span className="text-xs text-brand-navy/60 font-medium">
                Fleet & Trip Accounting
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-accent text-brand-surface shadow-xs'
                        : 'text-brand-navy/80 hover:bg-brand-secondary hover:text-brand-navy'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Page Content (#FAFAFD) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

