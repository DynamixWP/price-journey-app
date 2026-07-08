import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Journey MVP",
  description: "Weston Price archive exploration prototype",
};

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <header className="topbar">
          <div className="topbar__inner">
            <div>
              <p className="eyebrow">Weston Price Online Archive</p>
              <h1 className="brand">Price Journey MVP</h1>
            </div>
            <Nav />
          </div>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
