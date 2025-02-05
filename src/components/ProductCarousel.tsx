import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useStore } from '../store/useStore';

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

export const ProductCarousel = ({ title, products }: ProductCarouselProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { toggleWishlist, wishlist } = useStore();
  const itemsPerPage = 4;

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + itemsPerPage >= products.length ? 0 : prev + itemsPerPage
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev - itemsPerPage < 0 ? Math.max(0, products.length - itemsPerPage) : prev - itemsPerPage
    );
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          <p className="text-gray-600">Discover your next favorite piece</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full hover:bg-black hover:text-white transition-colors border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full hover:bg-black hover:text-white transition-colors border border-gray-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
          transition={{ type: "tween", ease: "easeInOut" }}
          className="flex"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              className="min-w-[25%] px-3"
              whileHover={{ y: -5 }}
              transition={{ type: "tween" }}
            >
              <div className="bg-gray-50 rounded-xl p-4 group">
                <Link to={`/product/${product.id}`}>
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-4">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium">View Details</span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-lg mb-1">{product.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        <span className="ml-1 text-sm">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Heart 
                      className={`w-5 h-5 ${
                        wishlist.some(item => item.id === product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">₹{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{product.inStock ? 'In Stock' : 'Out of Stock'}</p>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};