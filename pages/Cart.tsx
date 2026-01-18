
import React from 'react';
import { useCart } from '../App';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, totalItems } = useCart();
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex p-6 bg-indigo-50 rounded-full text-indigo-600 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any cycles to your cart yet. Let's find your perfect ride!</p>
        <Link to="/" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all inline-block">
          Go to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-10 flex items-center gap-4">
        Your Cart <span className="text-lg font-medium text-gray-400">({totalItems} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                <img src={item.product.image_url || 'https://picsum.photos/100/100?cycle'} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900">{item.product.name}</h3>
                <p className="text-gray-500 font-medium">Qty: {item.quantity}</p>
                <p className="text-indigo-600 font-bold text-lg mt-1">₹{(item.product.price * item.quantity).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => removeFromCart(item.product.id)}
                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-2xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-bold uppercase text-sm tracking-widest">Free</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-black text-indigo-600">₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <Link 
              to="/checkout" 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-center block hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              Checkout Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
