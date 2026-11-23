import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Flame,
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  LogOut,
  LogIn,
  BookOpen,
  Layers,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isKitchen = user?.role === 'kitchen';
  const isWaiter = user?.role === 'waiter';

  const getRoleBadge = (role) => {
    switch (role) {
      case 'kitchen':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-brand-500/20 text-brand-400 border border-brand-500/30';
    }
  };

  return (
    <header className="bg-gray-950 border-b border-gray-800 text-white sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight">
              Restro<span className="text-brand-400">Flow</span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links - STRICT ROLE SEPARATION */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-gray-900/90 p-1 rounded-2xl border border-gray-800">
            {/* Waiter Station: only for Waiter or Admin (Kitchen CANNOT see or access) */}
            {(isWaiter || isAdmin) && (
              <Link
                to="/waiter"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/waiter'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Waiter (Order Taking)
              </Link>
            )}

            {/* Kitchen Station: only for Kitchen or Admin (Waiters CANNOT see or access) */}
            {(isKitchen || isAdmin) && (
              <Link
                to="/kitchen"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/kitchen'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Kitchen Display
              </Link>
            )}

            {/* All Orders Central Hub: visible to all authenticated staff */}
            <Link
              to="/orders"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname.startsWith('/orders') && location.pathname !== '/orders/new'
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              All Orders
            </Link>

            {/* Admin Only: Menu Configuration */}
            {isAdmin && (
              <Link
                to="/menu"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/menu'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Manage Menu
              </Link>
            )}

            {/* Admin Only: Table Layout & Insertion */}
            {isAdmin && (
              <Link
                to="/tables"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  location.pathname === '/tables'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dining Tables
              </Link>
            )}
          </nav>
        )}

        {/* User Profile / Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-gray-900 py-1.5 px-3 rounded-2xl border border-gray-800">
                <div className="w-7 h-7 bg-gray-800 rounded-xl flex items-center justify-center text-xs font-black text-gray-200">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                  <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-gray-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl transition-all border border-gray-800"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-brand-500/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
