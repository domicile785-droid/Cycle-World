
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../lib/productService';
import AdminSidebar from '../components/AdminSidebar';
import { Upload, X, ArrowLeft, Save, AlertCircle } from 'lucide-react';

const AdminAddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (images.length === 0) {
      setErrorMsg('Please upload at least one image.');
      return;
    }

    setLoading(true);
    const result = await productService.addProduct(
      {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
      },
      images
    );

    if (result.error) {
      // Result.error is now an object { message: string }
      setErrorMsg(result.error.message);
    } else {
      alert('Cycle published successfully via secure gateway!');
      navigate('/admin/products');
    }
    setLoading(false);
  };

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium mb-8"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Inventory
          </button>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Publish New Cycle</h1>
          <p className="text-gray-500 mb-8">Securely list a new high-end bicycle using the admin gateway.</p>

          {errorMsg && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-3xl flex flex-col gap-3 text-red-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error Occurred during Submission</p>
                  <p className="text-sm whitespace-pre-wrap">{errorMsg}</p>
                </div>
              </div>
              <div className="mt-2 text-xs opacity-75 border-t border-red-200 pt-3">
                <strong>Troubleshooting Tip:</strong> If you see a "Database Error (42501)", ensure your account has the 'admin' role in the <code>users</code> table and that your RLS policies allow authenticated admins to insert into <code>products</code>.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cycle Name</label>
                  <input 
                    type="text" required value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Specifications</label>
                  <textarea 
                    required rows={6} value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-widest text-[10px]">Photo Gallery</label>
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                      <img src={src} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Photos</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4">Sales Info</h3>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                  <input 
                    type="number" required value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Stock Level</label>
                  <input 
                    type="number" required value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Processing Securely...' : <><Save className="w-6 h-6" /> Publish Cycle</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAddProduct;
