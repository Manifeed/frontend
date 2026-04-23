import type { HTMLAttributes } from "react";

import { cx } from "../../../utils/cx";
import styles from "./Badge.module.css";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";
type BadgeStyle = "solid" | "minimal";

type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "style"> & {
  tone?: BadgeTone;
  style?: BadgeStyle;
  uppercase?: boolean;
};

export function Badge({
  tone = "neutral",
  style = "solid",
  uppercase = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        styles.badge,
        styles[`tone_${tone}`],
        styles[`style_${style}`],
        uppercase && styles.uppercase,
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
