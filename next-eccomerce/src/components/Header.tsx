// app/components/Header.tsx
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, User, Menu, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore'; // Adjust path as needed


export const Header = () => {
  const { cart, wishlist, user } = useStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const router = useRouter();

  const categories = [
    { name: 'All Products', path: '/products' },
    { name: 'New Arrivals', path: '/category/new-arrivals' },
    { name: 'Trending', path: '/category/trending' },
    { name: 'Streetwear', path: '/category/streetwear' },
    { name: 'Accessories', path: '/category/accessories' },
  ];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('search')?.toString();
    if (query) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div>
        {/* Top Bar */}
        <div className="bg-black text-white text-center text-sm py-2">
          Free shipping on orders over ₹2999 🚀
        </div>

        {/* Main Header */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-3xl font-black tracking-tighter" >
              Code Dust Ecommerce
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {categories.map((category) => (
                <Link
                  key={category.path}
                  href={category.path}
                  className="text-sm font-medium hover:text-gray-600 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Toggle search"
                className="relative"
              >
                <Search className="w-5 h-5" />
              </button>

              {user ? (
                <div className="relative group">
                  <button
                    className="flex items-center gap-2"
                    aria-expanded="false"
                    aria-controls="user-menu"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm hidden md:block">{user.email}</span>
                  </button>
                  <div
                    id="user-menu"
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <hr className="my-1" />
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Link href="/login" className="text-sm" rel="nofollow">
                  Login
                </Link>
              )}

              <Link href="/wishlist" className="relative" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative" aria-label="Cart">
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
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Search Input */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 border-t border-gray-100"
              >
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search products..."
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    aria-label="Search products"
                  />
                  <button type="submit" className="p-2" aria-label="Submit search">
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
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
                    href={category.path}
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

