import { create } from 'zustand';
import { CartItem, Product, User, Order } from '../types';

interface Store {
  cart: CartItem[];
  wishlist: Product[];
  user: User | null;
  orders: Order[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  setUser: (user: User | null) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const useStore = create<Store>((set) => ({
  cart: [],
  wishlist: [],
  user: null,
  orders: [],
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
  clearCart: () => set({ cart: [] }),
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
  addOrder: (order) =>
    set((state) => ({
      orders: [...state.orders, order],
    })),
  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
      ),
    })),
}));