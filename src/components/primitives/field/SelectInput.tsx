"use client";

import {
  Children,
  isValidElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

import { cx } from "../../../utils/cx";
import styles from "./SelectInput.module.css";

type SelectInputProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "multiple" | "size"> & {
  children: ReactNode;
};

type SelectOption = {
  label: string;
  value: string;
};

function collectOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode; value?: unknown }>(child) || child.type !== "option")
      return [];

    const optionValue = child.props.value;

    return [
      {
        value: Array.isArray(optionValue) ? optionValue.join(",") : String(optionValue ?? ""),
        label: Children.toArray(child.props.children).join(""),
      },
    ];
  });
}

export function SelectInput({
  children,
  className,
  defaultValue,
  onBlur,
  onChange,
  onKeyDown,
  onMouseDown,
  value,
  ...rest
}: SelectInputProps) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const options = useMemo(() => collectOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));
  const [isOpen, setIsOpen] = useState(false);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);
  const selectedValue = isControlled ? String(value ?? "") : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue) ?? options[0] ?? null;

  useLayoutEffect(() => {
    if (!labelRef.current)
      return;

    setLabelWidth(labelRef.current.getBoundingClientRect().width);
  }, [selectedOption?.label]);

  function handleMouseDown(event: MouseEvent<HTMLSelectElement>) {
    setIsOpen(true);
    onMouseDown?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSelectElement>) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp")
      setIsOpen(true);

    onKeyDown?.(event);
  }

  return (
    <div
      className={cx(styles.selectRoot, className)}
      data-open={isOpen ? "true" : "false"}
      style={
        labelWidth === null
          ? undefined
          : ({
              "--select-label-width": `${labelWidth}px`,
            } as CSSProperties)
      }
    >
      <select
        className={styles.selectInput}
        value={selectedValue}
        {...rest}
        onBlur={(event) => {
          setIsOpen(false);
          onBlur?.(event);
        }}
        onChange={(event) => {
          if (!isControlled) {
            setInternalValue(event.target.value);
          }

          setIsOpen(false);
          onChange?.(event);
        }}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
      >
        {children}
      </select>
      <span ref={labelRef} className={styles.selectSizer} aria-hidden="true">
        {selectedOption?.label ?? ""}
      </span>
      <span className={styles.selectIndicator} aria-hidden="true">
        <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <path
            d="M2.25 4.5L6 8.25L9.75 4.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </span>
    </div>
  );
}
