"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ChatBot from "@/components/chatBot";


export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout, loading } = useAuth();

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

  // Mock admin check – you can replace with a real role field from your auth
  const isAdmin = user.email === "admin@example.com" || user.role === "admin";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-500">
                Profile
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                Hi, {user.name || user.email}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/addProduct"
                    className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-200"
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
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                >
                  📊 Store Analytics
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Welcome to your dashboard. You can manage your account from here.
            </p>
          </div>
        </div>
      </main>
      <ChatBot />
    </>
  );
}