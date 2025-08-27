export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  sizes: string[];
  colors: string[];
  category: string;
  tags: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface User {
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  recentOrders: Order[];
  salesData: { month: string; sales: number }[];
  categoryData: { name: string; value: number }[];
}