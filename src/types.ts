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
  password: string;
}