import type { Metadata } from "next";
import Providers from "./providers";
import { ProductProvider } from "../context/productContext";
import PageNavigation from "../components/PageNavigation";

import "./globals.css";

export const metadata: Metadata = {
  title: "NOVA STORE",
  description:
    "THIS STORE IS FOR AMAZING THINGS WHICH YOU CANNOT BUY EVERYWHERE",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ProductProvider>
            {children}
            <PageNavigation />
          </ProductProvider>
        </Providers>
      </body>
    </html>
  );
}