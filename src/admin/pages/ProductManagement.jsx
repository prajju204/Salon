import React, { useState, useEffect } from 'react';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { toast } from 'sonner';

const API_BASE = 'http://localhost:5000';
const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600';

const resolveProductImage = (src) => {
  if (!src) return DEFAULT_PRODUCT_IMAGE;
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  const uploadsIdx = src.indexOf('uploads');
  if (uploadsIdx !== -1) {
    const relativePath = src.substring(uploadsIdx).replace(/\\/g, '/');
    return `${API_BASE}/${relativePath}`;
  }
  if (src.startsWith('/')) return `${API_BASE}${src}`;
  return src;
};

const ProductManagement = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Products');

  const categories = ['All Products', 'Hair Styling', 'Hair Care', 'Beard Care', 'Shaving'];

  const filteredProducts = selectedCategory === 'All Products'
    ? products
    : (products || []).filter(p => p.category === selectedCategory);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hair Styling');
  const [image, setImage] = useState('');
  const [stockStatus, setStockStatus] = useState('In Stock');

  const resetForm = () => {
    setName('');
    setPrice('');
    setDescription('');
    setCategory('Hair Styling');
    setImage('');
    setStockStatus('In Stock');
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description);
    setCategory(product.category || 'Hair Styling');
    setImage(product.image || '');
    setStockStatus(product.stockStatus || 'In Stock');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !description || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    const payload = {
      name,
      price: parseFloat(price),
      description,
      category,
      image: image || undefined,
      stockStatus
    };

    try {
      if (editingProduct) {
        await updateProduct({ ...payload, id: editingProduct.id || editingProduct._id });
      } else {
        await addProduct(payload);
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 pt-24 md:pt-28 lg:pt-32 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Products Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Add, update, or remove grooming products in the shop.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(242,202,80,0.3)] hover:shadow-[0_0_25px_rgba(242,202,80,0.5)] transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add New Product
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-primary text-on-primary font-bold' 
                : 'bg-surface-container border border-white/10 text-on-surface hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts && filteredProducts.map((product) => (
          <div
            key={product.id || product._id}
            className="flex flex-col bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
          >
            <div className="h-48 relative overflow-hidden bg-surface-container-high">
              <img
                src={resolveProductImage(product.image)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
              <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {product.category}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  product.stockStatus === 'Out of Stock' ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  • {product.stockStatus || 'In Stock'}
                </span>
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-on-surface text-lg leading-tight truncate">
                  {product.name}
                </h3>
                <span className="font-headline font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 line-clamp-3 flex-grow">
                {product.description}
              </p>
              
              <div className="flex gap-2.5 mt-auto">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-on-surface text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => handleDelete(product.id || product._id)}
                  className="px-3 py-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] block">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {(!filteredProducts || filteredProducts.length === 0) && (
          <div className="col-span-full py-12 text-center text-on-surface-variant text-sm">
            No products available in this category.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl animate-in scale-in duration-200">
            <div className="p-6 border-b border-white/5 bg-surface-container-highest flex justify-between items-center">
              <h2 className="text-xl font-headline font-bold text-on-surface">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none"
                  placeholder="e.g. Luxe Beard Oil"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none"
                    placeholder="e.g. 1200"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Hair Styling">Hair Styling</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Beard Care">Beard Care</option>
                    <option value="Shaving">Shaving</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Stock Status</label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Product Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-white/10 text-on-surface text-sm focus:border-primary focus:outline-none resize-none"
                  placeholder="Enter detailed description of the product..."
                  required
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-on-surface text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:shadow-[0_0_15px_rgba(242,202,80,0.3)] transition-all cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
