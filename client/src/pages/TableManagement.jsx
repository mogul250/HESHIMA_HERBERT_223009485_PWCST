import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Layers,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getTables, createTable, deleteTable, updateTableStatus } from '../services/api.js';

export default function TableManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    seats: 4,
    status: 'available',
  });

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data);
    } catch {
      toast.error('Failed to load dining tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      return toast.error('Permission Denied: Only Admins can insert tables.');
    }
    const tNum = parseInt(formData.number, 10);
    const seats = parseInt(formData.seats, 10) || 4;

    if (!tNum || tNum <= 0) {
      return toast.error('Please enter a valid table number (greater than 0)');
    }

    setSubmitting(true);
    try {
      const created = await createTable({
        number: tNum,
        seats,
        status: formData.status,
      });
      toast.success(`Table #${created.number} inserted successfully!`);
      setTables((prev) => [...prev, created].sort((a, b) => a.number - b.number));
      setShowAddModal(false);
      setFormData({ number: '', seats: 4, status: 'available' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to insert table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, tableNum) => {
    if (!isAdmin) return toast.error('Only Admins can remove tables.');
    if (!window.confirm(`Are you sure you want to delete Table #${tableNum} from the restaurant layout?`)) return;

    try {
      await deleteTable(id);
      toast.success(`Table #${tableNum} removed`);
      setTables((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete table');
    }
  };

  const handleToggleStatus = async (table) => {
    const nextStatus = table.status === 'available' ? 'occupied' : 'available';
    try {
      const updated = await updateTableStatus(table._id, nextStatus);
      setTables((prev) => prev.map((t) => (t._id === table._id ? updated : t)));
      toast.success(`Table #${table.number} set to ${nextStatus.toUpperCase()}`);
    } catch {
      toast.error('Failed to update table status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Banner: Who Inserts the Tables? */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-950/40 via-gray-900 to-gray-900 border border-purple-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/40 rounded-2xl flex items-center justify-center shrink-0 text-purple-400 mt-0.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Who Inserts the Tables?</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500 text-white px-2 py-0.5 rounded-full">
                  Admin / Manager Only
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                <strong>Restaurant Administrators</strong> are the only users who insert and configure dining tables in the system.
                <strong> Waiters</strong> only connect to existing tables to assign customer orders, and the <strong>Kitchen</strong> references the table number on tickets to send food to the correct guests.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Insert New Table
            </button>
          )}
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-brand-400" />
              Dining Tables Layout ({tables.length} tables)
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage physical restaurant seating capacity and table availability
            </p>
          </div>

          <button
            onClick={loadTables}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh Layout
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="h-10 bg-gray-800 rounded-xl" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Tables Grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              return (
                <div
                  key={table._id}
                  className={`card p-5 border transition-all flex flex-col justify-between shadow-md ${
                    isOccupied
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <span className="text-xl font-black text-white">
                      #{table.number}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(table._id, table.number)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg transition-colors hover:bg-gray-800"
                        title="Delete table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>{table.seats} Seats</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOccupied ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <span className="text-xs font-bold capitalize text-gray-300">
                        {table.status}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(table)}
                      className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isOccupied
                          ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      {isOccupied ? 'Mark Available' : 'Mark Occupied'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Insert Table Modal (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
            <h3 className="text-lg font-black mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Insert New Dining Table
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Only Restaurant Admins can add tables to the dining floor.
            </p>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 11"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Seating Capacity (Number of Chairs)
                </label>
                <select
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value={2}>2 Persons (Cozy Booth)</option>
                  <option value={4}>4 Persons (Standard Dining)</option>
                  <option value={6}>6 Persons (Family Table)</option>
                  <option value={8}>8 Persons (Large Party)</option>
                  <option value={12}>12 Persons (VIP Banquet)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting ? 'Inserting...' : 'Insert Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

