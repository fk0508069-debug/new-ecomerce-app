"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'qty'>) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart when user changes
  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }
    const key = `cart_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [user]);

  // Save cart whenever it changes and user is logged in
  useEffect(() => {
    if (!user) return;
    const key = `cart_${user.id}`;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (item: Omit<CartItem, 'qty'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (!existing) return prev;
      if (existing.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};