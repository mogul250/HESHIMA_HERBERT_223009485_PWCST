import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Search,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
  Eye,
  RefreshCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getOrders, updateOrderStatus, cancelOrder } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'served', label: 'Served' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGES = {
  pending: { label: 'Pending', class: 'badge-pending', icon: Clock },
  preparing: { label: 'Preparing', class: 'badge-preparing', icon: ChefHat },
  ready: { label: 'Ready for Pickup', class: 'badge-ready animate-pulse', icon: CheckCircle2 },
  served: { label: 'Served', class: 'badge-served', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled', icon: XCircle },
};

export default function AllOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 9, hasMore: false });

  // States: Loading, Empty, Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const isKitchen = user?.role === 'kitchen';

  const loadAllOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders({
        status: activeTab,
        search: searchQuery,
        page,
        limit: 9,
      });

      if (data.orders) {
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    loadAllOrders();
  }, [loadAllOrders]);

  // Real-time socket sync
  useSocket('orders-hub', {
    'new-order': () => loadAllOrders(),
    'order-updated': (updated) => {
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    },
  });

  const handleStatusUpdate = async (orderId, newStatus) => {
    setActionError(null);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success(`Order moved to ${newStatus.toUpperCase()}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Status update failed';
      setActionError(msg);
      toast.error(msg, { duration: 5000 });
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o))
      );
      toast.success('Order cancelled');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Page Title & Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <ClipboardList className="w-8 h-8 text-brand-400" />
              All Orders Management
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live tracking, status updates, and history across all restaurant stations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* ONLY WAITERS OR ADMIN CAN CREATE ORDERS - KITCHEN IS STRICTLY BLOCKED */}
            {!isKitchen && (
              <Link
                to="/orders/new"
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Order (Waiter)
              </Link>
            )}

            <button
              onClick={loadAllOrders}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mb-6 bg-red-950/80 border border-red-500/60 text-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="text-red-300 block font-bold mb-0.5">
                Status Transition Rejected by Server
              </strong>
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Fetch Error State */}
        {error && (
          <div className="card p-8 text-center bg-red-950/40 border-red-500/40 mb-6">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <h3 className="font-bold text-white text-sm">Failed to Load Orders</h3>
            <p className="text-xs text-red-300 mt-1 mb-4">{error}</p>
            <button
              onClick={loadAllOrders}
              className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Retry Fetch
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="card p-3 mb-6 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center border border-gray-800">
          {/* Status Tabs */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table, waiter, food..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-12 h-12 bg-gray-800 rounded-2xl" />
                  <div className="w-20 h-6 bg-gray-800 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
                <div className="h-8 bg-gray-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && orders.length === 0 && (
          <div className="card p-16 text-center border-dashed border-gray-800">
            <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">No orders found</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              There are no orders matching your current filter or search criteria.
            </p>
            {!isKitchen && (
              <Link
                to="/orders/new"
                className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Order
              </Link>
            )}
          </div>
        )}

        {/* ORDERS GRID */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {orders.map((order) => {
                const badge = STATUS_BADGES[order.status] || STATUS_BADGES.pending;
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={order._id}
                    className="card p-5 flex flex-col justify-between hover:border-gray-700 transition-all"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-950 border border-gray-800 text-white rounded-2xl flex flex-col items-center justify-center">
                            <span className="text-[9px] text-gray-400 leading-none font-bold">TBL</span>
                            <span className="text-lg font-black leading-tight text-white">
                              #{order.tableNumber}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              Table #{order.tableNumber}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              By {order.waiterName || 'Staff'} ·{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={badge.class}>
                          <BadgeIcon className="w-3.5 h-3.5 mr-1" />
                          {badge.label}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="bg-gray-950/70 border border-gray-800/80 rounded-xl p-3 space-y-1.5 my-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-gray-300">
                            <span>
                              <strong className="text-white">{item.quantity}×</strong> {item.name}
                              {item.notes && (
                                <span className="text-amber-400 ml-1">({item.notes})</span>
                              )}
                            </span>
                            <span className="font-semibold text-gray-400">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/20 p-2 rounded-lg mb-3">
                          📌 {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Footer with Status Progression Actions */}
                    <div className="pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400 font-medium">Order Total</span>
                        <span className="text-base font-black text-white">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Link to Detail Page */}
                        <Link
                          to={`/orders/${order._id}`}
                          className="p-2.5 rounded-xl border border-gray-800 bg-gray-950 hover:bg-gray-800 text-gray-300 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Status Transition Actions */}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'preparing')}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            Start Cooking
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'ready')}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Ready (Done)
                          </button>
                        )}

                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'served')}
                            className="flex-1 py-2 px-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-500/20 animate-bounce"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            Mark as Served
                          </button>
                        )}

                        {order.status === 'served' && (
                          <span className="flex-1 py-2 text-center text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            ✓ Successfully Served
                          </span>
                        )}

                        {['pending', 'preparing'].includes(order.status) && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between card px-5 py-3 border border-gray-800">
                <span className="text-xs text-gray-400">
                  Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
                  <strong className="text-white">{pagination.totalPages}</strong> (
                  {pagination.total} total orders)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl border border-gray-800 bg-gray-950 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-300" />
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="p-2 rounded-xl border border-gray-800 bg-gray-950 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
