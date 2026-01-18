
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../lib/productService';
import { Product } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import { Edit2, Trash2, Plus, Package, IndianRupee } from 'lucide-react';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await productService.getAll();
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await productService.delete(productId);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-grow p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900">Products Inventory</h1>
              <p className="text-gray-500">Manage your cycles and stock levels</p>
            </div>
            <Link 
              to="/admin/products/add"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus className="w-5 h-5" /> Add New Cycle
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory</th>
                  <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-12 text-center text-gray-500">Loading products...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-gray-500">No products found. Start by adding one!</td></tr>
                ) : products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          <img 
                            src={(product.images && product.images[0]) || product.image_url || 'https://via.placeholder.com/150'} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1 font-black text-indigo-600 text-lg">
                        <IndianRupee className="w-4 h-4" />
                        {product.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        product.stock > 10 ? 'bg-green-50 text-green-600' : product.stock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                      }`}>
                        <Package className="w-3 h-3" />
                        {product.stock} in stock
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/products/edit/${product.id}`}
                          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
