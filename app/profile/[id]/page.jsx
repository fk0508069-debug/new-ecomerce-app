"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ChatBot from "@/components/chatBot";

// Helper for dynamic status badge styling
const getStatusStyles = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "processing":
    case "shipped":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "cancelled":
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default: // pending, etc.
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);

  const requestedUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // Redirect if not logged in or if the user ID doesn't match the URL
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.id !== requestedUserId) {
      router.replace("/");
    }
  }, [loading, user, requestedUserId, router]);

  useEffect(() => {
    if (!requestedUserId || !user || user.id !== requestedUserId) return;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError("");

        const response = await fetch(
          `/api/orders?userId=${encodeURIComponent(requestedUserId)}`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch orders");
        }

        const payload = await response.json();
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.orders)
            ? payload.orders
            : [];

        setOrders(list);
      } catch (error) {
        console.error("Failed to load orders:", error);
        setOrders([]);
        setOrdersError("Could not load your orders right now.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [requestedUserId, user]);

  // Show loading state while auth resolves
  if (loading || !user || user.id !== requestedUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading profile...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isAdmin = user.email === "admin@example.com" || user.role === "admin";
  const displayedOrders = showAllOrders ? orders : orders.slice(0, 2);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {/* Profile Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Hi, {user.name || user.email}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/addProduct"
                    className="inline-flex items-center rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                  >
                    + Add Product
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdmin && (
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-amber-600"
                >
                  📊 Store Analytics
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              Welcome to your dashboard. You can manage your account and track your orders from here.
            </p>
          </div>

          {/* Orders Section */}
          <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 shadow-xs">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Your Orders</h2>
                <p className="text-xs text-slate-500">Track and view your recent purchases</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-10">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  Loading orders...
                </div>
              </div>
            ) : ordersError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 py-10 text-center">
                <p className="text-sm font-medium text-slate-700">No orders found</p>
                <p className="mt-1 text-xs text-slate-400">Your recent orders will appear here once placed.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {displayedOrders.map((order, idx) => {
                  const orderKey = order.id || order._id || `order-${idx}`;
                  return (
                    <div
                      key={orderKey}
                      className="group rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                    >
                      {/* Top Row: Tracking & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Tracking ID
                          </span>
                          <p className="text-sm font-semibold text-slate-900">
                            #{order.tracking_number || "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Date not available"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusStyles(
                            order.status
                          )}`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </div>

                      {/* Bottom Row: Items & Total */}
                      <div className="mt-3.5 flex flex-wrap items-end justify-between gap-3">
                        <div className="min-w-[200px] flex-1">
                          <span className="text-xs font-medium text-slate-500">Items:</span>
                          {order.items && order.items.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {order.items.map((item, itemIdx) => (
                                <span
                                  key={`${orderKey}-${itemIdx}`}
                                  className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                >
                                  {item.name || "Product"}
                                  <span className="ml-1 font-semibold text-slate-900">
                                    ×{item.quantity || 1}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">No item details available</p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-medium text-slate-400">Total</span>
                          <p className="text-base font-bold text-slate-900">
                            Rs {Number(order.total || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show More / Show Less Button */}
                {orders.length > 2 && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllOrders((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      {showAllOrders ? "Show Less" : `See More (${orders.length - 2} more)`}
                      <span className="text-xs">{showAllOrders ? "▲" : "▼"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <ChatBot />
    </>
  );
}