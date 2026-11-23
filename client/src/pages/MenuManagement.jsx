import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCcw,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';
import {
  getMenuItems,
  createMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from '../services/api.js';

const CATEGORIES = [
  { key: 'all', label: 'All Dishes' },
  { key: 'appetizers', label: 'Appetizers' },
  { key: 'mains', label: 'Mains' },
  { key: 'sides', label: 'Sides' },
  { key: 'desserts', label: 'Desserts' },
  { key: 'beverages', label: 'Beverages' },
];

export default function MenuManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Item Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'mains',
    price: '',
    description: '',
    preparationTime: 15,
    image: '',
  });

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await getMenuItems();
      setItems(data);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      return toast.error('Permission Denied: Waiters cannot set or add items to the menu. Only Admins can modify the menu.');
    }
    if (!formData.name || !formData.price || !formData.description) {
      return toast.error('Please fill in dish name, price, and description');
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime, 10) || 15,
        image:
          formData.image.trim() ||
          `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`,
      };

      const created = await createMenuItem(payload);
      toast.success(`"${created.name}" added to MongoDB menu!`);
      setItems((prev) => [created, ...prev]);
      setShowAddModal(false);
      setFormData({
        name: '',
        category: 'mains',
        price: '',
        description: '',
        preparationTime: 15,
        image: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    if (!isAdmin) {
      return toast.error('Waiters cannot alter menu availability. Only Admins can set dishes in or out of stock.');
    }
    try {
      const updated = await toggleMenuItemAvailability(id);
      setItems((prev) => prev.map((i) => (i._id === id ? updated : i)));
      toast.success(
        updated.available ? 'Dish marked Available' : 'Dish marked Out of Stock'
      );
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleDelete = async (id, name) => {
    if (!isAdmin) {
      return toast.error('Waiters cannot delete dishes. Only Admins can modify the menu.');
    }
    if (!window.confirm(`Delete "${name}" from the database?`)) return;
    try {
      await deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success(`Removed "${name}" from menu`);
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    const matchQuery =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Explanation Card: Where items come from */}
        <div className="mb-8 p-5 bg-gradient-to-r from-brand-950/40 via-gray-900 to-gray-900 border border-brand-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 bg-brand-500/20 border border-brand-500/40 rounded-2xl flex items-center justify-center shrink-0 text-brand-400 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                Where Do Menu Items Come From?
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white px-2 py-0.5 rounded-full">
                  MongoDB Database
                </span>
              </h2>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                All dishes are stored in the <strong>MongoDB `MenuItem` collection</strong> and served via the Express API (<code>/api/menu</code>).
                {!isAdmin && (
                  <span className="block mt-1 text-amber-300 font-semibold">
                    🔒 Notice: Waiters cannot add or modify menu dishes. Only Restaurant Admins are authorized to configure the menu.
                  </span>
                )}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Dish
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-800/80 border border-amber-500/30 px-3.5 py-2.5 rounded-2xl text-xs text-amber-300 font-bold shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Waiters Cannot Set Menu (Admin Only)</span>
            </div>
          )}
        </div>

        {/* Catalog Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <UtensilsCrossed className="w-6 h-6 text-brand-400" />
              Restaurant Menu Catalog ({items.length} items)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Items available for waiters to add to customer table orders
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white hover:border-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse space-y-3">
                <div className="h-36 bg-gray-800 rounded-xl" />
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-800 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Menu Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`card flex flex-col justify-between border transition-all ${
                  item.available ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                }`}
              >
                <div>
                  <div className="relative h-44 bg-gray-900 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`;
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-gray-950/80 backdrop-blur-sm text-white text-xs font-black px-2.5 py-1 rounded-full border border-gray-700 shadow">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-brand-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <h3 className="font-bold text-sm text-white">{item.name}</h3>
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0 bg-gray-950/60 px-2 py-0.5 rounded-md border border-gray-800">
                        <Clock className="w-3 h-3" />
                        {item.preparationTime}m
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 pt-3.5 border-t border-gray-800/80 flex items-center justify-between gap-2">
                  {isAdmin ? (
                    <button
                      onClick={() => handleToggle(item._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        item.available
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      {item.available ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                        item.available
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {item.available ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Available
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </>
                      )}
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-white">
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Add Dish to MongoDB Menu
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              This new item will immediately be available for waiters to add to table orders.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Mushroom Burger"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Mains</option>
                    <option value="sides">Sides</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Price (RWF)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    placeholder="e.g. 15000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) =>
                      setFormData({ ...formData, preparationTime: e.target.value })
                    }
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ingredients, preparation details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Save Dish to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

