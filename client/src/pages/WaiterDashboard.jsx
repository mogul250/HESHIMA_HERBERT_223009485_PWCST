import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Send,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  StickyNote,
  Flame,
  UtensilsCrossed,
  CakeSlice,
  Coffee,
  Salad,
  Hash,
  RefreshCcw,
  AlertCircle,
  AlertTriangle,
  Eye,
  BookOpen,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getMenuItems, createOrder, getOrders, updateOrderStatus } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Flame },
  { key: 'appetizers', label: 'Appetizers', icon: Salad },
  { key: 'mains', label: 'Mains', icon: UtensilsCrossed },
  { key: 'sides', label: 'Sides', icon: Hash },
  { key: 'desserts', label: 'Desserts', icon: CakeSlice },
  { key: 'beverages', label: 'Beverages', icon: Coffee },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending Kitchen', class: 'badge-pending', icon: Clock },
  preparing: { label: 'Cooking in Progress', class: 'badge-preparing', icon: ChefHat },
  ready: { label: 'Ready for Pickup!', class: 'badge-ready animate-pulse', icon: CheckCircle2 },
  served: { label: 'Served', class: 'badge-served', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled', icon: XCircle },
};

function WaiterDashboard() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableNumber, setTableNumber] = useState(1);
  const [waiterName, setWaiterName] = useState(user?.name || 'Sarah');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders'
  const [ordersFilter, setOrdersFilter] = useState('active'); // 'active' | 'all'
  const [itemNotes, setItemNotes] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);

  // Loading & Error States
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (user?.name) {
      setWaiterName(user.name);
    }
  }, [user]);

  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders((prev) => {
      const exists = prev.some((o) => o._id === updatedOrder._id);
      if (exists) {
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      }
      return [updatedOrder, ...prev];
    });

    if (updatedOrder.status === 'ready') {
      toast.success(
        `🔔 Table #${updatedOrder.tableNumber} is READY! Pick up and deliver.`,
        { duration: 6000, icon: '🍽️' }
      );
    } else if (updatedOrder.status === 'preparing') {
      toast(`👨‍🍳 Kitchen started cooking Table #${updatedOrder.tableNumber}`, { icon: '🍳' });
    }
  }, []);

  useSocket('waiter', {
    'new-order': handleOrderUpdate,
    'order-updated': handleOrderUpdate,
  });

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      setMenuError(null);
      const data = await getMenuItems();
      setMenuItems(data);
    } catch (err) {
      setMenuError(err.response?.data?.error || 'Failed to load menu. Check server.');
    } finally {
      setMenuLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await getOrders({ status: ordersFilter === 'active' ? 'active' : 'all', limit: 20 });
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setOrdersError(err.response?.data?.error || 'Failed to load active orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    loadOrders();
  }, [ordersFilter]);

  const markAsServed = async (orderId) => {
    setActionError(null);
    try {
      const updated = await updateOrderStatus(orderId, 'served');
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      toast.success('Order marked as SERVED! Table is enjoying their meal 🎉');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Server rejected transition to served.';
      setActionError(errMsg);
      toast.error(errMsg, { duration: 5000 });
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch && item.available;
  });

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem === item._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: '',
        },
      ];
    });
    toast.success(`Added ${item.name}`, { duration: 1500 });
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItem === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItem !== menuItemId);
    });
  };

  const getCartQuantity = (itemId) => {
    const item = cart.find((c) => c.menuItem === itemId);
    return item ? item.quantity : 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (!tableNumber || tableNumber <= 0) {
      return toast.error('You must connect to a dining table before sending the order to the kitchen.');
    }
    if (cart.length === 0) return toast.error('Cart is empty. Select dishes to build the table order.');

    try {
      const orderData = {
        tableNumber,
        items: cart.map((c) => ({ ...c, notes: itemNotes[c.menuItem] || '' })),
        totalAmount: cartTotal,
        waiterName: waiterName || user?.name || 'Staff',
        notes: orderNotes,
      };
      await createOrder(orderData);
      toast.success('Order sent directly to Kitchen display!');
      setCart([]);
      setItemNotes({});
      setOrderNotes('');
      setShowCart(false);
      setActiveTab('orders');
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit order';
      toast.error(msg);
    }
  };

  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      {/* Sub Header for Waiter station with Table Connection */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Table Connection Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected Table:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-md scrollbar-hide">
              {Array.from({ length: 12 }, (_, i) => {
                const tNum = i + 1;
                const isSelected = tableNumber === tNum;
                const hasActiveOrder = orders.some(
                  (o) => o.tableNumber === tNum && ['pending', 'preparing', 'ready'].includes(o.status)
                );
                return (
                  <button
                    key={tNum}
                    type="button"
                    onClick={() => {
                      setTableNumber(tNum);
                      toast.success(`Connected to Table #${tNum}`, { id: 'table-switch', duration: 1500 });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-400'
                        : hasActiveOrder
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40'
                        : 'bg-gray-800 text-gray-300 border border-gray-700/60 hover:text-white hover:border-gray-600'
                    }`}
                  >
                    T#{tNum}
                    {hasActiveOrder && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
              Table #{tableNumber} Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'menu'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Menu Catalog
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  loadOrders();
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Orders Status
                {readyOrdersCount > 0 && (
                  <span className="w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] flex items-center justify-center font-black animate-ping">
                    {readyOrdersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Cart trigger button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative btn-primary py-2 px-3.5 text-xs flex items-center gap-2 shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 bg-white text-gray-950 rounded-full text-xs font-black flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-4">
          <div className="bg-red-950/80 border border-red-500/60 text-red-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-red-300 block font-bold mb-0.5">
                  Action Rejected by Server
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

      {/* Main Content Area */}
      {activeTab === 'menu' ? (
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          {/* Search & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search food, drinks, desserts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all shadow-sm"
              />
            </div>
            <Link
              to="/menu"
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 shrink-0"
              title="See where items come from in MongoDB"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Manage / Add Dishes
            </Link>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === key
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ERROR STATE */}
          {menuError && (
            <div className="card p-8 text-center bg-red-950/40 border-red-500/40 mb-6">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">Failed to Load Menu</h3>
              <p className="text-xs text-red-300 mt-1 mb-4">{menuError}</p>
              <button
                onClick={loadMenu}
                className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* LOADING SKELETON */}
          {menuLoading && !menuError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-44 bg-gray-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-2/3" />
                    <div className="h-3 bg-gray-800 rounded w-full" />
                    <div className="h-8 bg-gray-800 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY SEARCH / CATEGORY STATE */}
          {!menuLoading && !menuError && filteredItems.length === 0 && (
            <div className="card p-16 text-center border-dashed border-gray-800">
              <Search className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">No dishes found</h3>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for something else or choosing another category.
              </p>
            </div>
          )}

          {/* Menu Items Grid with RWF Formatting */}
          {!menuLoading && !menuError && filteredItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const qty = getCartQuantity(item._id);
                return (
                  <div key={item._id} className="card group flex flex-col justify-between">
                    <div className="relative h-44 bg-gray-900 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`;
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-gray-950/85 backdrop-blur-sm text-white text-xs font-black px-2.5 py-1 rounded-full border border-gray-700 shadow">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      {qty > 0 && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                            {qty} in cart
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="mb-2.5">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <h3 className="font-bold text-white text-sm">{item.name}</h3>
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0 bg-gray-950/60 px-2 py-0.5 rounded-md border border-gray-800">
                            <Clock className="w-3 h-3" />
                            {item.preparationTime}m
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-gray-800/80">
                        <div className="flex items-center gap-2">
                          {qty > 0 ? (
                            <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 rounded-xl p-1 flex-1">
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="w-7 h-7 bg-gray-800 hover:bg-red-500 hover:text-white text-gray-200 rounded-lg flex items-center justify-center transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-white text-xs px-2 flex-1 text-center">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 bg-gray-800 hover:bg-brand-500 hover:text-white text-gray-200 rounded-lg flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 text-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Table
                            </button>
                          )}
                          <button
                            onClick={() => setShowNoteFor(showNoteFor === item._id ? null : item._id)}
                            className={`p-2 rounded-xl border transition-colors ${
                              itemNotes[item._id]
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                                : 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                            title="Add special instructions"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {showNoteFor === item._id && (
                          <input
                            type="text"
                            placeholder="Special request (e.g. no onions)..."
                            value={itemNotes[item._id] || ''}
                            onChange={(e) =>
                              setItemNotes((prev) => ({ ...prev, [item._id]: e.target.value }))
                            }
                            className="mt-2.5 w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Orders Status Tab */
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white">Orders Status & Table Delivery</h2>
              <p className="text-xs text-gray-400">
                Waiters track kitchen cooking progress and deliver ready dishes to guests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-900 border border-gray-800 p-1 rounded-xl flex text-xs">
                <button
                  onClick={() => setOrdersFilter('active')}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    ordersFilter === 'active' ? 'bg-brand-500 text-white shadow' : 'text-gray-400'
                  }`}
                >
                  Active Orders
                </button>
                <button
                  onClick={() => setOrdersFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    ordersFilter === 'all' ? 'bg-brand-500 text-white shadow' : 'text-gray-400'
                  }`}
                >
                  History (All)
                </button>
              </div>
              <button
                onClick={loadOrders}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* ORDERS ERROR STATE */}
          {ordersError && (
            <div className="card p-8 text-center bg-red-950/40 border-red-500/40 mb-6">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">Failed to Load Orders</h3>
              <p className="text-xs text-red-300 mt-1 mb-4">{ordersError}</p>
              <button
                onClick={loadOrders}
                className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* ORDERS LOADING SKELETON */}
          {ordersLoading && !ordersError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-5 animate-pulse space-y-3">
                  <div className="h-10 bg-gray-800 rounded-xl" />
                  <div className="h-16 bg-gray-800 rounded-xl" />
                  <div className="h-8 bg-gray-800 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY ORDERS STATE */}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="card p-16 text-center border-dashed border-gray-800">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="font-bold text-white">No orders in this view</p>
              <p className="text-xs text-gray-400 mt-1">
                Take an order from the Menu tab to send it to the kitchen.
              </p>
            </div>
          )}

          {/* ORDERS LIST */}
          {!ordersLoading && !ordersError && orders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StIcon = st.icon;
                const isReady = order.status === 'ready';

                return (
                  <div
                    key={order._id}
                    className={`card p-4 sm:p-5 border flex flex-col justify-between transition-all shadow-lg ${
                      isReady ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-500/10' : 'border-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/80">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isReady ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-800 text-white'
                            }`}
                          >
                            #{order.tableNumber}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              Table #{order.tableNumber}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {order.waiterName || 'Staff'} ·{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={st.class}>
                          <StIcon className="w-3.5 h-3.5 mr-1" />
                          {st.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 mb-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-gray-950/50 border border-gray-800/60 text-xs text-gray-300"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-gray-800 text-brand-400 font-black text-[11px] flex items-center justify-center shrink-0">
                                {item.quantity}
                              </span>
                              <span className="font-bold text-gray-200 truncate">{item.name}</span>
                              {item.notes && (
                                <span className="text-[10px] text-amber-300 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                                  {item.notes}
                                </span>
                              )}
                            </span>
                            <span className="font-bold text-gray-300 shrink-0 pl-2">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/20 px-3 py-2 rounded-xl mb-3 flex items-start gap-1.5">
                          <span>📌</span>
                          <span>{order.notes}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-800/80 mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-gray-400 font-semibold">Order Total</span>
                        <span className="text-base font-black text-white">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/orders/${order._id}`}
                          className="p-2.5 rounded-xl border border-gray-800 bg-gray-950 hover:bg-gray-800 text-gray-300 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* SERVE BUTTON */}
                        {isReady ? (
                          <button
                            onClick={() => markAsServed(order._id)}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                          >
                            <UtensilsCrossed className="w-4 h-4" />
                            🍽️ Deliver & Mark as Served
                          </button>
                        ) : order.status === 'served' ? (
                          <div className="flex-1 py-2 bg-gray-800/80 text-gray-400 font-bold text-xs rounded-xl text-center">
                            ✓ Completed & Served
                          </div>
                        ) : (
                          <div className="flex-1 py-2 bg-gray-800/40 border border-gray-800 text-gray-400 font-semibold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                            <ChefHat className="w-3.5 h-3.5 text-gray-400" />
                            Kitchen is cooking...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col slide-up text-white">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-brand-400" />
                  Table #{tableNumber} Order Ticket
                </h2>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected to Dining Table #{tableNumber}
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-white font-bold text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Select dishes from the menu to build the customer order
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuItem}
                    className="flex items-center gap-3 bg-gray-950 rounded-2xl p-3 border border-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => removeFromCart(item.menuItem)}
                        className="p-1 hover:bg-red-500 hover:text-white rounded text-gray-300 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-white">{item.quantity}</span>
                      <button
                        onClick={() => addToCart({ _id: item.menuItem, name: item.name, price: item.price })}
                        className="p-1 hover:bg-brand-500 hover:text-white rounded text-gray-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-white text-xs w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}

              {cart.length > 0 && (
                <div className="space-y-3 pt-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Waiter Name
                    </label>
                    <input
                      type="text"
                      value={waiterName}
                      onChange={(e) => setWaiterName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 text-white rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Order Special Notes
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Table rush, allergy warning..."
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-800 text-white rounded-xl text-xs resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-800 bg-gray-950">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-400 font-semibold">
                    Table #{tableNumber} · {cartCount} items
                  </span>
                  <span className="text-xl font-black text-white">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={submitOrder}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send Table #{tableNumber} Order to Kitchen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WaiterDashboard;
