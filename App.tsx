
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { User, CartItem } from './types';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminAddProduct from './pages/AdminAddProduct';
import AdminEditProduct from './pages/AdminEditProduct';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

// Cart Context
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
}
const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalItems: 0,
});
export const useCart = () => useContext(CartContext);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Fix: Using getUser() which is more robust for checking current session state
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        fetchUserData(authUser.id);
      } else {
        setLoading(false);
      }
    });

    // Fix: Standard property access for onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUser(data);
    }
    setLoading(false);
  };

  const signOut = async () => {
    // Fix: Standard property access for signOut
    await supabase.auth.signOut();
    setUser(null);
  };

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems: cart.reduce((acc, i) => acc + i.quantity, 0) }}>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                
                <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
                <Route path="/my-orders" element={user ? <Orders /> : <Navigate to="/login" />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
                <Route path="/admin/products" element={user?.role === 'admin' ? <AdminProducts /> : <Navigate to="/" />} />
                <Route path="/admin/products/add" element={user?.role === 'admin' ? <AdminAddProduct /> : <Navigate to="/" />} />
                <Route path="/admin/products/edit/:id" element={user?.role === 'admin' ? <AdminEditProduct /> : <Navigate to="/" />} />
              </Routes>
            </main>
            <footer className="bg-gray-900 text-white py-8">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p>&copy; 2024 CycleHub. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </Router>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
