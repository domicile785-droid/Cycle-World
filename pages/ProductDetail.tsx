
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../lib/productService';
import { Product } from '../types';
import { useCart } from '../App';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, AlertCircle } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data, error } = await productService.getById(id);
      
      if (!error && data) {
        setProduct(data);
        setActiveImage((data.images && data.images[0]) || data.image_url || '');
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-24 text-center">Loading product...</div>;
  if (!product) return <div className="p-24 text-center">Product not found.</div>;

  const productImages = product.images || (product.image_url ? [product.image_url] : []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" /> Back to Store
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm aspect-[4/3]">
            <img 
              src={activeImage || 'https://via.placeholder.com/800x600?text=No+Image'} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-indigo-600' : 'border-transparent hover:border-gray-200'}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-indigo-600">₹{product.price.toLocaleString()}</span>
              {product.stock > 0 ? (
                <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">In Stock</span>
              ) : (
                <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Out of Stock
                </span>
              )}
            </div>
          </div>
          
          <div className="prose prose-indigo mb-10 text-gray-600 leading-relaxed">
            <p>{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-3 rounded-xl shadow-sm"><Truck className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Shipping</p>
                <p className="text-sm font-bold text-gray-900">3-5 Business Days</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="bg-white p-3 rounded-xl shadow-sm"><ShieldCheck className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Warranty</p>
                <p className="text-sm font-bold text-gray-900">2 Year Coverage</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => addToCart(product, 1)}
            disabled={product.stock <= 0}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400"
          >
            <ShoppingCart className="w-6 h-6" />
            {product.stock > 0 ? 'Add to Shopping Cart' : 'Currently Unavailable'}
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">Secure manual bank transfer payment required for verification.</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
