import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  ArrowLeftRight,
  CreditCard,
  Users,
  FileText,
  Building,
  Settings,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/enter-revenue", label: "Enter Revenue", icon: DollarSign },
  { to: "/match-transactions", label: "Match Bank Transactions", icon: ArrowLeftRight },
  { to: "/pay-bills", label: "Pay Bills", icon: CreditCard },
  { to: "/payroll", label: "Enter Payroll & Adjustments", icon: Users },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/shop-details", label: "Shop Details", icon: Building },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-[#111827] text-gray-200">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-[#0f172a] border-r border-slate-700">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-base font-bold tracking-wide text-slate-100">
            AUTOACCOUNT
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700 bg-[#0f172a] px-6">
          {/* Search */}
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-slate-200">
              <Bell size={18} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500" />
            </button>
            <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100">
              <div className="h-7 w-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold">
                U
              </div>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
