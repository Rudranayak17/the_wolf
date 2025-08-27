'use client'
import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { products } from '@/data/products';
import { useParams, useRouter } from 'next/navigation';

export const ProductDetail = () => {
  const router = useRouter();
const params = useParams(); // Use useParams to get dynamic route parameters
  const id = params?.id; // Extrac
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const product = products.find(p => p.id === Number(id));
  
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0]);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]);
  
  if (!product) {
    return <div>Product not found</div>;
  }

  const isWishlisted = wishlist.some(item => item.id === product.id);

  const handleAddToCart = () => {
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: selectedSize!,
      selectedColor: selectedColor!
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-square rounded-2xl overflow-hidden bg-gray-100"
          >
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-4xl font-bold">{product.title}</h1>
            <p className="text-2xl font-medium mt-4">₹{product.price.toLocaleString()}</p>
            <p className="text-gray-600 mt-4">{product.description}</p>

            <div className="mt-8">
              <h3 className="font-medium mb-4">Select Size</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md border ${
                      selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-medium mb-4">Select Color</h3>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-md border ${
                      selectedColor === color
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-4 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 rounded-md border ${
                  isWishlisted
                    ? 'border-red-500 text-red-500'
                    : 'border-gray-200 hover:border-black'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};