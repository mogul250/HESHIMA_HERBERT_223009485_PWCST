import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  LogIn,
  Users,
  ShieldCheck,
  Zap,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function Home() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isWaiter = user?.role === 'waiter';
  const isKitchen = user?.role === 'kitchen';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-gray-800/80 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Restro<span className="text-brand-400">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Signed in as <strong className="text-white">{user?.name}</strong> ({user?.role})
                </span>
                <Link
                  to={user?.role === 'kitchen' ? '/kitchen' : '/waiter'}
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  Go to Station →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary py-2 px-4 text-xs font-bold"
                >
                  Register Staff
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-6">
            <Zap className="w-4 h-4" /> Real-time Restaurant POS & Kitchen Display
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Seamless Dining Flow from <span className="text-brand-400">Table</span> to{' '}
            <span className="text-emerald-400">Kitchen</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-4 max-w-xl mx-auto">
            Order placement, live kitchen queue, order progression, and waiter table delivery — synchronized with WebSockets.
          </p>
        </div>

        {/* Main Station / Role Portals (Strictly filtered by role) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-16">
          {/* Waiter Card: Only visible to Waiters, Admins, or Guests */}
          {(!isAuthenticated || isWaiter || isAdmin) && (
            <Link
              to="/waiter"
              className="group relative bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-brand-500/50 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-brand-500/20 border border-brand-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-brand-500/30 transition-colors">
                  <UtensilsCrossed className="w-7 h-7 text-brand-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-white">Waiter Station</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full">
                    Waiter Only
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Connect to table, browse visual menu, add customer items & special instructions, submit order to kitchen, and mark as <strong>Served</strong> when ready!
                </p>
              </div>
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-brand-400 text-xs font-bold group-hover:text-brand-300">
                <span>Open Waiter Panel</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* Kitchen Card: Only visible to Kitchen, Admins, or Guests */}
          {(!isAuthenticated || isKitchen || isAdmin) && (
            <Link
              to="/kitchen"
              className="group relative bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-emerald-500/50 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/30 transition-colors">
                  <ChefHat className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-white">Kitchen Display (KDS)</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Kitchen Only
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Receive new orders in real-time with chime alert. Click <strong>"Start Preparing"</strong> and advance to <strong>"Mark as Ready"</strong> when cooked!
                </p>
              </div>
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-emerald-400 text-xs font-bold group-hover:text-emerald-300">
                <span>Open Kitchen Screen</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* All Orders Card: visible to all authenticated staff & guests */}
          <Link
            to="/orders"
            className="group relative bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-blue-500/50 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-500/30 transition-colors">
                <ClipboardList className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-black text-white">All Orders Hub</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  All Staff
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                View all restaurant orders, filter by status (Pending, Preparing, Ready, Served), search, inspect itemized receipts, and track orders.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-blue-400 text-xs font-bold group-hover:text-blue-300">
              <span>View All Orders</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Admin Only Portal: Menu Management */}
          {isAdmin && (
            <Link
              to="/menu"
              className="group relative bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-purple-500/50 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-500/30 transition-colors">
                  <BookOpen className="w-7 h-7 text-purple-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-white">Menu Management</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Add new gourmet dishes, set prices in RWF, toggle stock availability, and manage restaurant catalog.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-purple-400 text-xs font-bold group-hover:text-purple-300">
                <span>Manage Menu</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* Admin Only Portal: Tables Management */}
          {isAdmin && (
            <Link
              to="/tables"
              className="group relative bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-purple-500/50 rounded-3xl p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-purple-500/30 transition-colors">
                  <Layers className="w-7 h-7 text-purple-400" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-white">Dining Tables Setup</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Insert new dining tables into the restaurant layout, configure seating capacity, and monitor table occupancy.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-purple-400 text-xs font-bold group-hover:text-purple-300">
                <span>Configure Tables</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}
        </div>

        {/* How The Entire Lifecycle Works (Explaining step-by-step) */}
        <div className="w-full bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
          <h3 className="text-center text-lg font-black text-white mb-6">
            🔄 How The Order Lifecycle Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/60 text-center">
              <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-black text-xs inline-flex items-center justify-center mb-3">
                1
              </span>
              <h4 className="font-bold text-xs text-white mb-1">Waiter Takes Order</h4>
              <p className="text-[11px] text-gray-400">
                Chooses table, adds dishes & notes, sends to kitchen. Status: <span className="text-amber-400 font-bold">Pending</span>.
              </p>
            </div>

            <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/60 text-center">
              <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-black text-xs inline-flex items-center justify-center mb-3">
                2
              </span>
              <h4 className="font-bold text-xs text-white mb-1">Kitchen Starts Cooking</h4>
              <p className="text-[11px] text-gray-400">
                Chef receives chime, clicks <strong>"Start Preparing"</strong>. Status: <span className="text-blue-400 font-bold">Preparing</span>.
              </p>
            </div>

            <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/60 text-center">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs inline-flex items-center justify-center mb-3">
                3
              </span>
              <h4 className="font-bold text-xs text-white mb-1">Kitchen Marks Done</h4>
              <p className="text-[11px] text-gray-400">
                Chef clicks <strong>"Mark as Ready"</strong>. Waiter gets instant alert! Status: <span className="text-emerald-400 font-bold">Ready</span>.
              </p>
            </div>

            <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/60 text-center">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 font-black text-xs inline-flex items-center justify-center mb-3">
                4
              </span>
              <h4 className="font-bold text-xs text-white mb-1">Waiter Marks Served</h4>
              <p className="text-[11px] text-gray-400">
                Waiter delivers dishes to table and clicks <strong>"Mark as Served"</strong>! Status: <span className="text-gray-300 font-bold">Served</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-6 text-center text-xs text-gray-500">
        RestroFlow — Built with React + Express + MongoDB & Socket.IO
      </footer>
    </div>
  );
}

export default Home;
