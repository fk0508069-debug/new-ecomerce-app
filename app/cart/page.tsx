"use client";

import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, clearCart, totalItems, totalPrice } = useCart();

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Your cart is empty.</p>
            <Link href="/" className="text-amber-500 hover:underline mt-4 inline-block">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={item.id} className="py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Image & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-lg truncate">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        Rs{item.price.toFixed(2)} × {item.qty}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Subtotal: Rs {(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-3 py-1 border border-red-200 rounded-full hover:bg-red-50 transition"
                    >
                      <i className="fas fa-minus-circle"></i> Remove one
                    </button>

                    {/* Per‑product Checkout Link */}
                    <Link
                      href={`/checkout/${item.id}`}
                      className="bg-amber-500 text-white px-5 py-2 rounded-full hover:bg-amber-600 text-sm font-medium transition shadow-sm flex items-center gap-2"
                    >
                      <i className="fas fa-bolt"></i> Checkout
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className="mt-8 border-t pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xl font-bold">
                  Total: Rs {totalPrice.toFixed(2)}
                </span>
                <p className="text-sm text-gray-500">{totalItems} items</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={clearCart}
                  className="border border-gray-300 px-5 py-2 rounded-full hover:bg-gray-100 text-sm transition"
                >
                  Clear Cart
                </button>

                {/* Checkout All */}
                <Link
                  href="/checkout"
                  className="bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 text-sm font-medium transition shadow-sm flex items-center gap-2"
                >
                  <i className="fas fa-shopping-cart"></i> Checkout All
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}