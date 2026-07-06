import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Journey MVP",
  description: "Weston Price archive exploration prototype",
};

const navLinks = [
  { href: "/", label: "Journey Map" },
  { href: "/timeline", label: "Timeline" },
  { href: "/collections", label: "Collections" },
];

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
            <nav className="nav">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="nav__link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
