'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
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

  const defaultImage =
    'https://via.placeholder.com/150?text=No+Image';

  // Fetch categories and products
  const fetchCategories = async () => {
    const snapshot = await getDocs(collection(db, 'categories'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(data);
    if (!selectedCategory && data.length > 0) {
      setSelectedCategory(data[0].name);
    }
  };

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, 'products'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Form handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCategory = async () => {
    if (!formData.name) return alert('Name is required!');
    const data = {
      name: formData.name,
      image: formData.image || defaultImage,
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

  const handleSaveProduct = async () => {
    const { name, image, price, weight, category } = formData;
    if (!name || !price || !weight || !category)
      return alert('All fields except image are required!');
    const data = {
      name,
      image: image || defaultImage,
      price: parseFloat(price),
      weight,
      category,
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

  const handleEdit = (type, item) => {
    setFormData(item);
    setEditMode({ type, id: item.id });
    if (type === 'category') setShowCategoryModal(true);
    else setShowProductModal(true);
  };

  const handleDelete = async (type, id) => {
    const ref = doc(db, type === 'category' ? 'categories' : 'products', id);
    await deleteDoc(ref);
    if (type === 'category') fetchCategories();
    else fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Category section */}
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
      <div className="flex space-x-4 mb-8 overflow-x-auto">
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`p-3 border rounded-lg cursor-pointer min-w-[150px] flex flex-col items-center ${
              selectedCategory === cat.name
                ? 'bg-green-600'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <img
              src={cat.image}
              className="w-16 h-16 object-cover rounded-full mb-2 border"
            />
            <span className="text-sm">{cat.name}</span>
            <div className="flex space-x-2 mt-2">
              <button
                className="text-xs bg-yellow-500 px-2 rounded"
                onClick={e => {
                  e.stopPropagation();
                  handleEdit('category', cat);
                }}
              >
                Edit
              </button>
              <button
                className="text-xs bg-red-600 px-2 rounded"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete('category', cat.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product section */}
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products
          .filter(p => p.category === selectedCategory)
          .map(product => (
            <div
              key={product.id}
              className="bg-gray-800 p-4 rounded shadow flex flex-col items-center"
            >
              <img
                src={product.image}
                className="w-full aspect-square object-cover rounded mb-2"
              />
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-xs text-gray-400">{product.weight}</p>
              <p className="font-semibold text-green-300">₹{product.price}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  className="text-xs bg-yellow-500 px-2 rounded"
                  onClick={() => handleEdit('product', product)}
                >
                  Edit
                </button>
                <button
                  className="text-xs bg-red-600 px-2 rounded"
                  onClick={() => handleDelete('product', product.id)}
                >
                  Delete
                </button>
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
            <div className="flex justify-end space-x-3">
              <button
                className="bg-gray-600 px-4 py-2 rounded"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 px-4 py-2 rounded"
                onClick={handleSaveCategory}
              >
                Save
              </button>
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
              name="weight"
              placeholder="Weight (e.g., 1kg)"
              value={formData.weight || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            />
            <select
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full mb-3 p-2 bg-gray-700 rounded"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                className="bg-gray-600 px-4 py-2 rounded"
                onClick={() => setShowProductModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 px-4 py-2 rounded"
                onClick={handleSaveProduct}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
