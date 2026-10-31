import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials, formatRelativeTime } from '../../utils/index';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/index';
import { toast } from 'sonner';

export default function Topbar({ onToggleSidebar, onMobileMenuOpen }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications', { limit: 5, isRead: false }],
    queryFn: () => notificationService.getNotifications({ limit: 5 }),
    refetchInterval: 60_000,
  });
  const unreadCount = notifData?.data?.data?.length || 0;

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <header className="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Desktop toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Menu size={18} />
        </button>
        {/* Mobile menu */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                <Link to="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifData?.data?.data?.length > 0 ? (
                  notifData.data.data.map((n) => (
                    <div key={n._id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  to="/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <User size={16} /> My Profile
                </Link>
                <Link
                  to="/settings/organization"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

