import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Script from "next/script";
import { SiteFrame } from "@/components/site-frame";
import "./globals.css";

export const metadata: Metadata = { title: "Weston A. Price — A Journey in Photographs", description: "Explore photographs, places and field notes in an interactive digital archive." };
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const serif = Cormorant_Garamond({ variable: "--font-serif", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-US" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning><body>
    <Script id="theme-init" strategy="beforeInteractive">{`try { var storedTheme = localStorage.getItem("price-journey-theme"); var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; document.documentElement.dataset.theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : systemTheme; } catch (error) {}`}</Script>
    <SiteFrame>{children}</SiteFrame>
  </body></html>;
}
