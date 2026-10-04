import { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}
