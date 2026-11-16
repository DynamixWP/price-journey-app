"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const navLinks = [
  { href: "/", label: "Journey" },
  { href: "/concept", label: "Atlas" },
  { href: "/timeline", label: "Chronology" },
  { href: "/collections", label: "Archive" },
];

export function Nav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const rootTheme = document.documentElement.dataset.theme;
    if (rootTheme === "dark" || rootTheme === "light") {
      setTheme(rootTheme);
      return;
    }
    setTheme("light");
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("price-journey-theme", nextTheme);
    setTheme(nextTheme);
  };

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
      <button
        type="button"
        className="nav__theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? (
          <svg className="nav__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 4V2m0 20v-2m8-8h2M2 12h2m12.95 6.95 1.41 1.41M3.64 3.64 5.05 5.05m13.9 0 1.41-1.41M3.64 20.36l1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg className="nav__theme-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M20.2 14.38A8.5 8.5 0 1 1 9.62 3.8a7 7 0 1 0 10.58 10.58Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </nav>
  );
}
