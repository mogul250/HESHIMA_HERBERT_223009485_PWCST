import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import WaiterDashboard from './pages/WaiterDashboard.jsx';
import KitchenDashboard from './pages/KitchenDashboard.jsx';
import AllOrders from './pages/AllOrders.jsx';
import CreateOrder from './pages/CreateOrder.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import MenuManagement from './pages/MenuManagement.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            background: '#111827',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            border: '1px solid #374151',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Waiter Station (Exclusive order taking) */}
        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'admin']}>
              <WaiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Kitchen Station (Cooking & preparation only - NO order creation) */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Order Form (Waiters only) */}
        <Route
          path="/orders/new"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'admin']}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />

        {/* Order Detail Page */}
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'kitchen', 'admin']}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        {/* All Orders Central Hub */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'kitchen', 'admin']}>
              <AllOrders />
            </ProtectedRoute>
          }
        />

        {/* Menu Dishes Database & Management */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute allowedRoles={['waiter', 'kitchen', 'admin']}>
              <MenuManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
