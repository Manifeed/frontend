"use client";

import type { InputHTMLAttributes } from "react";
import { useEffect, useRef } from "react";

import { cx } from "../../../utils/cx";
import styles from "./SearchBar.module.css";

type SearchBarProps = InputHTMLAttributes<HTMLInputElement> & {
  shortcutHint?: string;
  enableShortcut?: boolean;
  shortcutKey?: string;
};

export function SearchBar({
  className,
  shortcutHint,
  enableShortcut = false,
  shortcutKey = "k",
  disabled,
  readOnly,
  ...rest
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!enableShortcut)
      return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        if (
          target.isContentEditable
          || tagName === "INPUT"
          || tagName === "TEXTAREA"
          || tagName === "SELECT"
        )
          return;
      }

      const isShortcutPressed = (event.metaKey || event.ctrlKey)
        && event.key.toLowerCase() === shortcutKey.toLowerCase();
      if (!isShortcutPressed || disabled || readOnly)
        return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, enableShortcut, readOnly, shortcutKey]);

  return (
    <div className={cx(styles.searchBar, className)}>
      <span className={styles.searchIcon} aria-hidden="true">
        <svg viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <path
            d="M25.3505 25.3504C30.6225 20.0783 30.6739 11.582 25.4651 6.37321C20.2564 1.16446 11.76 1.21579 6.48792 6.48787C1.21584 11.7599 1.1645 20.2563 6.37325 25.4651C11.582 30.6738 20.0784 30.6225 25.3505 25.3504ZM25.3505 25.3504L39.7219 39.7219"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        className={styles.searchInput}
        disabled={disabled}
        readOnly={readOnly}
        {...rest}
      />
      {shortcutHint ? (
        <span className={styles.shortcutHint} aria-hidden="true">
          {shortcutHint}
        </span>
      ) : null}
    </div>
  );
}
