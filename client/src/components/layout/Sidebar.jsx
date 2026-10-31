import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, Activity, CheckSquare,
  Bot, BarChart3, Settings, X, TrendingUp, Bell, UserCheck, Brain,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, to: '/' },
  { label: 'Leads', icon: UserCheck, to: '/leads' },
  { label: 'Contacts', icon: Users, to: '/contacts' },
  { label: 'Companies', icon: Building2, to: '/companies' },
  { label: 'Deals & Pipeline', icon: TrendingUp, to: '/pipeline' },
  { label: 'Activities', icon: Activity, to: '/activities' },
  { label: 'Tasks', icon: CheckSquare, to: '/tasks' },
];

const aiItems = [
  { label: 'AI Assistant', icon: Bot, to: '/ai/assistant' },
  { label: 'Email Generator', icon: Brain, to: '/ai/email' },
  { label: 'Business Insights', icon: BarChart3, to: '/ai/insights' },
];

const bottomItems = [
  { label: 'Analytics', icon: BarChart3, to: '/analytics' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Settings', icon: Settings, to: '/settings/profile' },
];

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn('sidebar-link', isActive && 'sidebar-link-active')
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Nexora</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">N</span>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Features</p>
          </div>
        )}
        {collapsed && <div className="my-2 border-t border-gray-100" />}

        {aiItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">More</p>
          </div>
        )}
        {collapsed && <div className="my-2 border-t border-gray-100" />}

        {bottomItems.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>
    </div>
  );
}

