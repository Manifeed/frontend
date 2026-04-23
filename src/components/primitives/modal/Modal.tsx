"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useId } from "react";

import { cx } from "@/utils/cx";

import { Button } from "../button";
import { Surface } from "../surface";
import styles from "./Modal.module.css";

export type ModalSize = "sm" | "md" | "lg";

type ModalProps = HTMLAttributes<HTMLElement> & {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  ariaLabel?: string;
  bodyClassName?: string;
  footerClassName?: string;
  headerClassName?: string;
  size?: ModalSize;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  ariaLabel,
  bodyClassName,
  children,
  className,
  footerClassName,
  headerClassName,
  size = "md",
  ...rest
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Surface
        as="section"
        className={cx(styles.panel, styles[`size_${size}`], className)}
        tone="default"
        padding="none"
        blur={false}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : ariaLabel}
        {...rest}
      >
        <div className={cx(styles.header, headerClassName)}>
          <div className={styles.headerContent}>
            {title ? (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            ) : null}
          </div>

          <Button
            className={styles.closeButton}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </Button>
        </div>

        <div className={cx(styles.body, bodyClassName)}>{children}</div>

        {footer ? <div className={cx(styles.footer, footerClassName)}>{footer}</div> : null}
      </Surface>
    </div>
  );
}
