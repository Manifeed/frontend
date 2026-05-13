"use client";

import { useState } from "react";

import styles from "./CopyableCommand.module.css";

type CopyableCommandProps = {
  command: string;
};

export function CopyableCommand({ command }: CopyableCommandProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable (insecure context). Fail silently.
    }
  }

  return (
    <div className={styles.box} data-copied={copied || undefined}>
      <code className={styles.command}>{command}</code>
      <button
        type="button"
        className={styles.copy}
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : "Copy command"}
        title={copied ? "Copied" : "Copy"}
      >
        <CopyIcon copied={copied} />
        <span className={styles.copyLabel}>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {copied ? (
        <path d="M5 13l4 4 10-12" />
      ) : (
        <>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </>
      )}
    </svg>
  );
}
