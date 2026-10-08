import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { STORES } from '@/data/stores';
import { TESTIMONIALS } from '@/data/testimonials';
import { Product, Category } from '@/types/product';
import { StoreLocation } from '@/types/store';
import { Testimonial } from '@/types/testimonial';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export interface FilterParams {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating';
}

/**
 * Unified API Client for Sriram & Co
 * Prioritizes live Express + MongoDB endpoints with instant cache invalidation,
 * with graceful fallback to local mock data if the server is offline.
 */
export const api = {
  // Products
  async getProducts(params?: FilterParams): Promise<Product[]> {
    if (!USE_MOCK) {
      try {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res = await fetch(`${API_BASE}/products?${query}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : data.data || [];
        }
      } catch {
        // Fall back to mock if server offline
      }
    }

    let filtered = [...PRODUCTS];

    if (params?.category) {
      filtered = filtered.filter(p => p.categorySlug === params.category);
    }

    if (params?.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= params.maxPrice!);
    }

    if (params?.sortBy) {
      if (params.sortBy === 'price-low') filtered.sort((a, b) => a.price - b.price);
      if (params.sortBy === 'price-high') filtered.sort((a, b) => b.price - a.price);
      if (params.sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/products/${slug}`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to mock
      }
    }

    const found = PRODUCTS.find(p => p.slug === slug);
    return found || null;
  },

  async getBestSellers(): Promise<Product[]> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/products/featured`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to mock
      }
    }

    return PRODUCTS.slice(0, 8);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/categories`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to local categories on build/offline
      }
    }
    return CATEGORIES;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/categories/${slug}`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to local categories
      }
    }
    return CATEGORIES.find(c => c.slug === slug) || null;
  },

  // Stores
  async getStores(): Promise<StoreLocation[]> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/stores`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to local stores on build/offline
      }
    }
    return STORES;
  },

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/testimonials`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch {
        // Fall back to local testimonials on build/offline
      }
    }
    return TESTIMONIALS;
  },

  // Admin Product Operations
  async getAdminProductStats(token?: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    categoriesCount: number;
    totalCatalogValue: number;
  }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/admin/stats`, { headers });
    if (!res.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    return res.json();
  },

  async getAdminProducts(token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/admin/all`, { headers });
    if (!res.ok) {
      return this.getProducts();
    }
    return res.json();
  },

  async getProductById(id: string): Promise<Product | null> {
    const res = await fetch(`${API_BASE}/products/id/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async createProduct(productData: Partial<Product>, token?: string): Promise<Product> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create product' }));
      throw new Error(err.message || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, productData: Partial<Product>, token?: string): Promise<Product> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update product' }));
      throw new Error(err.message || 'Failed to update product');
    }
    return res.json();
  },

  async toggleProductStock(id: string, inStock: boolean, inventoryCount?: number, token?: string): Promise<Product> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ inStock, inventoryCount }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update stock status' }));
      throw new Error(err.message || 'Failed to update stock status');
    }
    return res.json();
  },

  async deleteProduct(id: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete product' }));
      throw new Error(err.message || 'Failed to delete product');
    }
  },
};
