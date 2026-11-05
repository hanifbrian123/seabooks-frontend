import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Anchor, Compass, LogOut, Menu, Ship, Users, Wallet, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/trips', label: 'Trips & Accounting', icon: Compass },
  { to: '/vessels', label: 'Vessels', icon: Ship },
  { to: '/crew', label: 'Crew (ABK)', icon: Users },
  { to: '/kasbon', label: 'Cash Advances (Kasbon)', icon: Wallet },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-brand-navy/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Sidebar (#FFFFFF) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-surface border-r border-brand-secondary flex flex-col transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-brand-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center text-brand-surface shadow-xs shrink-0">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-brand-navy block leading-none">
                FishCatch
              </span>
              <span className="text-xs text-brand-navy/60 font-medium">
                Fleet & Accounting
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary md:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-brand-navy/50">
            Operations Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-accent text-brand-surface shadow-xs'
                      : 'text-brand-navy/80 hover:bg-brand-secondary hover:text-brand-navy'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* User Account & Sign Out Footer */}
        <div className="p-4 border-t border-brand-secondary space-y-2.5">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-secondary/60">
            <div className="w-9 h-9 rounded-lg bg-brand-accent text-brand-surface font-bold text-xs flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-brand-navy truncate">
                {user?.name || 'Fleet Owner'}
              </p>
              <p className="text-[11px] text-brand-navy/60 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-brand-secondary hover:bg-red-50 text-brand-navy hover:text-red-600 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{user?.isDemo ? 'End Demo & Delete Data' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (#FAFAFD) */}
      <div className="flex-1 flex flex-col min-w-0">
        {user?.isDemo && (
          <div className="bg-brand-accent text-brand-surface px-4 py-2 text-xs font-medium flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Interactive Demo Mode:</strong> This temporary account comes pre-loaded with sample data. Everything you change is isolated and will be automatically deleted when you end the demo or when the session expires.
            </span>
            <button
              onClick={logout}
              className="px-2.5 py-1 rounded-lg bg-brand-surface text-brand-navy font-bold text-[11px] hover:opacity-90 transition cursor-pointer shrink-0"
            >
              End Demo Now
            </button>
          </div>
        )}
        {/* Mobile Toggle Bar */}
        <div className="md:hidden h-14 bg-brand-surface border-b border-brand-secondary px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-brand-surface">
              <Anchor className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-brand-navy">FishCatch</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-brand-navy hover:bg-brand-secondary cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
