export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  additionalImages?: string[];
  badge?: 'Best Seller' | 'New' | 'Top Rated' | 'Popular' | 'Sale';
  inStock: boolean;
  inventoryCount?: number;
  sku?: string;
  isArchived?: boolean;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
}
