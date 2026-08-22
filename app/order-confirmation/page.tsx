"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trackingNumber = searchParams.get("tracking_number");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Order Placed</h1>
        <p className="mt-3 text-slate-600">
          Your order has been successfully placed and saved to the database.
        </p>

    
      

        {trackingNumber && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Tracking number: <span className="font-semibold">{trackingNumber}</span>
          </p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-100 px-4"><div className="text-slate-600">Loading confirmation...</div></main>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
