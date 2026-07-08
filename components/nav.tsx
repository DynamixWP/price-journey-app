"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Journey Map" },
  { href: "/timeline", label: "Timeline" },
  { href: "/collections", label: "Collections" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav__link${pathname === link.href ? " is-active" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
