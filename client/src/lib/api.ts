import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { STORES } from '@/data/stores';
import { TESTIMONIALS } from '@/data/testimonials';
import { Product, Category } from '@/types/product';
import { StoreLocation } from '@/types/store';
import { Testimonial } from '@/types/testimonial';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
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
 * Switches cleanly between local mock datasets and live Express REST endpoints.
 */
export const api = {
  // Products
  async getProducts(params?: FilterParams): Promise<Product[]> {
    if (USE_MOCK) {
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
    }

    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/products?${query}`);
    return res.json();
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    if (USE_MOCK) {
      const found = PRODUCTS.find(p => p.slug === slug);
      return found || null;
    }

    const res = await fetch(`${API_BASE}/products/${slug}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getBestSellers(): Promise<Product[]> {
    if (USE_MOCK) {
      return PRODUCTS.slice(0, 8);
    }
    const res = await fetch(`${API_BASE}/products/featured`);
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK) {
      return CATEGORIES;
    }
    const res = await fetch(`${API_BASE}/categories`);
    return res.json();
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (USE_MOCK) {
      return CATEGORIES.find(c => c.slug === slug) || null;
    }
    const res = await fetch(`${API_BASE}/categories/${slug}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Stores
  async getStores(): Promise<StoreLocation[]> {
    if (USE_MOCK) {
      return STORES;
    }
    const res = await fetch(`${API_BASE}/stores`);
    return res.json();
  },

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    if (USE_MOCK) {
      return TESTIMONIALS;
    }
    const res = await fetch(`${API_BASE}/testimonials`);
    return res.json();
  },
};
