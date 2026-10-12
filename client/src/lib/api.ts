import { PRODUCTS } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { STORES } from '@/data/stores';
import { TESTIMONIALS } from '@/data/testimonials';
import { Product, Category } from '@/types/product';
import { StoreLocation } from '@/types/store';
import { Testimonial } from '@/types/testimonial';
import { Order } from '@/types/order';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export interface FilterParams {
  category?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating';
}

// High-speed in-memory client/server cache with 60s TTL
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data as T;
  }
  memoryCache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  memoryCache.set(key, { data, expiry: Date.now() + ttl });
}

export const api = {
  clearCache(): void {
    memoryCache.clear();
  },

  // Products
  async getProducts(params?: FilterParams): Promise<Product[]> {
    const cacheKey = `products_${JSON.stringify(params || {})}`;
    const cached = getCached<Product[]>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const queryObj: Record<string, string> = {};
        if (params?.category) queryObj.category = params.category;
        if (params?.query) queryObj.query = params.query;
        if (params?.minPrice !== undefined) queryObj.minPrice = String(params.minPrice);
        if (params?.maxPrice !== undefined) queryObj.maxPrice = String(params.maxPrice);
        if (params?.sortBy) queryObj.sortBy = params.sortBy;
        queryObj.limit = '100';

        const fetchPage = async (page: number) => {
          const qs = new URLSearchParams({ ...queryObj, page: String(page) }).toString();
          const res = await fetch(`${API_BASE}/products?${qs}`, {
            next: { revalidate: 60 },
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
          }

          return res.json() as Promise<
            Product[] | { data?: Product[]; pagination?: { totalPages?: number } }
          >;
        };

        const firstPage = await fetchPage(1);
        const list = Array.isArray(firstPage) ? firstPage : firstPage.data || [];
        const totalPages = Array.isArray(firstPage) ? 1 : firstPage.pagination?.totalPages || 1;
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2))
        );
        const allProducts = [
          ...list,
          ...remainingPages.flatMap((page) => Array.isArray(page) ? page : page.data || []),
        ];

        setCached(cacheKey, allProducts);
        return allProducts;
      } catch {
        // Fall back to mock if server offline
      }
    }

    let filtered = [...PRODUCTS];

    if (params?.category) {
      const catParam = params.category.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.categorySlug && p.categorySlug.toLowerCase() === catParam) ||
        (p.category && p.category.toLowerCase().replace(/\s+/g, '-') === catParam) ||
        (p.category && p.category.toLowerCase() === catParam)
      );
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

    setCached(cacheKey, filtered);
    return filtered;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const cacheKey = `product_slug_${slug}`;
    const cached = getCached<Product>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/products/${slug}`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data);
          return data;
        }
      } catch {
        // Fall back to mock
      }
    }

    const found = PRODUCTS.find(p => p.slug === slug) || null;
    if (found) setCached(cacheKey, found);
    return found;
  },

  async getBestSellers(): Promise<Product[]> {
    const cacheKey = 'products_featured';
    const cached = getCached<Product[]>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/products/featured`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data);
          return data;
        }
      } catch {
        // Fall back to mock
      }
    }

    const items = PRODUCTS.slice(0, 8);
    setCached(cacheKey, items);
    return items;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories_all';
    const cached = getCached<Category[]>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/categories`, {
          next: { revalidate: 120 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data, 120 * 1000);
          return data;
        }
      } catch {
        // Fall back to local categories on build/offline
      }
    }
    setCached(cacheKey, CATEGORIES, 120 * 1000);
    return CATEGORIES;
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cacheKey = `category_slug_${slug}`;
    const cached = getCached<Category>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/categories/${slug}`, {
          next: { revalidate: 120 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data, 120 * 1000);
          return data;
        }
      } catch {
        // Fall back to local categories
      }
    }
    const found = CATEGORIES.find(c => c.slug === slug) || null;
    if (found) setCached(cacheKey, found, 120 * 1000);
    return found;
  },

  // Stores
  async getStores(): Promise<StoreLocation[]> {
    const cacheKey = 'stores_all';
    const cached = getCached<StoreLocation[]>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/stores`, {
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data, 300 * 1000);
          return data;
        }
      } catch {
        // Fall back to local stores on build/offline
      }
    }
    setCached(cacheKey, STORES, 300 * 1000);
    return STORES;
  },

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    const cacheKey = 'testimonials_all';
    const cached = getCached<Testimonial[]>(cacheKey);
    if (cached) return cached;

    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE}/testimonials`, {
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = await res.json();
          setCached(cacheKey, data, 300 * 1000);
          return data;
        }
      } catch {
        // Fall back to local testimonials on build/offline
      }
    }
    setCached(cacheKey, TESTIMONIALS, 300 * 1000);
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

    const res = await fetch(`${API_BASE}/products/admin/stats`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    return res.json();
  },

  async getAdminProducts(token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/admin/all`, {
      headers,
      cache: 'no-store',
    });
    if (!res.ok) {
      return this.getProducts();
    }
    return res.json();
  },

  async getProductById(id: string): Promise<Product | null> {
    const res = await fetch(`${API_BASE}/products/id/${id}`, { cache: 'no-store' });
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
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
    this.clearCache();
  },

  // Orders
  async createOrder(orderData: any, token?: string): Promise<Order> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create order' }));
      throw new Error(err.message || 'Failed to create order');
    }
    return res.json();
  },

  async getMyOrders(token: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch your orders' }));
      throw new Error(err.message || 'Failed to fetch your orders');
    }
    return res.json();
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderNumber}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Order not found' }));
      throw new Error(err.message || 'Order not found');
    }
    return res.json();
  },

  async getAdminOrders(token?: string, status?: string, search?: string): Promise<{ orders: any[]; stats: any }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/orders${qs}`, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch orders' }));
      throw new Error(err.message || 'Failed to fetch orders');
    }
    return res.json();
  },

  async updateOrderStatus(id: string, orderStatus?: string, paymentStatus?: string, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ orderStatus, paymentStatus }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update order' }));
      throw new Error(err.message || 'Failed to update order');
    }
    return res.json();
  },

  // Customers
  async getAdminCustomers(token?: string, search?: string): Promise<{ customers: any[]; stats: any }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    if (search) params.set('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/auth/customers${qs}`, { headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to fetch customers' }));
      throw new Error(err.message || 'Failed to fetch customers');
    }
    return res.json();
  },
};
