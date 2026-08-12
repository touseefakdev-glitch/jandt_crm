import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import {
  LayoutDashboard,
  ShoppingBag,
  HelpCircle,
  Users,
  MoreHorizontal,
  ArrowLeftRight,
  AlertTriangle,
  Bell,
  Settings,
  LogOut,
  MapPin,
  Upload,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';

export const MobileBottomNav: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', path: '/orders', icon: ShoppingBag },
    { id: 'queries', label: 'Queries', path: '/queries', icon: HelpCircle },
    { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
  ];

  const handleMoreItemClick = (path: string) => {
    setIsMoreOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsMoreOpen(false);
    logout();
  };

  return (
    <>
      {/* Mobile Fixed Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE4EF] shadow-overlay md:hidden pb-safe"
      >
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive: linkActive }) =>
                  cn(
                    'flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all min-h-[44px]',
                    linkActive || isActive ? 'text-teal-600 font-extrabold' : 'text-[#7B8CA4] hover:text-[#132A4A]'
                  )
                }
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5 transition-transform', (isActive || location.pathname.startsWith(item.path)) && 'scale-110')} />
                  {(isActive || location.pathname.startsWith(item.path)) && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          <button
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all min-h-[44px]',
              isMoreOpen ? 'text-teal-600 font-extrabold' : 'text-[#7B8CA4] hover:text-[#132A4A]'
            )}
            aria-label="More navigation options"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Slide-up Sheet */}
      <Drawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        placement="bottom"
        title="CRM Operations Menu"
        icon={<ShieldCheck className="w-5 h-5 text-teal-600" />}
      >
        <div className="space-y-4 py-1">
          {/* Operational Shortcuts */}
          <div>
            <div className="text-2xs font-extrabold uppercase tracking-wider text-[#52606D] mb-2 px-1">Operations</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMoreItemClick('/shift-handover')}
                className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#132A4A] block leading-tight">Shift Handover</span>
                  <span className="text-[10px] text-[#7B8CA4] block">Team logs & handoff</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemClick('/out-of-stock')}
                className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-amber-400 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#132A4A] block leading-tight">Out of Stock</span>
                  <span className="text-[10px] text-[#7B8CA4] block">Unavailable items</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemClick('/products')}
                className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#132A4A] block leading-tight">Products Catalog</span>
                  <span className="text-[10px] text-[#7B8CA4] block">SKU repository</span>
                </div>
              </button>

              <button
                onClick={() => handleMoreItemClick('/notifications')}
                className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
              >
                <Bell className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#132A4A] block leading-tight">Notifications</span>
                  <span className="text-[10px] text-[#7B8CA4] block">System alerts</span>
                </div>
              </button>
            </div>
          </div>

          {/* Admin Shortcuts (Admin only) */}
          {isAdmin && (
            <div>
              <div className="text-2xs font-extrabold uppercase tracking-wider text-[#52606D] mb-2 px-1">Administration</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleMoreItemClick('/admin/routes')}
                  className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-[#132A4A]">Route Schedule</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick('/admin/import')}
                  className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
                >
                  <Upload className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-xs font-bold text-[#132A4A]">Data Imports</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick('/admin/users')}
                  className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-[#132A4A]">Users & Teams</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick('/admin/settings')}
                  className="flex items-center gap-2.5 p-3 rounded-card bg-[#F4F7FB] border border-[#DCE4EF] text-left hover:border-teal-400 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-xs font-bold text-[#132A4A]">System Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* User Account & Sign Out */}
          <div className="pt-2 border-t border-[#DCE4EF] flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#132A4A] truncate">{user.full_name}</p>
              <p className="text-[10px] text-[#7B8CA4] uppercase font-mono">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
};
