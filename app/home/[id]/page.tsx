"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrendingProducts from "@/components/TrendingProducts";
import ChatBot from "@/components/chatBot";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950">
        {/* Hero */}
        <HeroSection />

        {/* Quick Action Buttons (like MovieBox submenu) */}
        <div className="container mx-auto -mt-6 px-4 relative z-20">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-700"
            >
              🔥 Trending Now
            </Link>
          
           
            
          </div>
        </div>

        {/* Trending Now Section */}
        <section className="container mx-auto px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">🔥 Trending Now</h2>
            <Link
              href="/search"
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              View All →
            </Link>
          </div>
          <TrendingProducts />
        </section>

        {/* ChatBot */}
        <ChatBot />
      </main>
    </>
  );
}