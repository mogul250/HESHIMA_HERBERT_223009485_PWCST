import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle2,
  UtensilsCrossed,
  AlertCircle,
  RefreshCcw,
  Receipt,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getOrder, updateOrderStatus, cancelOrder } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

const STATUS_TIMELINE = [
  { key: 'pending', label: '1. Order Received', icon: Clock },
  { key: 'preparing', label: '2. Kitchen Cooking', icon: ChefHat },
  { key: 'ready', label: '3. Ready for Pickup', icon: CheckCircle2 },
  { key: 'served', label: '4. Served to Table', icon: UtensilsCrossed },
];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isKitchen = user?.role === 'kitchen';
  const isWaiter = user?.role === 'waiter';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found or server error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useSocket('order-detail', {
    'order-updated': (updated) => {
      if (updated._id === id) {
        setOrder(updated);
        toast(`Order updated: ${updated.status.toUpperCase()}`, { icon: '🔔' });
      }
    },
  });

  const handleStatusChange = async (targetStatus) => {
    setActionError(null);
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(id, targetStatus);
      setOrder(updated);
      toast.success(`Order moved to '${targetStatus.toUpperCase()}'!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Status transition rejected by server.';
      setActionError(msg);
      toast.error(msg, { duration: 5000 });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setUpdating(true);
    setActionError(null);
    try {
      await cancelOrder(id);
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
      toast.success('Order cancelled');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to cancel order';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'served':
        return 3;
      default:
        return -1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-900 px-3 py-2 rounded-xl border border-gray-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Orders
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="card p-16 text-center border-gray-800">
            <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-400">Loading order details...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="card p-12 text-center bg-red-950/40 border-red-500/40">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-white text-sm">Unable to load order</h3>
            <p className="text-xs text-red-300 mt-1 mb-4">{error}</p>
            <button
              onClick={fetchOrder}
              className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* ORDER CONTENT */}
        {!loading && !error && order && (
          <div className="space-y-6">
            {/* Action Validation Error Banner */}
            {actionError && (
              <div className="bg-red-950/80 border border-red-500/60 rounded-2xl p-4 flex items-start gap-3 shadow-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <strong className="text-red-300 block font-bold mb-0.5">
                    Transition Rejected by Server
                  </strong>
                  <span className="text-red-200">{actionError}</span>
                </div>
              </div>
            )}

            {/* Top Card: Order Info & Status */}
            <div className="card p-6 border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-950 border border-gray-800 text-white rounded-2xl flex flex-col items-center justify-center shadow-md">
                    <span className="text-[10px] text-gray-400 font-bold leading-none">TABLE</span>
                    <span className="text-xl font-black leading-tight text-white">#{order.tableNumber}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        {order.waiterName || 'Staff'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                      order.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                        : order.status === 'preparing'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : order.status === 'served'
                        ? 'bg-gray-800 text-gray-300 border-gray-700'
                        : order.status === 'cancelled'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              {order.status !== 'cancelled' ? (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    Status Progression Timeline
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STATUS_TIMELINE.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep >= idx;
                      const isCurrent = currentStep === idx;

                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-brand-500/10 border-brand-500/40 shadow-sm'
                              : isCompleted
                              ? 'bg-gray-950 border-gray-800 text-gray-200'
                              : 'bg-gray-900 border-dashed border-gray-800/60 text-gray-600'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold ${
                              isCurrent
                                ? 'bg-brand-500 text-white'
                                : isCompleted
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-950 text-gray-600'
                            }`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs font-bold block ${
                              isCurrent
                                ? 'text-brand-400 font-black'
                                : isCompleted
                                ? 'text-white'
                                : 'text-gray-500'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-red-950/40 p-4 rounded-2xl border border-red-500/30 text-center">
                  <p className="text-xs font-bold text-red-400">
                    This order was cancelled and cannot be reopened.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {order.status !== 'served' && order.status !== 'cancelled' && (
              <div className="card p-5 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Advance Order Status</h3>
                    <p className="text-xs text-gray-400">
                      Actions based on role ({user?.role || 'staff'})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Kitchen Action 1: Start Cooking (Kitchen or Admin only) */}
                    {(isKitchen || isAdmin) && order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('preparing')}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <ChefHat className="w-4 h-4" />
                        👨‍🍳 Start Cooking
                      </button>
                    )}

                    {/* Kitchen Action 2: Mark Ready (Kitchen or Admin only) */}
                    {(isKitchen || isAdmin) && order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange('ready')}
                        disabled={updating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        ✅ Mark Ready (Done)
                      </button>
                    )}

                    {/* Waiter Action: Mark Served (Waiter or Admin only) */}
                    {(isWaiter || isAdmin) && order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusChange('served')}
                        disabled={updating}
                        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md animate-bounce"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        🍽️ Deliver & Mark Served
                      </button>
                    )}

                    {/* Break it on purpose test */}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange('served')}
                        disabled={updating}
                        className="px-3 py-2 bg-gray-800 hover:bg-red-950 text-gray-400 hover:text-red-300 rounded-xl text-[11px] font-semibold border border-gray-700 transition-all"
                        title="Test server state validation"
                      >
                        ⚠️ Try Mark Served Early (Test)
                      </button>
                    )}

                    <button
                      onClick={handleCancelOrder}
                      disabled={updating}
                      className="px-3 py-2 bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-gray-700"
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Itemized Receipt Table in RWF */}
            <div className="card p-6 border-gray-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-400" />
                Itemized Receipt (RWF)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase">
                      <th className="py-2.5">Item</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Price (RWF)</th>
                      <th className="py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="text-gray-300">
                        <td className="py-3">
                          <p className="font-bold text-white">{item.name}</p>
                          {item.notes && (
                            <p className="text-[11px] text-amber-400">Note: {item.notes}</p>
                          )}
                        </td>
                        <td className="py-3 text-center font-bold text-white">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-400">{formatCurrency(item.price)}</td>
                        <td className="py-3 text-right font-black text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {order.notes && (
                      <tr>
                        <td colSpan="4" className="pt-3 pb-1 text-xs text-amber-400">
                          📌 Special Order Instructions: {order.notes}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-800">
                      <td colSpan="2" className="pt-4 font-black text-base text-white">
                        Total Amount
                      </td>
                      <td colSpan="2" className="pt-4 text-right font-black text-xl text-brand-400">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
