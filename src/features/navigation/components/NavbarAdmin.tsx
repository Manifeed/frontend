"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import type { AuthenticatedUser } from "@/types/auth";

import styles from "./Navbar.module.css";
import { AvatarMenu } from "./AvatarMenu";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/rss", label: "RSS" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/users", label: "Users" },
];

function isActiveRoute(pathname: string | null, href: string): boolean {
  if (!pathname)
    return false;
  if (href === "/admin")
    return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavbarAdminProps = {
  user: AuthenticatedUser;
};

export function NavbarAdmin({ user }: NavbarAdminProps) {
  const pathname = usePathname();
  const navId = useId();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/admin" className={styles.brand}>
          Manifeed Admin
        </Link>
        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isMobileMenuOpen}
          aria-controls={navId}
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span className={styles.menuToggleBox} aria-hidden="true">
            <span className={styles.menuToggleLine} />
            <span className={styles.menuToggleLine} />
            <span className={styles.menuToggleLine} />
          </span>
        </button>
        <nav
          id={navId}
          className={
            isMobileMenuOpen
              ? `${styles.links} ${styles.linksCollapsible} ${styles.linksOpen}`
              : `${styles.links} ${styles.linksCollapsible}`
          }
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.userActions}>
          <AvatarMenu user={user} />
        </div>
      </div>
    </header>
  );
}
