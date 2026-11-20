import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Send,
  Search,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { getMenuItems, createOrder } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function CreateOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [tableNumber, setTableNumber] = useState(1);
  const [waiterName, setWaiterName] = useState(user?.name || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});

  // Menu State
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // UI States: Loading, Empty, Error
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMenuItems();
      setMenuItems(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load menu items. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

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
        },
      ];
    });
    toast.success(`Added ${item.name}`);
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tableNumber || tableNumber <= 0) {
      return toast.error('Please select a valid table number');
    }
    if (cart.length === 0) {
      return toast.error('Order must contain at least one item');
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        tableNumber: Number(tableNumber),
        items: cart.map((item) => ({
          menuItem: item.menuItem,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: itemNotes[item.menuItem] || '',
        })),
        totalAmount: cartTotal,
        waiterName: waiterName || user?.name || 'Staff',
        notes: orderNotes,
      };

      const created = await createOrder(orderPayload);
      toast.success(`Order created for Table #${tableNumber}! Sent to kitchen.`);
      navigate(`/orders/${created._id}`);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to submit order. Kitchen staff cannot create orders.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/orders"
            className="p-2 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-white border border-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-brand-400" />
              Create Order (Waiter Station)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Select table, pick items from MongoDB catalog, and send directly to kitchen
            </p>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 bg-red-950/60 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
            <button
              onClick={loadMenu}
              className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Table & Menu Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Table Selection Box */}
            <div className="card p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  Connect Dining Table (Required)
                </h2>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected: Table #{tableNumber}
                </span>
              </div>

              {/* Quick Table Selector Chips */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Select & Connect Table:
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => {
                    const tNum = i + 1;
                    const isSelected = tableNumber === tNum;
                    return (
                      <button
                        key={tNum}
                        type="button"
                        onClick={() => {
                          setTableNumber(tNum);
                          toast.success(`Connected to Table #${tNum}`, { id: 'create-table-switch', duration: 1500 });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-400'
                            : 'bg-gray-900 text-gray-300 border border-gray-800 hover:text-white hover:border-gray-700'
                        }`}
                      >
                        Table #{tNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Assigned Table Number
                  </label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-800 text-white font-bold text-sm py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    {Array.from({ length: 15 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Table #{i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Waiter Name
                  </label>
                  <input
                    type="text"
                    value={waiterName}
                    onChange={(e) => setWaiterName(e.target.value)}
                    placeholder="Staff name"
                    className="w-full bg-gray-950 border border-gray-800 text-white text-sm py-2.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Menu Selection */}
            <div className="card p-6 border border-gray-800">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                Pick Dishes from Menu
              </h2>

              {/* Search & Categories */}
              <div className="space-y-3 mb-5">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search menu dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
                  {['all', 'appetizers', 'mains', 'sides', 'desserts', 'beverages'].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg capitalize font-bold transition-all ${
                        activeCategory === cat
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* LOADING STATE */}
              {loading && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading dishes from MongoDB...</p>
                </div>
              )}

              {/* EMPTY STATE */}
              {!loading && filteredItems.length === 0 && (
                <div className="py-12 text-center bg-gray-950 rounded-2xl border border-dashed border-gray-800">
                  <UtensilsCrossed className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">No dishes match your filter</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Try a different search term</p>
                </div>
              )}

              {/* Item Grid */}
              {!loading && filteredItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => {
                    const cartItem = cart.find((c) => c.menuItem === item._id);
                    return (
                      <div
                        key={item._id}
                        className="p-3 bg-gray-950 rounded-2xl border border-gray-800 flex items-center justify-between gap-3 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-white truncate">{item.name}</h4>
                          <span className="text-xs font-black text-brand-400">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item._id)}
                              className="p-1 hover:bg-red-500 hover:text-white rounded text-gray-300 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center font-black text-xs text-white">
                              {cartItem.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="p-1 hover:bg-brand-500 hover:text-white rounded text-gray-300 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Order Summary & Submission */}
          <div className="space-y-6">
            <div className="card p-6 flex flex-col justify-between sticky top-24 border border-gray-800">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-brand-400" />
                    Table #{tableNumber} Order Ticket
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Connected
                  </span>
                </div>

                {/* EMPTY CART STATE */}
                {cart.length === 0 ? (
                  <div className="py-10 text-center bg-gray-950 rounded-2xl border border-dashed border-gray-800 mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">Your cart is empty</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Click "+ Add" on any menu dish
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4 pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.menuItem}
                        className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-white truncate">
                            {item.quantity}× {item.name}
                          </p>
                          <input
                            type="text"
                            placeholder="Add item note..."
                            value={itemNotes[item.menuItem] || ''}
                            onChange={(e) =>
                              setItemNotes((prev) => ({
                                ...prev,
                                [item.menuItem]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full bg-gray-900 text-white px-2 py-0.5 rounded text-[11px] border border-gray-800"
                          />
                        </div>
                        <span className="font-black text-white shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Order Special Notes */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Special Kitchen Notes
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Allergy warning, extra crispy..."
                    className="w-full bg-gray-950 border border-gray-800 text-white text-xs p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Total & Submit Button */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-400 font-semibold">Total Amount</span>
                  <span className="text-xl font-black text-white">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || cart.length === 0}
                  className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Table #{tableNumber} Order to Kitchen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
