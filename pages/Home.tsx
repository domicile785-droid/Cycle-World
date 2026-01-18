
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { productService } from '../lib/productService';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, Filter, ArrowUpDown, Sparkles, MessageCircle, X } from 'lucide-react';
import { useCart } from '../App';
import { GoogleGenAI } from "@google/genai";

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  
  // Gemini AI state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await productService.getAll();
      if (!error && data) {
        setProducts(data);
        setFilteredProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();

    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts((prev) => [payload.new as Product, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts((prev) => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts((prev) => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    if (priceSort === 'asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'desc') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [search, priceSort, onlyInStock, products]);

  // Fix: Gemini AI integration for cycle recommendations
  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inventoryContext = products.map(p => `${p.name} (Price: ₹${p.price}, Stock: ${p.stock})`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are CycleHub's AI Assistant. A customer is asking: "${aiInput}". 
        Here is our current inventory: ${inventoryContext}. 
        Provide a friendly, expert recommendation based on our inventory. Keep it concise and professional.`,
      });

      setAiResponse(response.text || "I couldn't find a specific recommendation. Please try rephrasing!");
    } catch (err) {
      console.error('Gemini Error:', err);
      setAiResponse("Sorry, I'm having trouble connecting to my bike knowledge base right now.");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-100 animate-pulse h-80 rounded-xl"></div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight flex items-center justify-center gap-4">
          CycleHub Store
          <button 
            onClick={() => setShowAiAssistant(true)}
            className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-indigo-100 transition-all font-bold border border-indigo-100"
          >
            <Sparkles className="w-4 h-4" /> AI Advisor
          </button>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover high-performance bicycles with nationwide delivery and secure payment verification.</p>
      </header>

      {/* AI Assistant Modal */}
      {showAiAssistant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-bold">CycleHub AI Advisor</h3>
              </div>
              <button onClick={() => setShowAiAssistant(false)} className="hover:rotate-90 transition-transform">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50">
              {aiResponse ? (
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4 leading-relaxed text-gray-700">
                  <p className="font-bold text-indigo-600 mb-2 uppercase text-[10px] tracking-widest">AI Recommendation:</p>
                  {aiResponse}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10 italic">Ask me anything about our cycles! "Which bike is best for a beginner?" or "Do you have any carbon frame bikes?"</p>
              )}
              {aiLoading && (
                <div className="flex items-center gap-3 text-indigo-600 font-medium animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" /> Thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleAiAsk} className="p-6 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask our AI expert..."
                className="flex-grow p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={aiLoading}
                className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search cycles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setPriceSort(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium"
          >
            <ArrowUpDown className="w-4 h-4" />
            Price: {priceSort === 'asc' ? 'Low to High' : priceSort === 'desc' ? 'High to Low' : 'Sort'}
          </button>
          
          <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all">
            <input 
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">In Stock Only</span>
          </label>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 text-lg">No cycles found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
              <Link to={`/product/${product.id}`} className="block aspect-[4/3] overflow-hidden bg-gray-50 relative">
                <img 
                  src={(product.images && product.images[0]) || product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.stock <= 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Out of Stock</div>
                )}
              </Link>
              <div className="p-6 flex flex-col flex-grow">
                <Link to={`/product/${product.id}`} className="hover:text-indigo-600 transition-colors">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{product.name}</h3>
                </Link>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-indigo-600">₹{product.price.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? `${product.stock} units left` : 'Out of stock'}
                    </span>
                  </div>
                  <button 
                    onClick={() => addToCart(product, 1)}
                    disabled={product.stock <= 0}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:bg-gray-200 disabled:shadow-none"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
