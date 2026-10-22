'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { api } from '@/lib/api';
import { Product } from '@/types/product';
import { getOptimizedImageUrl } from '@/lib/utils';
import styles from './Header.module.css';

interface ProductSearchSuggestionsProps {
  id: string;
  query: string;
  products: Product[];
  productsLoaded: boolean;
  productsLoadFailed: boolean;
  onSelect: () => void;
}

function ProductSearchSuggestions({
  id,
  query,
  products,
  productsLoaded,
  productsLoadFailed,
  onSelect,
}: ProductSearchSuggestionsProps) {
  if (!query.trim()) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = products
    .filter(product =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.shortDescription.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5);

  return (
    <div id={id} className={styles.searchSuggestions}>
      {!productsLoaded ? (
        <p className={styles.searchSuggestionMessage} role="status">Loading products...</p>
      ) : productsLoadFailed ? (
        <p className={styles.searchSuggestionMessage} role="alert">Product suggestions could not be loaded.</p>
      ) : suggestions.length === 0 ? (
        <p className={styles.searchSuggestionMessage} role="status">No matching products.</p>
      ) : (
        <ul className={styles.searchSuggestionList}>
          {suggestions.map(product => (
            <li key={product.id}>
              <Link
                href={`/product/${encodeURIComponent(product.slug || product.id)}`}
                className={styles.searchSuggestion}
                onClick={onSelect}
              >
                <img
                  src={getOptimizedImageUrl(product.image, 80)}
                  alt=""
                  className={styles.searchSuggestionImage}
                  width={40}
                  height={40}
                />
                <span className={styles.searchSuggestionText}>
                  <strong>{product.name}</strong>
                  <span>{product.category}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const { summary, setIsCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);
  const [searchProductsLoaded, setSearchProductsLoaded] = useState(false);
  const [searchProductsLoadFailed, setSearchProductsLoadFailed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem('src_user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    syncUser();
    window.addEventListener('auth-change', syncUser);
    window.addEventListener('storage', syncUser);

    return () => {
      window.removeEventListener('auth-change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Keyboard accessibility: Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    let isMounted = true;

    api.getProducts().then(products => {
      if (isMounted) {
        setSearchProducts(products);
        setSearchProductsLoaded(true);
      }
    }).catch(error => {
      console.error('Failed to load products for search suggestions.', error);
      if (isMounted) {
        setSearchProductsLoadFailed(true);
        setSearchProductsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSuggestionSelect = () => {
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        {/* Left: Brand Logo */}
        <div className={styles.brandWrapper}>
          <button 
            type="button" 
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className={styles.logo}>
            <img 
              src="/logo.webp" 
              alt="Sriram & Co Logo" 
              className={styles.logoImage}
              width={40}
              height={40}
            />
            <span className={styles.logoText}>
              Sriram <span className={styles.logoAmp}>&amp;</span> Co
            </span>
          </Link>
        </div>

        {/* Center-Left: Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <Link href="/shop" className={styles.navLink}>Shop</Link>
          <Link href="/categories" className={styles.navLink}>Categories</Link>
          <Link href="/about" className={styles.navLink}>About us</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </nav>

        {/* Center-Right: Search Input */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={17} className={styles.searchIcon} />
          <input
            id="desktop-search-input"
            name="q"
            type="search"
            autoComplete="off"
            placeholder="Search for appliances, tools, home..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            aria-label="Search products"
            aria-controls="desktop-product-suggestions"
            aria-expanded={Boolean(searchQuery.trim())}
          />
          <ProductSearchSuggestions
            id="desktop-product-suggestions"
            query={searchQuery}
            products={searchProducts}
            productsLoaded={searchProductsLoaded}
            productsLoadFailed={searchProductsLoadFailed}
            onSelect={handleSuggestionSelect}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Right: Actions */}
        <div className={styles.actions}>
          <Link
            href={currentUser ? '/account' : '/login'}
            className={styles.actionBtn}
            aria-label={currentUser ? `My Account (${currentUser.name})` : 'My Account'}
            title={currentUser ? `Logged in as ${currentUser.name}` : 'My Account'}
            style={{ position: 'relative' }}
          >
            <User size={20} />
            {currentUser && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#18A957',
                  border: '2px solid #ffffff',
                }}
              />
            )}
          </Link>

          <Link
            href="/wishlist"
            className={styles.actionBtn}
            aria-label={`Wishlist with ${wishlistIds.length} ${wishlistIds.length === 1 ? 'item' : 'items'}`}
            title="Wishlist"
          >
            <Heart size={20} />
            {wishlistIds.length > 0 && (
              <span className={styles.badgeCount}>{wishlistIds.length}</span>
            )}
          </Link>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.cartBtn}`}
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label={`Shopping cart with ${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'}`}
            title="Shopping Cart"
          >
            <ShoppingBag size={20} />
            {summary.itemCount > 0 && (
              <span className={styles.badgeCount}>{summary.itemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className={styles.mobileDrawer}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <Search size={17} className={styles.searchIcon} />
            <input
              id="mobile-search-input"
              name="q_mobile"
              type="search"
              autoComplete="off"
              placeholder="Search appliances, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search products"
              aria-controls="mobile-product-suggestions"
              aria-expanded={Boolean(searchQuery.trim())}
            />
            <ProductSearchSuggestions
              id="mobile-product-suggestions"
              query={searchQuery}
              products={searchProducts}
              productsLoaded={searchProductsLoaded}
              productsLoadFailed={searchProductsLoadFailed}
              onSelect={handleSuggestionSelect}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </form>

          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            <Link 
              href="/shop" 
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Shop All Products</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/categories"
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Browse Categories</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/about" 
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>About Sriram &amp; Co</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/contact" 
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Store Branches &amp; Contact</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href={currentUser ? '/account' : '/login'}
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>My Account &amp; Orders</span>
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
