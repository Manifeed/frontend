"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { cx } from "@/utils/cx";

import styles from "./UserCard.module.css";

export type UserCardAction = {
	label: string;
	onClick: () => void;
	disabled?: boolean;
};

type UserCardField = {
	label: string;
	value: ReactNode;
	emphasized?: boolean;
};

type UserCardProps = {
	title: string;
	fields: UserCardField[];
	primaryAction?: UserCardAction;
	secondaryAction?: UserCardAction;
};

export function UserCard({
	title,
	fields,
	primaryAction,
	secondaryAction,
}: UserCardProps) {
	const hasActions = Boolean(primaryAction ?? secondaryAction);
	const [actionsOpen, setActionsOpen] = useState(false);
	const cardRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!actionsOpen) {
			return;
		}

		function handlePointerDown(event: MouseEvent) {
			if (!cardRef.current?.contains(event.target as Node)) {
				setActionsOpen(false);
			}
		}

		function handleEscape(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setActionsOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [actionsOpen]);

	function handleActionClick(action?: UserCardAction) {
		if (!action || action.disabled) {
			return;
		}

		action.onClick();
		setActionsOpen(false);
	}

	function handleCardClick() {
		if (!hasActions) {
			return;
		}

		setActionsOpen((current) => !current);
	}

	function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
		if (!hasActions) {
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			setActionsOpen((current) => !current);
		}
	}

	return (
		<article
			ref={cardRef}
			className={cx(styles.card, actionsOpen && styles.card_open)}
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			tabIndex={hasActions ? 0 : undefined}
			role={hasActions ? "button" : undefined}
			aria-expanded={hasActions ? actionsOpen : undefined}
		>
			<div className={styles.body}>
				<h3 className={styles.title}>{title}</h3>
				<ul className={styles.meta}>
					{fields.map((field) => (
						<li
							key={field.label}
							className={cx(styles.metaRow, field.emphasized && styles.metaRow_emphasized)}
						>
							<span className={styles.metaLabel}>{field.label}:</span>
							<span className={styles.metaValue}>{field.value}</span>
						</li>
					))}
				</ul>
			</div>

			{hasActions ? (
				<div
					className={cx(styles.overlay, actionsOpen && styles.overlay_open)}
					aria-hidden={!actionsOpen}
					onClick={(event) => event.stopPropagation()}
				>
					{primaryAction ? (
						<button
							type="button"
							className={styles.overlayButton}
							onClick={() => handleActionClick(primaryAction)}
							disabled={primaryAction.disabled}
						>
							{primaryAction.label}
						</button>
					) : null}
					{secondaryAction ? (
						<button
							type="button"
							className={styles.overlayButton}
							onClick={() => handleActionClick(secondaryAction)}
							disabled={secondaryAction.disabled}
						>
							{secondaryAction.label}
						</button>
					) : null}
				</div>
			) : null}
		</article>
	);
}
