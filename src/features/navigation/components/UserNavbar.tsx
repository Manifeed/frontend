"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./UserNavbar.module.css";

const NAV_ITEMS = [
  { href: "/app", label: "Overview" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/workers", label: "Workers" },
  { href: "/app/api-keys", label: "API Keys" },
];

function isActiveRoute(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UserNavbar() {
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <p className={styles.brand}>Manifeed Workspace</p>
        <nav className={styles.links} aria-label="User navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
