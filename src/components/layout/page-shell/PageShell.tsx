import type { ReactNode } from "react";

import { cx } from "../../../utils/cx";
import styles from "./PageShell.module.css";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
};

export function PageShell({ children, className, size = "default" }: PageShellProps) {
  return <main className={cx(styles.shell, styles[`size_${size}`], className)}>{children}</main>;
}
