'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { FiEdit, FiTrash2 } from "react-icons/fi";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export default function CatalogAdminPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState({ type: null, id: null });

  const defaultImage = 'https://i.ibb.co/w2R7kvD/Habit-us.png';

  // Fetch categories
  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by priority ascending (lowest first)
    data.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    setCategories(data);
    if (!selectedCategory && data.length > 0) {
      setSelectedCategory(data[0].name);
    }
  };


  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by product name alphabetically
    data.sort((a, b) => a.name.localeCompare(b.name));
    setProducts(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Handle input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save category
  const handleSaveCategory = async () => {
    if (!formData.name) return alert('Name is required!');
    const data = {
      name: formData.name,
      image: formData.image || defaultImage,
      priority: parseInt(formData.priority) || 100,
    };
    if (editMode.type === 'category') {
      await updateDoc(doc(db, 'categories', editMode.id), data);
    } else {
      await addDoc(collection(db, 'categories'), data);
    }
    setFormData({});
    setEditMode({ type: null, id: null });
    setShowCategoryModal(false);
    fetchCategories();
  };

  // Save product
  // Generate random product ID like p-XXXXX
  const generateProductId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `P${result}`;
  };

  const handleSaveProduct = async () => {
    const { name, image, price, mrp, weight, category, stock, recommended, productId } = formData;
    if (!name || !price || !weight || !category)
      return alert('All fields except image are required!');

    const data = {
      productId: productId || generateProductId(), // Auto-generate if empty
      name,
      image: image || defaultImage,
      price: parseFloat(price),
      mrp: parseFloat(mrp),
      weight,
      category,
      stock: parseInt(stock) || 1,
      recommended: !!recommended,
    };

    if (editMode.type === 'product') {
      await updateDoc(doc(db, 'products', editMode.id), data);
    } else {
      await addDoc(collection(db, 'products'), data);
    }

    setFormData({});
    setEditMode({ type: null, id: null });
    setShowProductModal(false);
    fetchProducts();
  };


  // Edit
  const handleEdit = (type, item) => {
    setFormData(item);
    setEditMode({ type, id: item.id });
    if (type === 'category') setShowCategoryModal(true);
    else setShowProductModal(true);
  };

  // Delete
  // const handleDelete = async (type, id) => {
  //   const userInput = prompt(`Type "confirm" to delete this ${type}:`);
  //   if (userInput && userInput.toLowerCase() === "confirm") {
  //     try {
  //       const ref = doc(db, type === 'category' ? 'categories' : 'products', id);
  //       await deleteDoc(ref);
  //       if (type === 'category') fetchCategories();
  //       else fetchProducts();
  //       alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`);
  //     } catch (error) {
  //       console.error("Error deleting:", error);
  //       alert("Failed to delete. Please try again.");
  //     }
  //   } else {
  //     alert("Deletion cancelled. You must type 'confirm' to proceed.");
  //   }
  // };


  const handleDelete = async (type, id) => {
    const confirmed = confirm(`Are you sure you want to delete this ${type}?`);
    if (!confirmed) return;
  
    try {
      const ref = doc(db, type === 'category' ? 'categories' : 'products', id);
      await deleteDoc(ref);
      if (type === 'category') fetchCategories();
      else fetchProducts();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Categories */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-400">Categories</h2>
        <button
          className="bg-green-600 px-4 py-2 rounded"
          onClick={() => {
            setFormData({});
            setEditMode({ type: null, id: null });
            setShowCategoryModal(true);
          }}
        >
          Add Category
        </button>
      </div>
      <div className="flex space-x-4 mb-8 whitespace-nowrap overflow-x-auto">
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`p-3 rounded-lg cursor-pointer min-w-[150px] flex flex-col items-center transition-colors duration-200 ${selectedCategory === cat.name
              ? 'bg-gray-700'
              : 'bg-gray-800 hover:bg-gray-700'
              }`}
          >
            <img src={cat.image} className="w-16 h-16 object-cover rounded-full mb-2" />
            <span className="text-sm font-bold truncate block max-w-[150px]">
              {cat.name}
            </span>
            <p className="text-xs text-gray-400">Priority: {cat.priority ?? 0}</p>
            <div className="flex space-x-2 mt-2 font-bold">
              <button
                className="text-xs bg-green-600 p-1 rounded flex items-center justify-center"
                onClick={e => {
                  e.stopPropagation();
                  handleEdit('category', cat);
                }}
              >
                <FiEdit size={20} />
              </button>
              <button
                className="text-xs bg-red-600 p-1 rounded flex items-center justify-center"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete('category', cat.id);
                }}
              >
                <FiTrash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Products */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-400">Products</h2>
        <button
          className="bg-green-600 px-4 py-2 rounded"
          onClick={() => {
            setFormData({});
            setEditMode({ type: null, id: null });
            setShowProductModal(true);
          }}
        >
          Add Product
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {products
          .filter(p => p.category === selectedCategory)
          .map(product => (
            <div
              key={product.id}
              className="bg-gray-800 p-2 rounded shadow w-full max-w-[200px] flex flex-col min-h-[320px]"
            >
              {/* Image */}
              <div className="w-full aspect-square bg-gray-700 rounded mb-2 overflow-hidden relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />

                {/* Copy button overlay */}
                <button
                  className="absolute top-2 right-2 bg-yellow-600 bg-opacity-70 text-xl px-2 py-1 font-bold rounded hover:bg-yellow-700"
                  onClick={() => {
                    navigator.clipboard.writeText(product.id);
                    alert("Document ID copied to clipboard!");
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Details */}
              <div className="bg-gray-900 p-2 rounded flex flex-col justify-between flex-1">
                <div className="flex flex-col text-left">
                  <h3 className="font-bold text-base line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-400">{product.weight}</p>
                  <p className="font-semibold text-green-300 text-base">₹{product.price}</p>
                  <p className="font-semibold text-green-300 text-base">MRP: ₹{product.mrp}</p>
                  <p className="text-xs text-gray-400">Stock: {product.stock ?? 0}</p>
                  {product.recommended && (
                    <span className="text-xs text-yellow-400">⭐ Recommended</span>
                  )}

                  {/* Document ID + Copy */}
                  {/* <div className="flex items-center space-x-2 mt-1">
                    <p className="text-[10px] text-gray-500 truncate max-w-[100px]">
                      {product.id}
                    </p>
                    <button
                      className="text-xs bg-gray-700 px-2 py-0.5 rounded hover:bg-gray-600"
                      onClick={() => {
                        navigator.clipboard.writeText(product.id);
                        alert("Document ID copied to clipboard!");
                      }}
                    >
                      Copy
                    </button>
                  </div> */}
                </div>

                {/* Action buttons at bottom */}
                <div className="flex space-x-1 mt-2">
                  <button
                    className="bg-green-600 p-1 rounded flex items-center justify-center flex-1"
                    onClick={() => handleEdit("product", product)}
                    title="Edit"
                  >
                    <FiEdit size={20} />
                  </button>
                  <button
                    className="bg-red-600 p-1 rounded flex items-center justify-center flex-1"
                    onClick={() => handleDelete("product", product.id)}
                    title="Delete"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

          ))}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editMode.type === 'category' ? 'Edit' : 'Add'} Category
            </h3>
            <input
              name="name"
              placeholder="Category Name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="image"
              placeholder="Image URL (optional)"
              value={formData.image || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="priority"
              type="number"
              placeholder="Priority (0 default)"
              value={formData.priority ?? ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <div className="flex justify-end space-x-3">
              <button className="bg-gray-600 px-4 py-2 rounded" onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className="bg-green-600 px-4 py-2 rounded" onClick={handleSaveCategory}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editMode.type === 'product' ? 'Edit' : 'Add'} Product
            </h3>
            <input
              name="productId"
              placeholder="Product ID (auto-generated if empty)"
              value={formData.productId || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />

            <input
              name="name"
              placeholder="Product Name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="image"
              placeholder="Image URL (optional)"
              value={formData.image || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="price"
              type="number"
              placeholder="Price"
              value={formData.price || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="mrp"
              type="number"
              placeholder="MRP"
              value={formData.mrp || '0'}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="weight"
              placeholder="Weight (e.g., 1kg)"
              value={formData.weight || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <input
              name="stock"
              type="number"
              placeholder="Stock"
              value={formData.stock || '1'}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <label className="flex items-center space-x-2 mb-3">
              <input
                type="checkbox"
                name="recommended"
                checked={!!formData.recommended}
                onChange={handleChange}
              />
              <span>Recommended</span>
            </label>
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button className="bg-gray-600 px-4 py-2 rounded" onClick={() => setShowProductModal(false)}>Cancel</button>
              <button className="bg-green-600 px-4 py-2 rounded" onClick={handleSaveProduct}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
