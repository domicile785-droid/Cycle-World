
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, List, PlusCircle, Settings } from 'lucide-react';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Orders', path: '/admin', icon: LayoutDashboard },
    { label: 'All Products', path: '/admin/products', icon: List },
    { label: 'Add Product', path: '/admin/products/add', icon: PlusCircle },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] hidden md:block">
      <div className="p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Management</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
