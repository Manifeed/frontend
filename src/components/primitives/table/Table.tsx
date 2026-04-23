"use client";

import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  TableHTMLAttributes,
} from "react";

import { cx } from "../../../utils/cx";
import { Surface } from "../surface";
import styles from "./Table.module.css";

type TableElement = "section" | "article" | "div";

type TableProps = HTMLAttributes<HTMLElement> & {
  as?: TableElement;
  header?: ReactNode;
  headerClassName?: string;
  minWidth?: CSSProperties["minWidth"];
  scrollClassName?: string;
  scrollProps?: HTMLAttributes<HTMLDivElement>;
  sortable?: boolean;
  tableClassName?: string;
  tableProps?: TableHTMLAttributes<HTMLTableElement>;
};

type SortDirection = "ascending" | "descending";

type SortState = {
  columnIndex: number;
  direction: SortDirection;
};

type ComparableKind = "empty" | "number" | "boolean" | "status" | "text";

type ComparableValue = {
  kind: ComparableKind;
  text: string;
  value: number | string;
};

type ElementProps = {
  children?: ReactNode;
  className?: string;
  colSpan?: number | string;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
  tabIndex?: number;
  [key: string]: unknown;
};

const STATUS_ORDER: Record<string, number> = {
  pending: 10,
  queued: 20,
  processing: 30,
  finalizing: 40,
  completed: 50,
  "completed with errors": 60,
  completed_with_errors: 60,
  failed: 70,
};

const EMPTY_VALUES = new Set(["", "n/a", "na", "null", "undefined", "-"]);

const collator = new Intl.Collator("fr", {
  numeric: true,
  sensitivity: "base",
});

function getElementProps(element: ReactElement): ElementProps {
  return element.props as ElementProps;
}

function isElementOfType(node: ReactNode, type: string): node is ReactElement<ElementProps> {
  return isValidElement(node) && node.type === type;
}

function getColSpan(node: ReactNode): number {
  if (!isValidElement(node))
    return 1;

  const rawColSpan = getElementProps(node).colSpan;
  if (typeof rawColSpan === "number")
    return Math.max(1, rawColSpan);
  if (typeof rawColSpan === "string") {
    const parsedColSpan = Number.parseInt(rawColSpan, 10);
    return Number.isNaN(parsedColSpan) ? 1 : Math.max(1, parsedColSpan);
  }

  return 1;
}

function stringifySortValue(value: unknown): string {
  if (typeof value === "string")
    return value;
  if (typeof value === "number" || typeof value === "bigint")
    return String(value);
  if (typeof value === "boolean")
    return value ? "true" : "false";
  return "";
}

function extractNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint")
    return String(node);
  if (Array.isArray(node))
    return node.map(extractNodeText).filter(Boolean).join(" ");
  if (!isValidElement(node))
    return "";

  const props = getElementProps(node);
  const explicitSortValue = props["data-sort-value"] ?? props.dataSortValue;
  if (explicitSortValue !== undefined)
    return stringifySortValue(explicitSortValue);

  for (const key of ["aria-checked", "checked", "enabled", "selected"]) {
    if (typeof props[key] === "boolean")
      return props[key] ? "true" : "false";
  }

  const childText = extractNodeText(props.children);
  if (childText.length > 0)
    return childText;

  if (typeof props.value === "string" || typeof props.value === "number")
    return String(props.value);
  if (typeof props.title === "string")
    return props.title;
  if (typeof props["aria-label"] === "string")
    return props["aria-label"] as string;

  return "";
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseFrenchDate(value: string): number | null {
  const match = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match)
    return null;

  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function parseTime(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match)
    return null;

  const [, hour, minute, second = "0"] = match;
  return Number(hour) * 3600 + Number(minute) * 60 + Number(second);
}

function inferComparableValue(node: ReactNode): ComparableValue {
  const text = normalizeText(extractNodeText(node));
  const lowerText = text.toLowerCase();

  if (EMPTY_VALUES.has(lowerText))
    return { kind: "empty", text, value: "" };

  if (["true", "enabled", "yes", "on"].includes(lowerText))
    return { kind: "boolean", text, value: 1 };
  if (["false", "disabled", "no", "off"].includes(lowerText))
    return { kind: "boolean", text, value: 0 };

  const statusValue = STATUS_ORDER[lowerText];
  if (statusValue !== undefined)
    return { kind: "status", text, value: statusValue };

  const timeValue = parseTime(text);
  if (timeValue !== null)
    return { kind: "number", text, value: timeValue };

  const frenchDateValue = parseFrenchDate(text);
  if (frenchDateValue !== null)
    return { kind: "number", text, value: frenchDateValue };

  const compactNumber = text.replace(/[\s\u00a0]/g, "").replace(",", ".");
  if (/^[+-]?\d+(?:\.\d+)?$/.test(compactNumber))
    return { kind: "number", text, value: Number(compactNumber) };

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const timestamp = Date.parse(text);
    if (!Number.isNaN(timestamp))
      return { kind: "number", text, value: timestamp };
  }

  return { kind: "text", text, value: lowerText };
}

function compareValues(left: ComparableValue, right: ComparableValue): number {
  if (left.kind === "empty" && right.kind === "empty")
    return 0;
  if (left.kind === "empty")
    return 1;
  if (right.kind === "empty")
    return -1;

  if (
    typeof left.value === "number" &&
    typeof right.value === "number" &&
    (left.kind === right.kind || left.kind !== "text" || right.kind !== "text")
  ) {
    return left.value - right.value;
  }

  return collator.compare(left.text, right.text);
}

function getCellAtColumn(row: ReactElement<ElementProps>, columnIndex: number): ReactNode | null {
  let currentColumnIndex = 0;
  const cells = Children.toArray(getElementProps(row).children);

  for (const cell of cells) {
    if (!isElementOfType(cell, "td") && !isElementOfType(cell, "th"))
      continue;

    const nextColumnIndex = currentColumnIndex + getColSpan(cell);
    if (columnIndex >= currentColumnIndex && columnIndex < nextColumnIndex)
      return cell;
    currentColumnIndex = nextColumnIndex;
  }

  return null;
}

function sortBodyRows(children: ReactNode, sortState: SortState): ReactNode {
  const rows = Children.toArray(children);
  if (!rows.every((row) => isElementOfType(row, "tr")))
    return children;

  return rows
    .map((row, index) => ({
      index,
      row,
      value: inferComparableValue(getCellAtColumn(row, sortState.columnIndex)),
    }))
    .sort((left, right) => {
      if (left.value.kind === "empty" && right.value.kind !== "empty")
        return 1;
      if (right.value.kind === "empty" && left.value.kind !== "empty")
        return -1;

      const baseComparison = compareValues(left.value, right.value);
      if (baseComparison === 0)
        return left.index - right.index;
      return sortState.direction === "ascending" ? baseComparison : -baseComparison;
    })
    .map(({ row }) => row);
}

function enhanceHeaderCell(
  cell: ReactElement<ElementProps>,
  columnIndex: number,
  sortState: SortState | null,
  onToggleSort: (columnIndex: number) => void,
): ReactElement {
  const props = getElementProps(cell);
  const isActiveColumn = sortState?.columnIndex === columnIndex;
  const ariaSort = isActiveColumn ? sortState.direction : "none";

  return cloneElement(cell, {
    "aria-sort": ariaSort,
    className: cx(
      props.className,
      styles.sortableHeader,
      isActiveColumn && sortState.direction === "ascending" && styles.sortAscending,
      isActiveColumn && sortState.direction === "descending" && styles.sortDescending,
    ),
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      props.onClick?.(event);
      if (!event.defaultPrevented)
        onToggleSort(columnIndex);
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented)
        return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onToggleSort(columnIndex);
      }
    },
    tabIndex: props.tabIndex ?? 0,
  });
}

function enhanceHeaderRows(
  children: ReactNode,
  sortState: SortState | null,
  onToggleSort: (columnIndex: number) => void,
): ReactNode {
  return Children.map(children, (row) => {
    if (!isElementOfType(row, "tr"))
      return row;

    let columnIndex = 0;
    const rowProps = getElementProps(row);
    const cells = Children.map(rowProps.children, (cell) => {
      if (!isElementOfType(cell, "th")) {
        columnIndex += getColSpan(cell);
        return cell;
      }

      const headerColumnIndex = columnIndex;
      columnIndex += getColSpan(cell);
      return enhanceHeaderCell(cell, headerColumnIndex, sortState, onToggleSort);
    });

    return cloneElement(row, undefined, cells);
  });
}

function enhanceTableChildren(
  children: ReactNode,
  sortState: SortState | null,
  onToggleSort: (columnIndex: number) => void,
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child))
      return child;

    const props = getElementProps(child);

    if (child.type === Fragment) {
      return cloneElement(child, undefined, enhanceTableChildren(props.children, sortState, onToggleSort));
    }

    if (isElementOfType(child, "thead")) {
      return cloneElement(
        child,
        undefined,
        enhanceHeaderRows(props.children, sortState, onToggleSort),
      );
    }

    if (isElementOfType(child, "tbody") && sortState) {
      return cloneElement(child, undefined, sortBodyRows(props.children, sortState));
    }

    return child;
  });
}

export function Table({
  as = "section",
  children,
  className,
  header,
  headerClassName,
  minWidth,
  scrollClassName,
  scrollProps,
  sortable = true,
  tableClassName,
  tableProps,
  ...rest
}: TableProps) {
  const [sortState, setSortState] = useState<SortState | null>(null);
  const { className: scrollPropsClassName, ...restScrollProps } = scrollProps ?? {};
  const {
    className: tablePropsClassName,
    style: tablePropsStyle,
    ...restTableProps
  } = tableProps ?? {};

  const toggleSort = useCallback((columnIndex: number) => {
    setSortState((currentSortState) => {
      if (currentSortState?.columnIndex !== columnIndex)
        return { columnIndex, direction: "ascending" };
      if (currentSortState.direction === "ascending")
        return { columnIndex, direction: "descending" };
      return null;
    });
  }, []);

  const renderedChildren = useMemo(
    () => sortable ? enhanceTableChildren(children, sortState, toggleSort) : children,
    [children, sortable, sortState, toggleSort],
  );

  return (
    <Surface
      as={as}
      padding="none"
      className={cx(
        styles.tablePanel,
        !header && styles.headerless,
        className,
      )}
      {...rest}
    >
      {header ? <div className={cx(styles.header, headerClassName)}>{header}</div> : null}
      <div className={cx(styles.scroll, scrollClassName, scrollPropsClassName)} {...restScrollProps}>
        <table
          className={cx(styles.table, tableClassName, tablePropsClassName)}
          style={{ minWidth, ...tablePropsStyle }}
          {...restTableProps}
        >
          {renderedChildren}
        </table>
      </div>
    </Surface>
  );
}
