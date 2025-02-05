import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface Store {
  cart: CartItem[];
  wishlist: Product[];
  user: { email: string } | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  toggleWishlist: (product: Product) => void;
  setUser: (user: { email: string } | null) => void;
}

export const useStore = create<Store>((set) => ({
  cart: [],
  wishlist: [],
  user: null,
  addToCart: (item) =>
    set((state) => {
      const existingItem = state.cart.find(
        (i) => 
          i.id === item.id && 
          i.selectedSize === item.selectedSize && 
          i.selectedColor === item.selectedColor
      );

      if (existingItem) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    })),
  toggleWishlist: (product) =>
    set((state) => {
      const exists = state.wishlist.find((item) => item.id === product.id);
      return {
        wishlist: exists
          ? state.wishlist.filter((item) => item.id !== product.id)
          : [...state.wishlist, product],
      };
    }),
  setUser: (user) => set({ user }),
}));