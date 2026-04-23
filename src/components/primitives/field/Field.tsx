import type { ReactNode } from "react";

import { cx } from "../../../utils/cx";
import styles from "./Field.module.css";

type FieldProps = {
  label?: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
  layout?: "vertical" | "horizontal";
  labelTone?: "prominent" | "regular" | "overline";
};

export function Field({
  label,
  htmlFor,
  children,
  className,
  layout = "vertical",
  labelTone = layout === "horizontal" ? "regular" : "prominent",
}: FieldProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx(
        styles[`field_${layout}`],
        styles[`labelTone_${labelTone}`],
        className,
      )}
    >
      {label ? <span className={styles.label}>{label}</span> : null}
      {children}
    </label>
  );
}
