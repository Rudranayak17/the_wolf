"use client"
import React from 'react';

import { Instagram, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-3xl font-black tracking-tighter mb-6">Code Dust Ecommerce</h3>
            <p className="text-gray-400 text-sm">
              Your destination for trendy and unique streetwear that defines the new generation.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/category/new-arrivals" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/category/trending" className="hover:text-white transition-colors">Trending</Link></li>
              <li><Link href="/category/streetwear" className="hover:text-white transition-colors">Streetwear</Link></li>
              <li><Link href="/category/accessories" className="hover:text-white transition-colors">Accessories</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Help</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link href="/sizing" className="hover:text-white transition-colors">Sizing Guide</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>© 2024 Code Dust Ecommerce. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};