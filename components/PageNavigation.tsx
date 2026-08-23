"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PageNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const historyRef = useRef<string[]>([pathname]);
  const indexRef = useRef(0);
  const [routes, setRoutes] = useState<string[]>([pathname]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const routes = historyRef.current;
    const currentIndex = routes.indexOf(pathname);

    if (currentIndex !== -1) {
      indexRef.current = currentIndex;
      setIndex(currentIndex);
      return;
    }

    const nextRoutes = routes.slice(0, indexRef.current + 1);
    nextRoutes.push(pathname);
    historyRef.current = nextRoutes;
    setRoutes(nextRoutes);
    indexRef.current = nextRoutes.length - 1;
    setIndex(indexRef.current);
  }, [pathname]);

  const canGoBack = index > 0;
  const canGoForward = index < routes.length - 1;

  return (
    <nav
      aria-label="Page navigation"
      className="pointer-events-none fixed left-3 top-20 z-50 flex gap-2 sm:left-5 sm:top-20 sm:gap-3 md:left-6 md:top-24"
    >
      <button
        type="button"
        onClick={() => router.back()}
        disabled={!canGoBack}
        aria-label="Go to previous page"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl leading-none text-slate-700 shadow-lg backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:h-11 sm:w-11 sm:text-2xl md:h-12 md:w-12"
      >
        ←
      </button>

      <button
        type="button"
        onClick={() => router.forward()}
        disabled={!canGoForward}
        aria-label="Go to next page"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl leading-none text-slate-700 shadow-lg backdrop-blur transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:h-11 sm:w-11 sm:text-2xl md:h-12 md:w-12"
      >
        →
      </button>
    </nav>
  );
}