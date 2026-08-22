import type { Metadata } from "next";
import Providers from './providers';
import "./globals.css";



export const metadata: Metadata = {
  title: "NOVA STORE",
  description: "THIS STORE IS FOR AMAZNIG THINGS WHICH CAN NOT BUYED IN THE WORLD",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
