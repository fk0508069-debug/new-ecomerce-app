"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  subsubcategory: string;
  stock: number;
  images: string[];
  isHero: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductContextType {
  products: Product[];
  heroProducts: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchHeroProducts: () => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<
  ProductContextType | undefined
>(undefined);

export function ProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // FETCH NORMAL PRODUCTS
  // ==========================================================

  const fetchProducts = useCallback(async () => {
    // Already loaded → don't fetch again
    if (products.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/products?limit=8"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch products"
        );
      }

      const data = await response.json();

      setProducts(data.products || []);
    } catch (err) {
      console.error(
        "Product fetch error:",
        err
      );

      setError(
        "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }, [products.length]);

  // ==========================================================
  // FETCH HERO PRODUCTS
  // ==========================================================

  const fetchHeroProducts = useCallback(async () => {
    // Already loaded → don't fetch again
    if (heroProducts.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/products?hero=true&limit=5"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch hero products"
        );
      }

      const data = await response.json();

      setHeroProducts(
        data.products || []
      );
    } catch (err) {
      console.error(
        "Hero product fetch error:",
        err
      );

      setError(
        "Failed to load hero products"
      );
    } finally {
      setLoading(false);
    }
  }, [heroProducts.length]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchProducts();
    fetchHeroProducts();
  }, [
    fetchProducts,
    fetchHeroProducts,
  ]);

  // ==========================================================
  // FORCE REFRESH
  // ==========================================================

  const refreshProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsResponse, heroResponse] =
        await Promise.all([
          fetch("/api/products?limit=8"),
          fetch(
            "/api/products?hero=true&limit=5"
          ),
        ]);

      if (!productsResponse.ok) {
        throw new Error(
          "Failed to refresh products"
        );
      }

      if (!heroResponse.ok) {
        throw new Error(
          "Failed to refresh hero products"
        );
      }

      const productsData =
        await productsResponse.json();

      const heroData =
        await heroResponse.json();

      setProducts(
        productsData.products || []
      );

      setHeroProducts(
        heroData.products || []
      );
    } catch (err) {
      console.error(
        "Refresh products error:",
        err
      );

      setError(
        "Failed to refresh products"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        heroProducts,
        loading,
        error,
        fetchProducts,
        fetchHeroProducts,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

// ==========================================================
// CUSTOM HOOK
// ==========================================================

export function useProducts() {
  const context =
    useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductProvider"
    );
  }

  return context;
}