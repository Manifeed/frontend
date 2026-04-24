"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	Button,
	Field,
	HeadPanel,
	Notice,
	PageShell,
	SelectInput,
	SourceCard,
	SourceModal,
	Surface,
} from "@/components";
import { getAdminSourceById, listAdminSources } from "@/services/api/admin-sources.service";
import { listRssFeeds } from "@/services/api/rss.service";
import type { AdminRssFeed } from "@/types/rss";
import type {
	AdminSourceDetail,
	AdminSourcePageRead,
	SourceAuthor,
} from "@/types/sources";
import { safeImageSrc } from "@/utils/public-url";

import styles from "./page.module.css";

const PAGE_SIZE = 50;
const TILE_MIN_WIDTH_PX = 270;

type CompanyOption = {
	id: number;
	name: string;
};

type SourceItem = AdminSourcePageRead["items"][number];

type BufferedSourceItem = {
	source: SourceItem;
	index: number;
};

function getFeedLabel(feed: AdminRssFeed): string {
	const companyName = feed.company?.name ?? "Unknown company";
	const section = feed.section ? ` / ${feed.section}` : "";
	return `#${feed.id} - ${companyName}${section}`;
}

function hasBannerImage(imageUrl: string | null): boolean {
	return safeImageSrc(imageUrl) !== null;
}

export default function AdminSourcesPage() {
	const [sourcesPage, setSourcesPage] = useState<AdminSourcePageRead>({
		items: [],
		total: 0,
		limit: PAGE_SIZE,
		offset: 0,
	});
	const [feeds, setFeeds] = useState<AdminRssFeed[]>([]);
	const [loadingSources, setLoadingSources] = useState<boolean>(true);
	const [loadingFilters, setLoadingFilters] = useState<boolean>(true);
	const [sourcesError, setSourcesError] = useState<string | null>(null);
	const [filtersError, setFiltersError] = useState<string | null>(null);
	const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
	const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
	const [selectedAuthor, setSelectedAuthor] = useState<SourceAuthor | null>(null);

	const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
	const [selectedSourceDetail, setSelectedSourceDetail] = useState<AdminSourceDetail | null>(null);
	const [loadingSourceDetail, setLoadingSourceDetail] = useState<boolean>(false);
	const [sourceDetailError, setSourceDetailError] = useState<string | null>(null);
	const [gridColumns, setGridColumns] = useState<number>(1);
	const tileGridRef = useRef<HTMLDivElement | null>(null);

	const loadFilters = useCallback(async () => {
		setLoadingFilters(true);
		setFiltersError(null);

		try {
			const payload = await listRssFeeds();
			setFeeds(payload);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unexpected error while loading filters";
			setFiltersError(message);
		} finally {
			setLoadingFilters(false);
		}
	}, []);

	const loadSources = useCallback(
		async (offset: number) => {
			setLoadingSources(true);
			setSourcesError(null);

			try {
				const payload = await listAdminSources({
					limit: PAGE_SIZE,
					offset,
					feedId: selectedFeedId,
					companyId: selectedCompanyId,
					authorId: selectedAuthor?.id ?? null,
				});
				setSourcesPage(payload);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unexpected error while loading sources";
				setSourcesError(message);
			} finally {
				setLoadingSources(false);
			}
		},
		[selectedAuthor?.id, selectedCompanyId, selectedFeedId],
	);

	useEffect(() => {
		void loadFilters();
	}, [loadFilters]);

	useEffect(() => {
		void loadSources(0);
	}, [loadSources]);

	useEffect(() => {
		if (selectedSourceId === null)
			return;

		let isCancelled = false;
		setLoadingSourceDetail(true);
		setSourceDetailError(null);
		setSelectedSourceDetail(null);

		void getAdminSourceById(selectedSourceId)
			.then((payload) => {
				if (isCancelled)
					return;
				setSelectedSourceDetail(payload);
			})
			.catch((error: unknown) => {
				if (isCancelled)
					return;
				const message =
					error instanceof Error ? error.message : "Unexpected error while loading source detail";
				setSourceDetailError(message);
			})
			.finally(() => {
				if (!isCancelled) {
					setLoadingSourceDetail(false);
				}
			});

		return () => { isCancelled = true; };
	}, [selectedSourceId]);

	const closeSourceDetail = useCallback(() => {
		setSelectedSourceId(null);
		setSelectedSourceDetail(null);
		setSourceDetailError(null);
		setLoadingSourceDetail(false);
	}, []);

	useEffect(() => {
		if (selectedSourceId === null)
			return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape")
				closeSourceDetail();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [closeSourceDetail, selectedSourceId]);

	useEffect(() => {
		if (selectedSourceId === null)
			return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [selectedSourceId]);

	const handleRefresh = useCallback(async () => {
		await Promise.all([loadFilters(), loadSources(sourcesPage.offset)]);
	}, [loadFilters, loadSources, sourcesPage.offset]);

	const companyOptions = useMemo<CompanyOption[]>(() => {
		const byId = new Map<number, string>();
		for (const feed of feeds) {
			if (feed.company !== null)
				byId.set(feed.company.id, feed.company.name);
		}

		return Array.from(byId.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((left, right) => left.name.localeCompare(right.name));
	}, [feeds]);

	const feedOptions = useMemo(() => {
		const uniqueById = new Map<number, AdminRssFeed>();
		for (const feed of feeds)
			uniqueById.set(feed.id, feed);

		return Array.from(uniqueById.values()).sort((left, right) => left.id - right.id);
	}, [feeds]);

	const orderedSourceRows = useMemo<SourceItem[][]>(() => {
		const withBannerBuffer: BufferedSourceItem[] = [];
		const withoutBannerBuffer: BufferedSourceItem[] = [];
		const rows: SourceItem[][] = [];
		const canFlushWithBanner = () => withBannerBuffer.length >= gridColumns;
		const canFlushWithoutBanner = () => withoutBannerBuffer.length >= gridColumns;
		const flushRow = (buffer: BufferedSourceItem[]) => {
			rows.push(buffer.splice(0, gridColumns).map((item) => item.source));
		};
		const flushRemainingBuffer = (buffer: BufferedSourceItem[]) => {
			while (buffer.length > 0) {
				flushRow(buffer);
			}
		};

		const flushFullRows = () => {
			while (canFlushWithBanner() || canFlushWithoutBanner()) {
				if (canFlushWithBanner() && canFlushWithoutBanner()) {
					const withBannerFirstIndex = withBannerBuffer[0]?.index ?? Number.MAX_SAFE_INTEGER;
					const withoutBannerFirstIndex = withoutBannerBuffer[0]?.index ?? Number.MAX_SAFE_INTEGER;
					if (withBannerFirstIndex <= withoutBannerFirstIndex) {
						flushRow(withBannerBuffer);
						continue;
					}
					flushRow(withoutBannerBuffer);
					continue;
				}

				if (canFlushWithBanner()) {
					flushRow(withBannerBuffer);
					continue;
				}

				flushRow(withoutBannerBuffer);
			}
		};

		sourcesPage.items.forEach((source, index) => {
			const bufferedSource: BufferedSourceItem = { source, index };
			if (hasBannerImage(source.image_url))
				withBannerBuffer.push(bufferedSource);
			else
				withoutBannerBuffer.push(bufferedSource);
			flushFullRows();
		});

		if (withBannerBuffer.length > 0 && withoutBannerBuffer.length > 0) {
			const withBannerFirstIndex = withBannerBuffer[0]?.index ?? Number.MAX_SAFE_INTEGER;
			const withoutBannerFirstIndex = withoutBannerBuffer[0]?.index ?? Number.MAX_SAFE_INTEGER;
			if (withBannerFirstIndex <= withoutBannerFirstIndex) {
				flushRemainingBuffer(withBannerBuffer);
				flushRemainingBuffer(withoutBannerBuffer);
			} else {
				flushRemainingBuffer(withoutBannerBuffer);
				flushRemainingBuffer(withBannerBuffer);
			}
		} else {
			flushRemainingBuffer(withBannerBuffer);
			flushRemainingBuffer(withoutBannerBuffer);
		}

		return rows;
	}, [gridColumns, sourcesPage.items]);

	useEffect(() => {
		const tileGrid = tileGridRef.current;
		if (!tileGrid)
			return;

		const updateGridColumns = () => {
			const computedStyles = window.getComputedStyle(tileGrid);
			const gapRaw = computedStyles.columnGap || computedStyles.gap || "0";
			const columnGap = Number.parseFloat(gapRaw) || 0;
			const availableWidth = tileGrid.clientWidth;
			const computedColumns = Math.max(
				1,
				Math.floor((availableWidth + columnGap) / (TILE_MIN_WIDTH_PX + columnGap)),
			);

			setGridColumns((current) => (current === computedColumns ? current : computedColumns));
		};

		updateGridColumns();
		const resizeObserver = new ResizeObserver(updateGridColumns);
		resizeObserver.observe(tileGrid);

		return () => resizeObserver.disconnect();
	}, [loadingSources, sourcesPage.items.length]);

	const hasPreviousPage = sourcesPage.offset > 0;
	const hasNextPage = sourcesPage.offset + sourcesPage.items.length < sourcesPage.total;
	const startIndex = sourcesPage.total === 0 ? 0 : sourcesPage.offset + 1;
	const endIndex = sourcesPage.offset + sourcesPage.items.length;

	const handlePreviousPage = useCallback(() => {
		if (!hasPreviousPage || loadingSources)
			return;

		const nextOffset = Math.max(0, sourcesPage.offset - PAGE_SIZE);
		void loadSources(nextOffset);
	}, [hasPreviousPage, loadSources, loadingSources, sourcesPage.offset]);

	const handleNextPage = useCallback(() => {
		if (!hasNextPage || loadingSources)
			return;

		const nextOffset = sourcesPage.offset + PAGE_SIZE;
		void loadSources(nextOffset);
	}, [hasNextPage, loadSources, loadingSources, sourcesPage.offset]);

	const handleFeedFilterChange = useCallback((nextRawValue: string) => {
		if (!nextRawValue) {
			setSelectedFeedId(null);
			return;
		}

		const nextFeedId = Number(nextRawValue);
		if (Number.isNaN(nextFeedId)) {
			setSelectedFeedId(null);
			return;
		}

		setSelectedFeedId(nextFeedId);
		setSelectedCompanyId(null);
	}, []);

	const handleCompanyFilterChange = useCallback((nextRawValue: string) => {
		if (!nextRawValue) {
			setSelectedCompanyId(null);
			return;
		}

		const nextCompanyId = Number(nextRawValue);
		if (Number.isNaN(nextCompanyId)) {
			setSelectedCompanyId(null);
			return;
		}

		setSelectedCompanyId(nextCompanyId);
		setSelectedFeedId(null);
	}, []);

	const handleTileClick = useCallback((sourceId: number) => {
		setSelectedSourceId(sourceId);
	}, []);

	const handleAuthorFilterSelect = useCallback(
		(author: SourceAuthor) => {
			setSelectedAuthor(author);
			closeSourceDetail();
		},
		[closeSourceDetail],
	);

	const clearAuthorFilter = useCallback(() => {
		setSelectedAuthor(null);
	}, []);

	return (
		<PageShell className={styles.main}>
			<HeadPanel>
				<h2 className={styles.pageTitle}>
					{sourcesPage.total} source{sourcesPage.total !== 1 ? "s" : ""}
				</h2>
				<Button onClick={handleRefresh} disabled={loadingSources}>
					{loadingSources ? "Refreshing..." : "Refresh"}
				</Button>
			</HeadPanel>

			{filtersError ? <Notice tone="danger">Filter load error: {filtersError}</Notice> : null}
			{sourcesError ? <Notice tone="danger">Source load error: {sourcesError}</Notice> : null}

			<Surface className={styles.gridPanel}>
				<div className={styles.toolbar}>
					<div className={styles.filters}>
						<Field layout="horizontal" label="Feed" htmlFor="source-feed-filter">
							<SelectInput
								id="source-feed-filter"
								value={selectedFeedId ?? ""}
								onChange={(event) => handleFeedFilterChange(event.target.value)}
								disabled={loadingFilters}
							>
								<option value="">All feeds</option>
								{feedOptions.map((feed) => (
									<option key={feed.id} value={feed.id}>
										{getFeedLabel(feed)}
									</option>
								))}
							</SelectInput>
						</Field>

						<Field layout="horizontal" label="Company" htmlFor="source-company-filter">
							<SelectInput
								id="source-company-filter"
								value={selectedCompanyId ?? ""}
								onChange={(event) => handleCompanyFilterChange(event.target.value)}
								disabled={loadingFilters}
							>
								<option value="">All companies</option>
								{companyOptions.map((company) => (
									<option key={company.id} value={company.id}>
										{company.name}
									</option>
								))}
							</SelectInput>
						</Field>

						{selectedAuthor ? (
							<Button variant="ghost" size="sm" onClick={clearAuthorFilter}>
								Author: {selectedAuthor.name} ×
							</Button>
						) : null}
					</div>

					<div className={styles.pagination}>
						<span className={styles.pageInfo}>
							{startIndex}-{endIndex}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={handlePreviousPage}
							disabled={!hasPreviousPage || loadingSources}
						>
							Previous
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleNextPage}
							disabled={!hasNextPage || loadingSources}
						>
							Next
						</Button>
					</div>
				</div>

				{loadingSources ? (
					<Notice className={styles.emptyText}>Loading sources...</Notice>
				) : sourcesPage.items.length === 0 ? (
					<Notice className={styles.emptyText}>No source available for this filter.</Notice>
				) : (
					<div ref={tileGridRef} className={styles.tileRows}>
						{orderedSourceRows.map((row, rowIndex) => (
							<div
								key={`source-row-${rowIndex}`}
								className={styles.tileRow}
								style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
							>
								{row.map((source) => (
									<SourceCard
										key={source.id}
										sourceId={source.id}
										title={source.title}
										imageUrl={source.image_url}
										companyNames={source.company_names}
										authors={source.authors}
										publishedAt={source.published_at}
										onClick={handleTileClick}
									/>
								))}
							</div>
						))}
					</div>
				)}
			</Surface>

			{selectedSourceId !== null ? (
				<SourceModal
					sourceDetail={selectedSourceDetail}
					loading={loadingSourceDetail}
					error={sourceDetailError}
					onClose={closeSourceDetail}
					onAuthorSelect={handleAuthorFilterSelect}
				/>
			) : null}
		</PageShell>
	);
}
