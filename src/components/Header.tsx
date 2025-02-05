import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Header = () => {
  const { cart, wishlist, user } = useStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const categories = [
    { name: 'All Products', path: '/products' },
    { name: 'New Arrivals', path: '/category/new-arrivals' },
    { name: 'Trending', path: '/category/trending' },
    { name: 'Streetwear', path: '/category/streetwear' },
    { name: 'Accessories', path: '/category/accessories' }
  ];

  return (
    <header className=" top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        {/* Top Bar */}
        <div className="bg-black text-white text-center text-sm py-2">
          Free shipping on orders over ₹2999 🚀
        </div>
      <div className="max-w-7xl mx-auto">

        {/* Main Header */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-3xl font-black tracking-tighter">
             THE WOLF
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {categories.map((category) => (
                <Link
                  key={category.path}
                  to={category.path}
                  className="text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              {user ? (
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm hidden md:block">{user.email}</span>
                </Link>
              ) : (
                <Link to="/login" className="text-sm">Login</Link>
              )}
              
              <Link to="/wishlist" className="relative">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              <Link to="/cart" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100"
            >
              <nav className="px-4 py-4 space-y-4">
                {categories.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    className="block text-sm font-medium hover:text-gray-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};