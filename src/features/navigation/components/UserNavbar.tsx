"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./UserNavbar.module.css";

type UserNavItem = {
  href: string;
  label: string;
};

function isActiveRoute(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type UserNavbarProps = {
  items: UserNavItem[];
};

export function UserNavbar({ items }: UserNavbarProps) {
  const pathname = usePathname();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <p className={styles.brand}>Manifeed Workspace</p>
        <nav className={styles.links} aria-label="User navigation">
          {items.map((item) => {
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
