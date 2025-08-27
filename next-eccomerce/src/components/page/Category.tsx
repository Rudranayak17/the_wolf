"use client"
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useStore } from '../../store/useStore'; // Adjust path as needed
import { products } from '../../data/products'; // Adjust path as needed
import type { Product } from '../../types'; // Adjust path as needed

const Category = () => {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string; // Access dynamic route parameter directly
  const [isLoading, setIsLoading] = React.useState(true);
  const { toggleWishlist, wishlist, addToCart } = useStore();

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [category]);

  const categoryProducts = products.filter((p) => p.category === category);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      ...product,
      quantity: 1,
      selectedSize: product.sizes[0],
      selectedColor: product.colors[0],
    });
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'new-arrivals':
        return 'New Arrivals';
      case 'trending':
        return 'Trending Now';
      case 'streetwear':
        return 'Streetwear';
      case 'accessories':
        return 'Accessories';
      default:
        return 'Products';
    }
  };

  return (
    <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2"
        >
          {getCategoryTitle()}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 mb-8"
        >
          Discover our latest collection
        </motion.p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {categoryProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={item}
                className="group"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={300} // Adjust based on your needs
                    height={300} // Adjust based on your needs
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-white px-4 py-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm font-medium">Add to Cart</span>
                      </button>
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={wishlist.some((item) => item.id === product.id) ? 'black' : 'none'}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{product.title}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <p className="font-medium">₹{product.price.toLocaleString()}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Category;