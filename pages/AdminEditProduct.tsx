
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../lib/productService';
import AdminSidebar from '../components/AdminSidebar';
import { Upload, X, ArrowLeft, Save, Trash2, AlertCircle } from 'lucide-react';

const AdminEditProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data, error } = await productService.getById(id);
      if (!error && data) {
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price.toString());
        setStock(data.stock.toString());
        setExistingImages(data.images || (data.image_url ? [data.image_url] : []));
      }
      setInitialLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setNewImages(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (existingImages.length === 0 && newImages.length === 0) {
      setErrorMsg('Product must have at least one image.');
      return;
    }

    setLoading(true);
    if (!id) return;

    const { error } = await productService.updateProduct(
      id,
      {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
      },
      newImages,
      existingImages
    );

    if (error) {
      setErrorMsg(error.message || 'Update failed. Check your admin permissions and RLS policies.');
    } else {
      alert('Cycle updated successfully!');
      navigate('/admin/products');
    }
    setLoading(false);
  };

  if (initialLoading) return <div className="p-12 text-center text-gray-500 font-medium animate-pulse">Loading product details...</div>;

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-8 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Inventory
          </button>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Edit Cycle</h1>
          <p className="text-gray-500 mb-8">Update specifications or adjust stock for {name}.</p>

          {errorMsg && (
            <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Update Failed</p>
                <p className="text-sm opacity-90">{errorMsg}</p>
                <p className="mt-2 text-xs opacity-75">Common issue: New row violates row-level security policy (RLS).</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cycle Name</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Specifications</label>
                  <textarea 
                    required
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-4">Gallery Management</label>
                <div className="grid grid-cols-3 gap-4">
                  {existingImages.map((src, i) => (
                    <div key={`ex-${i}`} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group border border-gray-50">
                      <img src={src} alt="existing" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeExistingImage(src)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-indigo-200 group">
                      <img src={src} alt="new" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-400">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">Add Photos</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Financials</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                  <input 
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Available Stock</label>
                  <input 
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Saving...' : <><Save className="w-6 h-6" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEditProduct;
