"use client";

import React, { useState } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductSearch  from "../components/ProductSearch";
interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push("/login");
    router.refresh();
  };
  // router.refresh()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href={`/home/${user?.id}`}className="flex items-center gap-2 transition hover:opacity-90">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg text-white shadow-sm">
            🛍️
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Nova<span className="text-amber-500">Store</span>
          </span>
        </Link>

        {/* Desktop Search Bar */}
       
<div className="hidden max-w-md flex-1 md:block">
  <ProductSearch />
</div>
        {/* Desktop Navigation & Actions */}
        <div className="hidden items-center gap-5 md:flex">
          {user?.role === "admin" && (
            <Link
              href="https://chat-system-app-bice.vercel.app/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-amber-600"
            >
              Messages
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 hover:text-amber-600"
            aria-label="Shopping Cart"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
              <Link
                href={`/profile/${user.id}`}
                className="text-sm font-semibold text-gray-700 transition hover:text-amber-600"
              >
                {user.name || "Account"}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 transition hover:text-amber-600"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Actions & Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            className="relative p-2 text-gray-700 transition hover:text-amber-600"
            aria-label="Shopping Cart"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="space-y-4 border-t border-gray-100 bg-white px-4 pb-6 pt-4 md:hidden">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
           <ProductSearch />

          <div className="flex flex-col gap-2 pt-2">
            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span>My Profile</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-amber-500 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-amber-600"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}