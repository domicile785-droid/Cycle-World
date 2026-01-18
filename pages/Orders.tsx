
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../App';
import { Order, OrderItem, Product } from '../types';
import { Truck, CheckCircle2, XCircle, Clock, Package, ShoppingBag, AlertCircle } from 'lucide-react';
import { serializeError } from '../utils/errorUtils';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch orders with nested order_items and products
      // FIX: Removed invoices and shipping_labels joins as they were causing 42703 (column does not exist) errors
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_price,
          status,
          shipping_address,
          customer_mobile,
          order_items (
            id,
            quantity,
            price,
            product_id,
            products (
              name,
              images
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      const msg = serializeError(err);
      console.error('Fetch Orders Error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-orange-100"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'approved': return <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-blue-100"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'rejected': return <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case 'shipped': return <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100"><Truck className="w-3.5 h-3.5" /> Shipped</span>;
      case 'delivered': return <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-green-100"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      default: return null;
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="animate-spin inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
      <p className="text-gray-500 font-medium">Retrieving your order history...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <div className="bg-red-50 text-red-600 p-8 rounded-3xl border border-red-100 inline-block">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to Load Orders</h2>
        <p className="text-sm opacity-80 mb-6">{error}</p>
        <button 
          onClick={fetchOrders}
          className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">My Order History</h1>
        <p className="text-gray-500 font-medium">Track your premium cycle purchases and shipment status.</p>
      </header>

      {orders.length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] text-center border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Your purchase history is currently empty. Start your journey with our latest collection.</p>
          <a href="/" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Browse Store
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Header Info */}
              <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-6">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Order Ref</p>
                    <p className="font-mono text-gray-900 font-bold">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Placed On</p>
                    <p className="text-gray-900 font-bold">{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-indigo-600 font-black text-lg">₹{order.total_price.toLocaleString()}</p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-500" /> Items in Order
                    </h4>
                    <div className="space-y-4">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-4 group">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                            <img 
                              src={(item.products?.images && item.products.images[0]) || 'https://via.placeholder.com/100'} 
                              alt={item.products?.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{item.products?.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{item.quantity} unit{item.quantity > 1 ? 's' : ''} • ₹{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-500" /> Delivery Address
                      </h4>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {order.shipping_address}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-xs text-indigo-700 font-bold flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5" /> Verification in Progress
                        </p>
                        <p className="text-[10px] text-indigo-600/70 font-medium">Once approved, your digital invoice and tracking details will appear here.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
