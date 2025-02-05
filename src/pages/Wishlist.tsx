import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

export const Wishlist = () => {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  const handleAddToCart = (product: any) => {
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: product.sizes[0],
      selectedColor: product.colors[0]
    });
    toggleWishlist(product);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen pt-20 px-4 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
        <Link to="/" className="text-black hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">My Wishlist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-4 rounded-lg shadow-sm"
            >
              <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-gray-600 mt-1">₹{item.price.toLocaleString()}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(item)}
                  className="p-2 rounded-md border border-gray-200 hover:border-black transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};