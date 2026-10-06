'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Heart, User, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const { summary, setIsCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
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
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="Sriram & Co Logo" 
              className={styles.logoImage} 
            />
            <span className={styles.logoText}>
              Sriram <span className={styles.logoAmp}>&amp;</span> Co
            </span>
          </Link>
        </div>

        {/* Center-Left: Desktop Navigation */}
        <nav className={styles.desktopNav}>
          <Link href="/shop" className={styles.navLink}>Shop</Link>
          <Link href="/#categories" className={styles.navLink}>Categories</Link>
          <Link href="/about" className={styles.navLink}>About us</Link>
          <Link href="/contact" className={styles.navLink}>Contact</Link>
        </nav>

        {/* Center-Right: Search Input */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Search size={17} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search for appliances, tools, home..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
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
          <Link href="/login" className={styles.actionBtn} aria-label="My Account" title="My Account">
            <User size={20} />
          </Link>

          <Link href="/shop" className={styles.actionBtn} aria-label="Wishlist" title="Wishlist">
            <Heart size={20} />
            {wishlistIds.length > 0 && (
              <span className={styles.badgeCount}>{wishlistIds.length}</span>
            )}
          </Link>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.cartBtn}`}
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label="Open Shopping Cart"
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
        <div className={styles.mobileDrawer}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <Search size={17} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search appliances, tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
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

          <nav className={styles.mobileNav}>
            <Link 
              href="/shop" 
              className={styles.mobileNavLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Shop All Products</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              href="/#categories" 
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
              href="/login" 
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
