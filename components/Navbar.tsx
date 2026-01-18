
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../App';
import { ShoppingCart, User, LogOut, Package, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
          <span className="bg-indigo-600 text-white p-1 rounded">CH</span>
          CycleHub
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium">Store</Link>
          
          <Link to="/cart" className="relative group">
            <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-indigo-600" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <Link to="/admin" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1">
                  <Shield className="w-5 h-5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link to="/my-orders" className="text-gray-600 hover:text-indigo-600 flex items-center gap-1">
                <Package className="w-5 h-5" />
                <span className="hidden sm:inline">Orders</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">Login</Link>
              <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">Signup</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
