
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Check, X, Eye, ShieldCheck, Box, Loader2, AlertCircle, Truck } from 'lucide-react';
import { generateInvoiceBlob, generateShippingLabelBlob } from '../utils/pdfGenerator';
import AdminSidebar from '../components/AdminSidebar';
import { serializeError } from '../utils/errorUtils';

/**
 * FRONTEND API BRIDGE
 * These functions simulate network calls to the backend API endpoints.
 * In production, these would be fetch() requests.
 */
const adminApi = {
  approveOrder: async (orderId: string) => {
    // Simulate: POST /api/admin/approve-order
    const { handleApproveOrder } = await import('../api/adminOrderActions');
    return await handleApproveOrder(orderId);
  },
  rejectOrder: async (orderId: string) => {
    // Simulate: POST /api/admin/reject-order
    const { handleRejectOrder } = await import('../api/adminOrderActions');
    return await handleRejectOrder(orderId);
  },
  uploadDocument: async (orderId: string, blob: Blob, type: 'invoice' | 'shipping_label') => {
    // Simulate: POST /api/admin/upload-order-document
    const { handleUploadOrderDocument } = await import('../api/adminOrderActions');
    return await handleUploadOrderDocument(orderId, blob, type);
  }
};

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_price,
          status,
          shipping_address,
          customer_mobile,
          users ( full_name, email, role ),
          payments ( id, transaction_id, screenshot_url, status ),
          order_items ( 
            id, 
            quantity, 
            price, 
            product_id, 
            products ( name, stock ) 
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err: any) {
      setError(serializeError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (order: any) => {
    const confirmMsg = `Approve Order #${order.id.slice(-8)}?\n\nThis will update statuses, reduce stock, and generate documents.`;
    if (!window.confirm(confirmMsg)) return;
    
    setProcessingId(order.id);
    try {
      // 1. Call Secure Backend API to update DB (Order, Payment, Stock)
      await adminApi.approveOrder(order.id);

      // 2. Generate and Securely Upload Documents via Backend API
      try {
        const invoiceBlob = await generateInvoiceBlob(order);
        const labelBlob = await generateShippingLabelBlob(order);

        await adminApi.uploadDocument(order.id, invoiceBlob, 'invoice');
        await adminApi.uploadDocument(order.id, labelBlob, 'shipping_label');
      } catch (docErr) {
        console.warn('Backend Document Logging failed:', docErr);
        // We don't fail the whole approval if documents fail
      }

      await fetchOrders();
      alert('Order approved and verified through secure gateway!');
    } catch (err: any) {
      const msg = serializeError(err);
      alert(`Approval Failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!window.confirm('Reject this order?')) return;
    
    setProcessingId(orderId);
    try {
      // Call Secure Backend API
      await adminApi.rejectOrder(orderId);
      await fetchOrders();
      alert('Order has been rejected successfully.');
    } catch (err: any) {
      const msg = serializeError(err);
      alert(`Rejection Failed: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && orders.length === 0) return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-black flex items-center gap-3">
                <ShieldCheck className="w-10 h-10 text-indigo-600" /> Verify Orders
              </h1>
              <p className="text-gray-500 mt-2">Manual verification processed through secure admin gateway.</p>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pending Actions</p>
              <p className="text-2xl font-black text-indigo-600">
                {orders.filter(o => o.status === 'pending').length} Orders
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] text-center border border-gray-100 shadow-sm">
                <Box className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Queue is empty</h3>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md ${processingId === order.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Ref ID</p>
                        <p className="font-mono text-gray-900 font-bold">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Customer</p>
                        <p className="font-bold text-gray-900">{order.users?.full_name || 'Guest User'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Transaction Ref</p>
                        <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100">
                          {order.payments?.[0]?.transaction_id || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                          order.status === 'approved' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(order)} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-bold text-sm shadow-sm"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(order.id)} 
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold text-sm shadow-sm"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                      {order.payments?.[0]?.screenshot_url && (
                        <a 
                          href={order.payments[0].screenshot_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                          title="View Proof"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Payload Details</h4>
                        <div className="space-y-3">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{item.products?.name}</p>
                                <p className="text-xs text-gray-500">{item.quantity} unit(s) • ₹{item.price.toLocaleString()}</p>
                              </div>
                              <p className="font-black text-indigo-600">₹{(item.quantity * item.price).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
                          <p className="text-gray-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Truck className="w-3 h-3 text-indigo-500"/> Shipping Hub</p>
                          <p className="text-gray-800 font-medium leading-relaxed">{order.shipping_address}</p>
                          <p className="mt-3 text-gray-500 text-xs font-bold uppercase mb-1">Contact No.</p>
                          <p className="text-indigo-600 font-bold">{order.customer_mobile || 'N/A'}</p>
                        </div>

                        <div className="flex justify-between items-center bg-indigo-600 p-5 rounded-2xl text-white shadow-lg">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Settlement Total</p>
                          <p className="text-3xl font-black">₹{order.total_price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
