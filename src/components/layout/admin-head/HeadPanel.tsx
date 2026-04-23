"use client";

import { useRef, type PropsWithChildren } from "react";

import { useAdminHeadHeight } from "./useAdminHeadHeight";
import styles from "./HeadPanel.module.css";

export function HeadPanel({ children }: PropsWithChildren) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useAdminHeadHeight(containerRef, "--admin-head-panel-height");

  return (
    <div ref={containerRef} className={styles.root}>
      <div className={styles.inner}>
          {children}
      </div>
    </div>
  );
}
