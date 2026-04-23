"use client";

import { useRef } from "react";

import { cx } from "../../../utils/cx";
import { useAdminHeadHeight } from "./useAdminHeadHeight";
import styles from "./HeadFilters.module.css";

export type HeadFilterItem = {
	label: string;
	active: boolean;
	onClick: () => void;
	disabled?: boolean;
};


type HeadFiltersProps = {
	title?: string;
	items: HeadFilterItem[];
};

export function HeadFilters({
	title,
	items,
}: HeadFiltersProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useAdminHeadHeight(containerRef, "--admin-head-filters-height");

	return (
		<div
			ref={containerRef}
			className={styles.root}
		>
			<nav
				className={styles.content}
				aria-label={title ?? "Filters"}
			>
				{items.map((item) => (
					<button
						key={item.label}
						type="button"
						className={cx(styles.tabItem, item.active && styles.tabItem_active)}
						onClick={item.onClick}
						disabled={item.disabled}
						aria-pressed={item.active}
					>
						<span className={styles.tabLabel}>{item.label}</span>
					</button>
				))}
			</nav>
		</div>
	);
}
