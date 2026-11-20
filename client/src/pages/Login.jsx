import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Flame,
  Mail,
  Lock,
  ArrowRight,
  UtensilsCrossed,
  ChefHat,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { seedDemoUsers } from '../services/api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (user) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (user.role === 'kitchen') {
      navigate('/kitchen', { replace: true });
    } else if (user.role === 'waiter') {
      navigate('/waiter', { replace: true });
    } else {
      navigate('/orders', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password');
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      redirectAfterLogin(user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    try {
      // Ensure demo accounts exist on backend
      try {
        await seedDemoUsers();
      } catch {}
      const user = await quickDemoLogin(role);
      toast.success(`Logged in as ${user.name} (${role.toUpperCase()})`);
      redirectAfterLogin(user);
    } catch (err) {
      toast.error('Quick demo login failed. Please register or try standard login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Flame className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome to Restro<span className="text-brand-400">Flow</span>
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to access your Waiter or Kitchen station
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Quick Demo Switcher Cards */}
        <div className="bg-gray-800/60 backdrop-blur-md p-4 rounded-2xl border border-gray-700/60 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
            ⚡ Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('waiter')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-700/60 hover:bg-brand-500/20 border border-gray-600 hover:border-brand-500/40 text-gray-200 hover:text-brand-300 transition-all group"
            >
              <UtensilsCrossed className="w-5 h-5 mb-1.5 text-brand-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Waiter</span>
              <span className="text-[10px] text-gray-400">Sarah</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('kitchen')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-700/60 hover:bg-emerald-500/20 border border-gray-600 hover:border-emerald-500/40 text-gray-200 hover:text-emerald-300 transition-all group"
            >
              <ChefHat className="w-5 h-5 mb-1.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Kitchen</span>
              <span className="text-[10px] text-gray-400">Marco</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-700/60 hover:bg-purple-500/20 border border-gray-600 hover:border-purple-500/40 text-gray-200 hover:text-purple-300 transition-all group"
            >
              <ShieldCheck className="w-5 h-5 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Manager</span>
              <span className="text-[10px] text-gray-400">Alex</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-gray-900 border border-gray-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="waiter@restaurant.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-400">
              Need a new staff account?{' '}
              <Link to="/register" className="text-brand-400 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

