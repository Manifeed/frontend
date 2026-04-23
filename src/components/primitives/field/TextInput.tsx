import type { InputHTMLAttributes } from "react";

import { cx } from "../../../utils/cx";
import styles from "./TextInput.module.css";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  appearance?: "outlined" | "subtle";
};

export function TextInput({ className, appearance = "outlined", ...rest }: TextInputProps) {
  return (
    <input
      className={cx(styles.textInput, styles[`textInput_${appearance}`], className)}
      {...rest}
    />
  );
}
