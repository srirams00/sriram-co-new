'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/types/product';
import styles from './products.module.css';

interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  categoriesCount: number;
  totalCatalogValue: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    categoriesCount: 0,
    totalCatalogValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCatalogData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('src_auth_token') || undefined : undefined;

      const [statsData, productsData] = await Promise.all([
        api.getAdminProductStats(token).catch(() => null),
        api.getAdminProducts(token).catch(() => []),
      ]);

      if (productsData) {
        setProducts(productsData);
      }

      if (statsData) {
        setStats(statsData);
      } else if (productsData && productsData.length > 0) {
        // Fallback stats computation
        const total = productsData.length;
        const active = productsData.filter((p) => p.inStock).length;
        const low = productsData.filter((p) => (p.inventoryCount ?? 15) <= 5 && (p.inventoryCount ?? 15) > 0).length;
        const cats = new Set(productsData.map((p) => p.category)).size;
        const val = productsData.reduce((sum, p) => sum + p.price * (p.inventoryCount ?? 15), 0);
        setStats({
          totalProducts: total,
          activeProducts: active,
          lowStockProducts: low,
          categoriesCount: cats,
          totalCatalogValue: val,
        });
      }
    } catch (err: any) {
      setActionError(err.message || 'Error fetching catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Format currency in Lakhs or standard INR format
  const formatCatalogValue = (val: number): string => {
    if (val >= 100000) {
      const inLakhs = (val / 100000).toFixed(2);
      return `₹${inLakhs}L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Extract unique categories for dropdown filter
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Stock status helper
  const getProductStatus = (p: Product) => {
    const count = p.inventoryCount ?? (p.inStock ? 15 : 0);
    if (!p.inStock || count === 0) {
      return { label: 'Out of stock', className: styles.statusOutOfStock };
    }
    if (count <= 5) {
      return { label: 'Low stock', className: styles.statusLowStock };
    }
    return { label: 'Active', className: styles.statusActive };
  };

  // Quick toggle in-stock status
  const handleToggleStock = async (product: Product) => {
    try {
      const token = localStorage.getItem('src_auth_token') || undefined;
      const nextStock = !product.inStock;
      const nextCount = nextStock ? (product.inventoryCount && product.inventoryCount > 0 ? product.inventoryCount : 10) : 0;

      const updated = await api.toggleProductStock(product.id, nextStock, nextCount, token);

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, inStock: updated.inStock, inventoryCount: updated.inventoryCount } : item))
      );

      // Re-fetch stats
      api.getAdminProductStats(token).then((res) => res && setStats(res)).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to toggle stock status');
    }
  };

  // Safe delete product
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('src_auth_token') || undefined;
      await api.deleteProduct(deleteTarget.id, token);

      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);

      // Re-fetch stats
      api.getAdminProductStats(token).then((res) => res && setStats(res)).catch(() => {});
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.catalogContainer}>
      {/* Title & Action Row */}
      <div className={styles.catalogHeader}>
        <div className={styles.headerText}>
          <h2 className={styles.catalogTitle}>Product catalog</h2>
          <p className={styles.catalogSubtitle}>Manage products, pricing, inventory, and visibility.</p>
        </div>

        <Link href="/admin/products/new" className={styles.addProductBtn}>
          <Plus size={16} strokeWidth={2.5} />
          <span>Add product</span>
        </Link>
      </div>

      {actionError && (
        <div style={{ background: '#FEECEC', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '0.86rem', border: '1px solid #FCD3D3' }}>
          {actionError}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Total products */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
              <Package size={18} />
            </div>
            <span className={styles.kpiTag}>THIS MONTH</span>
          </div>
          <span className={styles.kpiLabel}>Total products</span>
          <span className={styles.kpiValue}>{stats.totalProducts}</span>
          <span className={styles.kpiFooter}>Across {stats.categoriesCount} categories</span>
        </div>

        {/* Card 2: Active products */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
              <TrendingUp size={18} />
            </div>
            <span className={styles.kpiTag}>THIS MONTH</span>
          </div>
          <span className={styles.kpiLabel}>Active products</span>
          <span className={styles.kpiValue}>{stats.activeProducts}</span>
          <span className={styles.kpiFooter}>Visible in storefront</span>
        </div>

        {/* Card 3: Low stock */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconAmber}`}>
              <AlertTriangle size={18} />
            </div>
            <span className={styles.kpiTag}>THIS MONTH</span>
          </div>
          <span className={styles.kpiLabel}>Low stock</span>
          <span className={styles.kpiValue}>{stats.lowStockProducts}</span>
          <span className={styles.kpiFooter}>Needs attention</span>
        </div>

        {/* Card 4: Catalog value */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
              <CheckCircle2 size={18} />
            </div>
            <span className={styles.kpiTag}>THIS MONTH</span>
          </div>
          <span className={styles.kpiLabel}>Catalog value</span>
          <span className={styles.kpiValue}>{formatCatalogValue(stats.totalCatalogValue)}</span>
          <span className={styles.kpiFooter}>Current retail value</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search products or SKU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterSelectWrapper}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All products</option>
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.filterChevron} />
        </div>
      </div>

      {/* Product Table Container */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE</th>
                <th>INVENTORY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    Loading catalog items...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyState}>
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status = getProductStatus(p);
                  const count = p.inventoryCount ?? (p.inStock ? 15 : 0);
                  const sku = p.sku || `SKU ${p.slug.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr key={p.id} className={styles.tableRow}>
                      {/* Product Name + Thumb + SKU */}
                      <td>
                        <div className={styles.productCell}>
                          <img
                            src={p.image || '/placeholder.png'}
                            alt={p.name}
                            className={styles.productThumb}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=100&q=80';
                            }}
                          />
                          <div className={styles.productMeta}>
                            <span className={styles.productName}>{p.name}</span>
                            <span className={styles.productSku}>{sku}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={styles.categoryText}>{p.category}</span>
                      </td>

                      {/* Price */}
                      <td>
                        <span className={styles.priceText}>₹{p.price.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Inventory */}
                      <td>
                        <span
                          className={`${styles.inventoryText} ${
                            count === 0 ? styles.inventoryEmpty : count <= 5 ? styles.inventoryLow : ''
                          }`}
                        >
                          {count} units
                        </span>
                      </td>

                      {/* Status pill (clickable to toggle stock) */}
                      <td>
                        <button
                          type="button"
                          className={`${styles.statusBadge} ${status.className}`}
                          onClick={() => handleToggleStock(p)}
                          title="Click to toggle active stock status"
                        >
                          {status.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => router.push(`/admin/products/${p.id}/edit`)}
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionIconBtn} ${styles.deleteIconBtn}`}
                            onClick={() => setDeleteTarget(p)}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleToggleStock(p)}
                            title="Toggle stock availability"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className={styles.tableFooter}>
          <span>
            Showing {filteredProducts.length} of {products.length} products
          </span>
          <button
            type="button"
            className={styles.actionIconBtn}
            onClick={fetchCatalogData}
            title="Refresh catalog list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Delete Product</h3>
            <p className={styles.modalMessage}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the catalog?
              If this product is associated with active customer orders, it cannot be deleted.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDeleteBtn}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
