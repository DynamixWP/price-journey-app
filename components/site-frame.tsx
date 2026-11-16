"use client";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const immersive = usePathname() === "/";
  if (immersive) return <main>{children}</main>;
  return <><header className="topbar"><div className="topbar__inner"><div><p className="eyebrow">Case files · 1931—1937</p><h1 className="brand">The Expedition Atlas</h1></div><Nav /></div></header><main className="main">{children}</main></>;
}
