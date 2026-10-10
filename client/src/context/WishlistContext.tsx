'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const GUEST_WISHLIST_KEY = 'sriram_wishlist_guest';

function normalizeWishlistIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))];
}

function getWishlistStorageKey(): string {
  const storedUser = localStorage.getItem('src_user');
  if (!storedUser) return GUEST_WISHLIST_KEY;

  try {
    const user: unknown = JSON.parse(storedUser);
    if (typeof user === 'object' && user !== null && 'id' in user && typeof user.id === 'string' && user.id) {
      return `sriram_wishlist_${user.id}`;
    }
  } catch (error) {
    console.error('Could not read the signed-in user for wishlist storage.', error);
  }

  return GUEST_WISHLIST_KEY;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [storageKey, setStorageKey] = useState(GUEST_WISHLIST_KEY);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadWishlist = () => {
      try {
        const key = getWishlistStorageKey();
        const saved = localStorage.getItem(key);
        setStorageKey(key);
        setWishlistIds(saved ? normalizeWishlistIds(JSON.parse(saved)) : []);
        setIsInitialized(true);
      } catch (error) {
        console.error('Could not load the saved wishlist.', error);
      }
    };

    loadWishlist();
    window.addEventListener('auth-change', loadWishlist);
    window.addEventListener('storage', loadWishlist);

    return () => {
      window.removeEventListener('auth-change', loadWishlist);
      window.removeEventListener('storage', loadWishlist);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlistIds));
    } catch (error) {
      console.error('Could not save the wishlist.', error);
    }
  }, [wishlistIds, storageKey, isInitialized]);

  const toggleWishlist = (productId: string) => {
    setWishlistIds(prev => {
      const uniqueIds = normalizeWishlistIds(prev);
      return uniqueIds.includes(productId)
        ? uniqueIds.filter(id => id !== productId)
        : [...uniqueIds, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
