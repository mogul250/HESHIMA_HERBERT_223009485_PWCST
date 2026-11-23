import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Timer,
  ArrowRightCircle,
  XCircle,
  Bell,
  RefreshCcw,
  UtensilsCrossed,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getOrders, updateOrderStatus } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';

const STATUS_COLUMNS = [
  {
    key: 'pending',
    label: '1. New Orders (Pending)',
    icon: Bell,
    color: 'amber',
    nextStatus: 'preparing',
    nextLabel: '👨‍🍳 Start Preparing',
  },
  {
    key: 'preparing',
    label: '2. Cooking (In Progress)',
    icon: Flame,
    color: 'blue',
    nextStatus: 'ready',
    nextLabel: '✅ Mark as Ready (Done)',
  },
  {
    key: 'ready',
    label: '3. Ready for Pickup',
    icon: CheckCircle2,
    color: 'emerald',
    nextStatus: 'served',
    nextLabel: '🍽️ Mark as Served',
  },
];

function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const audioRef = useRef(null);

  const handleNewOrder = useCallback((order) => {
    setOrders((prev) => {
      if (prev.some((o) => o._id === order._id)) return prev;
      return [order, ...prev];
    });
    toast.success(`🔔 New Order for Table #${order.tableNumber}!`, {
      duration: 6000,
      icon: '🍳',
    });
    try {
      audioRef.current?.play();
    } catch {}
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
    );
  }, []);

  useSocket('kitchen', {
    'new-order': handleNewOrder,
    'order-updated': handleOrderUpdate,
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders('active');
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load active orders');
      toast.error('Failed to load active orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (orderId, status) => {
    setActionError(null);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      const labels = {
        preparing: '👨‍🍳 In progress: Chef is cooking',
        ready: '✅ Ready: Waiter has been notified for pickup!',
        served: '🍽️ Served: Order successfully handed to table',
      };
      toast.success(labels[status] || 'Status updated');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update status';
      setActionError(msg);
      toast.error(msg, { duration: 5000 });
    }
  };

  const getElapsedTime = (createdAt) => {
    const diffMs = now - new Date(createdAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (createdAt, status) => {
    if (status !== 'pending' && status !== 'preparing') return 'text-gray-400';
    const mins = (now - new Date(createdAt).getTime()) / 60000;
    if (mins > 20) return 'text-red-400 font-black animate-pulse';
    if (mins > 10) return 'text-amber-400 font-bold';
    return 'text-emerald-400';
  };

  const getColumnOrders = (status) =>
    orders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      {/* Hidden audio for chime */}
      <audio ref={audioRef} preload="auto">
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJUyAo7uxdUM4R3eYq6J7Tj1FaY+hnIFXQEBlfpqXjGlLO1N0jpaOeV5HQV93kpOGb1VFR2h/jYyEclpJRGN+iIqGd2ROQGN7hIiGemNUQ2F4f4WFfGpdSGR5fYKBfm5gTmZ4eoB+fXFkU2l3eH19fXNnWGt2dnt7e3VqXm13dXl5eXdsYnF2c3d3eHdxaHR1cXV1dnVybnd0cHN0dXN0d3VwcnJzdHRzdXd1b3FycnR0c3V2dnBwcXJ0dHN0dnZxcHBxc3Nzc3V2cnBvcHJzdHNzdXZzcG9wcnNzc3N1dnNwb3BycnNzc3V2c3FvcHFyc3NzdHV0cXBwcXJzc3N0dXRxcHBxcnNzc3R0dHFxcHFyc3Jyc3R0cXFxcXJycnJzdHRxcXFxcnJycnN0dHJxcXFycnJyc3NzcnFxcXJycnJyc3NzcnFxcXJycnJyc3NzcnFxcXFycnJyc3NzcnFxcXFycnJyc3NzcnFxcXFycnJyc3NzcnFxcQ=="
          type="audio/wav"
        />
      </audio>

      {/* Kitchen Sub-bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Kitchen Display System (KDS)
              </h2>
              <p className="text-[11px] text-gray-400">
                Live queue for head chefs & kitchen staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              {getColumnOrders('pending').length} New Orders
            </span>
            <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
              <Flame className="w-3.5 h-3.5" />
              {getColumnOrders('preparing').length} Cooking Now
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {getColumnOrders('ready').length} Ready for Pickup
            </span>
            <button
              onClick={loadOrders}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-colors"
              title="Refresh queue"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Error Banner (e.g. invalid state transition: kitchen marks served before cooking) */}
      {actionError && (
        <div className="max-w-[1700px] w-full mx-auto px-4 pt-4">
          <div className="bg-red-950/80 border border-red-500/60 text-red-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-red-300 block font-bold mb-0.5">
                  Action Rejected by Server (State Machine Validation)
                </strong>
                <span>{actionError}</span>
              </div>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Global Fetch Error State */}
      {error && (
        <div className="max-w-lg mx-auto my-12 p-8 bg-red-950/40 border border-red-500/40 rounded-3xl text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <h3 className="font-bold text-white text-sm">Failed to connect to Kitchen Queue</h3>
          <p className="text-xs text-red-300 mt-1 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* LOADING SKELETON STATE */}
      {loading && !error && (
        <div className="flex-1 max-w-[1700px] w-full mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-8.5rem)]">
            {[1, 2, 3].map((col) => (
              <div key={col} className="bg-gray-900/60 rounded-3xl p-4 border border-gray-800 animate-pulse space-y-4">
                <div className="h-10 bg-gray-800 rounded-2xl" />
                <div className="h-40 bg-gray-800 rounded-2xl" />
                <div className="h-40 bg-gray-800 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3-Column Kanban Board */}
      {!loading && !error && (
        <div className="flex-1 max-w-[1700px] w-full mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-8.5rem)]">
            {STATUS_COLUMNS.map((col) => {
              const columnOrders = getColumnOrders(col.key);
              const ColIcon = col.icon;

              const styling = {
                amber: {
                  header: 'bg-amber-950/40 border-amber-500/40 text-amber-400',
                  badge: 'bg-amber-500 text-white',
                  card: 'border-amber-500/30 hover:border-amber-500/60 bg-gray-900/90',
                  btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
                },
                blue: {
                  header: 'bg-blue-950/40 border-blue-500/40 text-blue-400',
                  badge: 'bg-blue-500 text-white',
                  card: 'border-blue-500/30 hover:border-blue-500/60 bg-gray-900/90',
                  btn: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20',
                },
                emerald: {
                  header: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400',
                  badge: 'bg-emerald-500 text-white',
                  card: 'border-emerald-500/30 hover:border-emerald-500/60 bg-gray-900/90',
                  btn: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20',
                },
              }[col.color];

              return (
                <div key={col.key} className="flex flex-col min-h-0">
                  {/* Header */}
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-2xl border mb-3 backdrop-blur-sm ${styling.header}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ColIcon className="w-5 h-5" />
                      <h3 className="font-extrabold text-sm uppercase tracking-wide">
                        {col.label}
                      </h3>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-md ${styling.badge}`}
                    >
                      {columnOrders.length}
                    </span>
                  </div>

                  {/* Orders list */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                    {/* EMPTY COLUMN STATE */}
                    {columnOrders.length === 0 ? (
                      <div className="min-h-[220px] flex flex-col items-center justify-center border border-dashed border-gray-800/80 rounded-2xl bg-gray-900/30 text-gray-500 p-6 text-center">
                        <div className="w-10 h-10 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-2.5 text-gray-500">
                          <ColIcon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-400">No orders in this stage</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Orders automatically appear and move here
                        </p>
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <div
                          key={order._id}
                          className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-lg flex flex-col justify-between ${styling.card}`}
                        >
                          <div>
                            {/* Order Card Head */}
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/80">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/30 rounded-xl flex flex-col items-center justify-center shrink-0">
                                  <span className="text-[8px] text-brand-400 font-extrabold uppercase tracking-wider leading-none">
                                    TBL
                                  </span>
                                  <span className="text-base font-black text-white leading-tight">
                                    #{order.tableNumber}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-sm text-white">
                                    Table #{order.tableNumber}
                                  </h4>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {order.waiterName || 'Staff'} ·{' '}
                                    {new Date(order.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-gray-950/70 border border-gray-800 ${getTimeColor(
                                  order.createdAt,
                                  order.status
                                )}`}
                              >
                                <Timer className="w-3.5 h-3.5" />
                                {getElapsedTime(order.createdAt)}
                              </div>
                            </div>

                            {/* Item List */}
                            <div className="space-y-1.5 mb-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-950/60 border border-gray-800/70"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-gray-800 border border-gray-700/80 text-brand-400 text-xs font-black flex items-center justify-center shrink-0">
                                      {item.quantity}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-100 truncate">
                                        {item.name}
                                      </p>
                                      {item.notes && (
                                        <p className="text-[10px] text-amber-300 font-semibold bg-amber-950/50 border border-amber-500/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                          ⚠️ {item.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Special Notes */}
                            {order.notes && (
                              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-2 mb-3 text-xs text-amber-300 flex items-start gap-1.5">
                                <span className="shrink-0">📌</span>
                                <span>{order.notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Status Progression Button */}
                          <div className="pt-2 space-y-2">
                            <button
                              onClick={() => changeStatus(order._id, col.nextStatus)}
                              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all ${styling.btn}`}
                            >
                              <ArrowRightCircle className="w-4 h-4" />
                              {col.nextLabel}
                            </button>

                            {/* Break it on purpose test button for Pending orders */}
                            {order.status === 'pending' && (
                              <button
                                onClick={() => changeStatus(order._id, 'served')}
                                className="w-full py-1 text-[10px] text-gray-500 hover:text-red-400 hover:underline"
                                title="Attempt to mark served before cooking to test server validation"
                              >
                                [Test: Try Mark Served Before Cooking]
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default KitchenDashboard;
