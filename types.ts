
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  images?: string[]; // Array of image URLs for Amazon-style display
  created_at: string;
}

export type OrderStatus = 'pending' | 'approved' | 'rejected' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: OrderStatus;
  shipping_address: string;
  customer_mobile: string;
  created_at: string;
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Payment {
  id: string;
  order_id: string;
  transaction_id: string;
  screenshot_url?: string;
  status: 'pending' | 'verified' | 'failed';
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_url: string;
  invoice_number: string;
  created_at: string;
}

export interface ShippingLabel {
  id: string;
  order_id: string;
  label_url: string;
  tracking_number: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
