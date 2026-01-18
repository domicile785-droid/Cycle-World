
import React, { useState } from 'react';
import { useCart, useAuth } from '../App';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Upload, 
  MapPin, 
  Phone, 
  Building2, 
  Copy, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { serializeError } from '../utils/errorUtils';
import { uploadPaymentScreenshotHandler } from '../api/uploadPaymentScreenshot';

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCart();
  const { user: contextUser } = useAuth();
  const navigate = useNavigate();
  
  const [address, setAddress] = useState(contextUser?.address || '');
  const [mobile, setMobile] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (!transactionId.trim()) {
      alert("Transaction ID/UTR is mandatory for verification.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error("Authentication session lost. Please login again.");
      }

      // 2. Insert Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: authUser.id,
          total_price: totalPrice,
          status: 'pending',
          shipping_address: address,
          customer_mobile: mobile,
        })
        .select()
        .single();

      if (orderError) throw new Error(`Order Creation Failed: ${serializeError(orderError)}`);

      // 3. Insert Order Items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));
      
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(`Item Mapping Failed: ${serializeError(itemsError)}`);

      // 4. Handle Screenshot Upload via SECURE BACKEND HANDLER
      let screenshotUrl = '';
      if (screenshot) {
        try {
          // Using the privileged handler to bypass frontend RLS restrictions
          screenshotUrl = await uploadPaymentScreenshotHandler(screenshot, order.id);
        } catch (uploadErr) {
          console.warn('Screenshot upload failed, but continuing with order:', uploadErr);
          // Non-blocking: We don't throw here so the order isn't canceled if just the image fails
        }
      }

      // 5. Insert Payment Record
      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: order.id,
        transaction_id: transactionId,
        screenshot_url: screenshotUrl,
        status: 'pending',
      });
      
      if (paymentError) throw new Error(`Payment Record Failed: ${serializeError(paymentError)}`);

      // 6. Finalize Success
      setOrderId(order.id);
      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      const errorMsg = serializeError(err);
      console.error('Checkout Failure:', errorMsg);
      alert(`Checkout failed: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-4xl font-black text-gray-900 mb-4">Your Order is Confirmed!</h1>
            <p className="text-gray-500 font-medium mb-2">Order Ref: <span className="font-mono font-bold text-indigo-600">#{orderId?.slice(-8).toUpperCase()}</span></p>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-10 text-left space-y-4">
              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Next Step: Payment Verification</p>
                  <p className="text-sm text-gray-500 leading-relaxed">Our finance team is now verifying your Transaction ID. This process typically takes <span className="font-bold text-gray-700">1-4 working hours</span>.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <ShieldCheck className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Quality Guaranteed</p>
                  <p className="text-sm text-gray-500 leading-relaxed">Once verified, your cycle will undergo a 24-point professional assembly check before dispatch.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/my-orders')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
              >
                Track Order Status <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-white text-gray-600 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all"
              >
                Continue Shopping
              </button>
            </div>
            <p className="mt-12 text-xs text-gray-400 font-bold uppercase tracking-widest">Thank you for choosing CycleHub</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Finalize Your Purchase</h1>
        <p className="text-gray-500 font-medium">Secure Manual Bank Transfer Verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                <ShieldCheck className="w-3 h-3" /> Verified Business
              </span>
            </div>
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Official Bank Details
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Bank Name</p>
                <p className="font-bold text-gray-900">J&K GRAMEEN BANK</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Account Holder</p>
                <p className="font-bold text-gray-900">CYCLE WORLD</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Account Number</p>
                <p className="font-black text-gray-900 font-mono text-lg">3522040100003209</p>
                <button 
                  onClick={() => copyToClipboard('3522040100003209', 'acc')}
                  className="absolute top-4 right-4 text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                >
                  {copiedField === 'acc' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">IFSC Code</p>
                <p className="font-black text-gray-900 font-mono text-lg">JAKA0GRAMEEN</p>
                <button 
                  onClick={() => copyToClipboard('JAKA0GRAMEEN', 'ifsc')}
                  className="absolute top-4 right-4 text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                >
                  {copiedField === 'ifsc' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>

          <section className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-indigo-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" /> Steps to Complete
            </h3>
            <ol className="text-sm space-y-4 text-indigo-50 list-none font-medium">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                Transfer ₹{totalPrice.toLocaleString()} to the account above.
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                Copy the UTR / Transaction ID from your banking app.
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                Paste the ID and upload a screenshot (optional) below.
              </li>
            </ol>
          </section>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> Delivery Address
                </label>
                <textarea 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                  placeholder="Enter your complete home address for shipping..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" /> Mobile Number
                </label>
                <input 
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="+91 00000 00000"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> Transaction ID / UTR
                </label>
                <input 
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Enter 12-digit UTR No."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" /> Payment Proof Screenshot (Optional)
              </label>
              <div className="relative group">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-4 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                />
              </div>
              <p className="mt-2 text-[10px] text-gray-400 font-medium italic">Secure upload processed via internal verification gateway.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-medium">Order Subtotal</span>
                <span className="font-bold text-gray-900">₹{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">Shipping Charges</span>
                <span className="text-green-600 font-black text-xs uppercase">Free Delivery</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-lg font-black text-gray-900">Grand Total</span>
                <span className="text-3xl font-black text-indigo-600">₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {submitting ? 'Verifying Submission...' : `Pay & Place Order`}
            </button>
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Manual Verification Enabled</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
