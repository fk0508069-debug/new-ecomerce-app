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
            <ul className="divide-y divide-gray-200">
              {cart.map(item => (
                <li key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} × {item.qty}</p>

               <Link
                  href={`/checkout/${item.id}`}
                  className="bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 text-sm" 
                >
                  Proceed to Checkout
                </Link>

                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <i className="fas fa-minus-circle"></i> Remove one
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t pt-4 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xl font-bold">Total: ${totalPrice.toFixed(2)}</span>
              <div className="flex gap-3">
                <button onClick={clearCart} className="border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-100 text-sm">
                  Clear Cart
                </button>
               
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}