"use client";

import { useEffect, useState } from "react";

import {
	Button,
	EmptyState,
	Field,
	HeadFilters,
	HeadPanel,
	Notice,
	PageShell,
	SearchBar,
	SelectInput,
} from "@/components";
import { UserCard } from "@/features/admin/components";
import { listAdminUsers, updateAdminUser } from "@/services/api/admin-users.service";
import type {
	AdminUserApiAccessFilter,
	AdminUserFilters,
	AdminUsersPageRead,
	AdminUserStatusScope,
} from "@/types/admin";

import styles from "./page.module.css";

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 500;

const DEFAULT_FILTERS: AdminUserFilters = {
	search: "",
	status_scope: "active",
	role: "user",
	api_access_enabled: "all",
};

const EMPTY_USERS_PAGE: AdminUsersPageRead = {
	items: [],
	total: 0,
	active_total: 0,
	limit: PAGE_SIZE,
	offset: 0,
};

function formatInteger(value: number): string {
	return new Intl.NumberFormat("fr-FR").format(value);
}

export default function AdminUsersPage() {
	const [usersPage, setUsersPage] = useState<AdminUsersPageRead>(EMPTY_USERS_PAGE);
	const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS);
	const [pageIndex, setPageIndex] = useState(0);
	const [debouncedSearch, setDebouncedSearch] = useState(DEFAULT_FILTERS.search);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearch(filters.search);
		}, SEARCH_DEBOUNCE_MS);

		return () => window.clearTimeout(timeoutId);
	}, [filters.search]);

	async function loadUsers(
		activeFilters: AdminUserFilters,
		activePageIndex: number,
		activeSearch: string,
	) {
		setLoading(true);

		try {
			const payload = await listAdminUsers(activeFilters, activePageIndex, activeSearch);

			if (payload.items.length === 0 && payload.total > 0 && activePageIndex > 0) {
				setPageIndex(activePageIndex - 1);
				return;
			}

			setUsersPage(payload);
			setError(null);
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : "Unable to load users");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadUsers(filters, pageIndex, debouncedSearch);
	}, [debouncedSearch, filters.api_access_enabled, filters.role, filters.status_scope, pageIndex]);

	async function patchUser(
		userId: number,
		payload: Parameters<typeof updateAdminUser>[1],
	) {
		try {
			await updateAdminUser(userId, payload);
			await loadUsers(filters, pageIndex, debouncedSearch);
		} catch (patchError) {
			setError(patchError instanceof Error ? patchError.message : "Unable to update user");
		}
	}

	function updateFilter<K extends keyof AdminUserFilters>(key: K, value: AdminUserFilters[K]) {
		setPageIndex(0);
		setFilters((current) => ({ ...current, [key]: value }));
	}

	const users = usersPage.items;
	const hasPreviousPage = usersPage.offset > 0;
	const hasNextPage = usersPage.offset + users.length < usersPage.total;
	const startIndex = usersPage.total === 0 ? 0 : usersPage.offset + 1;
	const endIndex = usersPage.offset + users.length;
	const pageTitle = loading
		? "Refreshing..."
		: `${formatInteger(usersPage.total)} User${usersPage.total > 1 ? "s" : ""}`;
	const paginationLabel =
		usersPage.total === 0
			? "0 visible"
			: `${formatInteger(startIndex)}-${formatInteger(endIndex)} of ${formatInteger(usersPage.total)}`;

	return (
		<>
		<HeadFilters
			title="User Filters"
			items={[
				{
					label: "User",
					active: filters.role === "user",
					onClick: () => updateFilter("role", "user"),
					disabled: loading,
				},
				{
					label: "Admin",
					active: filters.role === "admin",
					onClick: () => updateFilter("role", "admin"),
					disabled: loading,
				},
			]}
		/>
		<PageShell size="wide" className={styles.main}>
			<HeadPanel>
				<div className={styles.headPanelSummary}>
					<h1 className={styles.pageTitle}>{pageTitle}</h1>
				</div>
				<div className={styles.headPanelSearch}>
					<Field htmlFor="admin-users-search" className={styles.searchField}>
						<SearchBar
							id="admin-users-search"
							value={filters.search}
							onChange={(event) => updateFilter("search", event.target.value)}
							placeholder="Research User or Email..."
							autoComplete="off"
							aria-label="Search by email or pseudo"
							enableShortcut
							shortcutHint="CMD + K"
						/>
					</Field>
				</div>
				<div className={styles.headPanelActions}>
					<Field
						layout="horizontal"
						labelTone="overline"
						label="API access"
						htmlFor="api-access-filter"
					>
						<SelectInput
							id="api-access-filter"
							value={filters.api_access_enabled}
							onChange={(event) =>
								updateFilter(
									"api_access_enabled",
									event.target.value as AdminUserApiAccessFilter,
								)
							}
							disabled={loading}
						>
							<option value="all">All</option>
							<option value="enabled">Enable</option>
							<option value="disabled">Disable</option>
						</SelectInput>
					</Field>
					<Field
						layout="horizontal"
						labelTone="overline"
						label="Activity"
						htmlFor="scope-filter"
					>
						<SelectInput
							id="scope-filter"
							value={filters.status_scope}
							onChange={(event) =>
								updateFilter("status_scope", event.target.value as AdminUserStatusScope)
							}
							disabled={loading}
						>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</SelectInput>
					</Field>
				</div>
			</HeadPanel>

			<section className={styles.stack}>
				{error ? <Notice tone="danger">{error}</Notice> : null}

				{users.length > 50 ? (
					<div className={styles.pagination}>
						<p className={styles.paginationInfo}>{paginationLabel}</p>
						<div className={styles.paginationButtons}>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
								disabled={!hasPreviousPage || loading}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setPageIndex((current) => current + 1)}
								disabled={!hasNextPage || loading}
							>
								Next
							</Button>
						</div>
					</div>
				) : null}

				{!loading && users.length === 0 ? (
					<EmptyState
						title="No users match"
						description="Try another role, API access filter, or a broader search."
					/>
				) : (
					<div className={styles.userGrid}>
						{users.map((user) => (
							<UserCard
								key={user.id}
								title={user.pseudo}
								fields={[
									{ label: "Mail", value: user.email },
									{ label: "Role", value: user.role },
									{ label: "Active", value: user.is_active ? "yes" : "no" },
									{
										label: "API Access",
										value: user.api_access_enabled ? "enabled" : "disabled",
										emphasized: true,
									},
								]}
								primaryAction={{
									label: user.is_active ? "Disable Account" : "Enable Account",
									onClick: () => void patchUser(user.id, { is_active: !user.is_active }),
									disabled: loading,
								}}
								secondaryAction={{
									label: user.api_access_enabled ? "Disable API" : "Enable API",
									onClick: () =>
										void patchUser(user.id, {
											api_access_enabled: !user.api_access_enabled,
										}),
									disabled: loading,
								}}
							/>
						))}
					</div>
				)}
			</section>
		</PageShell>
		</>
	);
}
