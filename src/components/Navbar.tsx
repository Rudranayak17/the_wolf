import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, User } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Navbar = () => {
  const { cart, wishlist, user } = useStore();

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">TRENDY</Link>
          
          <div className="flex items-center gap-6">
            {user ? (
              <Link to="/profile" className="flex items-center gap-2">
                <User className="w-5 h-5" />
                <span className="text-sm">{user.email}</span>
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
          </div>
        </div>
      </div>
    </nav>
  );
};