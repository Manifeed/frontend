import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "../../../utils/cx";
import { Surface } from "../surface";
import styles from "./SidePanel.module.css";

type SidePanelPadding = "none" | "sm" | "md" | "lg";
type SidePanelElement = "aside" | "section" | "div";

type SidePanelProps = HTMLAttributes<HTMLElement> & {
  as?: SidePanelElement;
  bodyClassName?: string;
  bodyProps?: HTMLAttributes<HTMLDivElement>;
  header?: ReactNode;
  headerClassName?: string;
  padding?: SidePanelPadding;
};

export function SidePanel({
  as = "aside",
  bodyClassName,
  bodyProps,
  children,
  className,
  header,
  headerClassName,
  padding = "md",
  ...rest
}: SidePanelProps) {
  const { className: bodyPropsClassName, ...restBodyProps } = bodyProps ?? {};

  return (
    <Surface
      as={as}
      padding="none"
      className={cx(
        styles.panel,
        styles[`padding_${padding}`],
        !header && styles.headerless,
        className,
      )}
      {...rest}
    >
      {header ? <div className={cx(styles.header, headerClassName)}>{header}</div> : null}
      <div className={cx(styles.body, bodyClassName, bodyPropsClassName)} {...restBodyProps}>
        {children}
      </div>
    </Surface>
  );
}
