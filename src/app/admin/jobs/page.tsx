"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	Badge,
	Button,
	HeadFilters,
	HeadPanel,
	Notice,
	PageShell,
	PopInfo,
	SidePanel,
	Surface,
	Table,
} from "@/components";
import type { PopInfoType } from "@/components";
import {
	createRssScrapeJob,
	createSourceEmbeddingJob,
	getJobsOverview,
	getJobStatus,
	getJobTasks,
} from "@/services/api/jobs.service";
import type {
	JobEnqueueRead,
	JobOverviewItemRead,
	JobsOverviewRead,
	JobStatusRead,
	JobTaskRead,
	WorkerJobKind,
	WorkerJobStatus,
	WorkerTaskStatus,
} from "@/types/jobs";
import { formatSourceDate } from "@/utils/date";

import styles from "./page.module.css";

const REFRESH_INTERVAL_MS = 15_000;
const JOB_OVERVIEW_LIMIT = 100;

type JobKindFilter = WorkerJobKind;

type TaskState<T> = {
	items: T[];
	initialized: boolean;
	loading: boolean;
	error: string | null;
};

type PopInfoState = {
	id: number;
	title: string;
	text: string;
	type: PopInfoType;
};

type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

function createTaskState<T>(): TaskState<T> {
	return {
		items: [],
		initialized: false,
		loading: false,
		error: null,
	};
}

function formatJobEnqueueSummary(result: JobEnqueueRead): string {
	return [
		`job=${result.job_id.slice(0, 8)}`,
		`kind=${result.job_kind}`,
		`status=${result.status}`,
		`tasks=${result.tasks_total}`,
		`items=${result.items_total}`,
	].join(" | ");
}

function formatInteger(value: number | null): string {
	if (value === null) {
		return "n/a";
	}
	return new Intl.NumberFormat("fr-FR").format(value);
}

function jobStatusLabel(status: WorkerJobStatus): string {
	switch (status) {
		case "queued":
			return "Queued";
		case "processing":
			return "Processing";
		case "finalizing":
			return "Finalizing";
		case "completed":
			return "Completed";
		case "completed_with_errors":
			return "Completed";
		case "failed":
			return "Failed";
		default:
			return status;
	}
}

function taskStatusLabel(status: WorkerTaskStatus): string {
	switch (status) {
		case "pending":
			return "Pending";
		case "processing":
			return "Processing";
		case "completed":
			return "Completed";
		case "failed":
			return "Failed";
		default:
			return status;
	}
}

function statusTone(status: WorkerJobStatus): StatusTone {
	switch (status) {
		case "processing":
			return "accent";
		case "finalizing":
			return "warning";
		case "completed":
			return "success";
		case "completed_with_errors":
			return "warning";
		case "failed":
			return "danger";
		default:
			return "neutral";
	}
}

function taskTone(status: WorkerTaskStatus): StatusTone {
	switch (status) {
		case "processing":
			return "accent";
		case "completed":
			return "success";
		case "failed":
			return "danger";
		default:
			return "neutral";
	}
}

export default function AdminJobsPage() {
	const [overview, setOverview] = useState<JobsOverviewRead | null>(null);
	const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
	const [overviewError, setOverviewError] = useState<string | null>(null);

	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const [popInfo, setPopInfo] = useState<PopInfoState | null>(null);
	const selectedJobIdRef = useRef<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatusRead | null>(null);
	const [ingestingSources, setIngestingSources] = useState<boolean>(false);
	const [embeddingSources, setEmbeddingSources] = useState<boolean>(false);
	const [jobStatusError, setJobStatusError] = useState<string | null>(null);
	const [taskPage, setTaskPage] = useState<TaskState<JobTaskRead>>(() => createTaskState<JobTaskRead>());

	const [kindFilter, setKindFilter] = useState<JobKindFilter>("rss_scrape");

	useEffect(() => {
		selectedJobIdRef.current = selectedJobId;
	}, [selectedJobId]);

	const loadOverview = useCallback(async (silent: boolean) => {
		if (!silent)
			setLoadingOverview(true);
		setOverviewError(null);

		try {
			const payload = await getJobsOverview(JOB_OVERVIEW_LIMIT);
			setOverview(payload);
		} catch (loadError) {
			const message =
				loadError instanceof Error ? loadError.message : "Unexpected error while loading jobs";
			setOverviewError(message);
		} finally {
			if (!silent) {
				setLoadingOverview(false);
			}
		}
	}, []);

	const loadJobStatus = useCallback(async (jobId: string) => {
		setJobStatusError(null);

		try {
			const payload = await getJobStatus(jobId);
			if (selectedJobIdRef.current !== jobId)
				return;
			setJobStatus(payload);
		} catch (loadError) {
			if (selectedJobIdRef.current !== jobId)
				return;
			const message =
				loadError instanceof Error ? loadError.message : "Unexpected error while loading job";
			setJobStatusError(message);
			setJobStatus(null);
		}
	}, []);

	const showPopInfo = useCallback((title: string, text: string, type: PopInfoType) => {
		setPopInfo((current) => ({
			id: (current?.id ?? 0) + 1,
			title,
			text,
			type,
		}));
	}, []);

	const closePopInfo = useCallback(() => {
		setPopInfo(null);
	}, []);

	const handleIngestSources = useCallback(async () => {
		setIngestingSources(true);
		try {
			const payload = await createRssScrapeJob();
			showPopInfo(
				"Last ingest result",
				formatJobEnqueueSummary(payload),
				payload.status === "failed" ? "alert" : "info",
			);
			setSelectedJobId(payload.job_id);
			await Promise.all([loadOverview(true), loadJobStatus(payload.job_id)]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unexpected error during ingest";
			showPopInfo("Ingest error", message, "alert");
		} finally {
			setIngestingSources(false);
		}
	}, [loadJobStatus, loadOverview, showPopInfo]);

	const handleEmbedSources = useCallback(async () => {
		setEmbeddingSources(true);
		try {
			const payload = await createSourceEmbeddingJob();
			showPopInfo("Embedding queue result", formatJobEnqueueSummary(payload), "info");
			setSelectedJobId(payload.job_id);
			await Promise.all([loadOverview(true), loadJobStatus(payload.job_id)]);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unexpected error during enqueue";
			showPopInfo("Embedding queue error", message, "alert");
		} finally {
			setEmbeddingSources(false);
		}
	}, [loadJobStatus, loadOverview, showPopInfo]);

	const loadTasks = useCallback(async (jobId: string) => {
		setTaskPage((current) => ({
			...current,
			loading: true,
			error: null,
		}));

		try {
			const items = await getJobTasks(jobId);
			if (selectedJobIdRef.current !== jobId)
				return;
			setTaskPage({
				items,
				initialized: true,
				loading: false,
				error: null,
			});
		} catch (loadError) {
			if (selectedJobIdRef.current !== jobId)
				return;
			const message =
				loadError instanceof Error ? loadError.message : "Unexpected error while loading tasks";
			setTaskPage((current) => ({
				...current,
				loading: false,
				error: message,
			}));
		}
	}, []);

	useEffect(() => {
		void loadOverview(false);
	}, [loadOverview]);

	useEffect(() => {
		const timerId = window.setInterval(() => {
			void loadOverview(true);
		}, REFRESH_INTERVAL_MS);

		return () => {
			window.clearInterval(timerId);
		};
	}, [loadOverview]);

	const jobs = overview?.items ?? [];
	const filteredJobs = useMemo(
		() => jobs.filter((job) => job.job_kind === kindFilter),
		[jobs, kindFilter],
	);

	useEffect(() => {
		if (filteredJobs.length === 0) {
			setSelectedJobId(null);
			setJobStatus(null);
			return;
		}
		if (!selectedJobId || !filteredJobs.some((job) => job.job_id === selectedJobId))
			setSelectedJobId(filteredJobs[0].job_id);
	}, [filteredJobs, selectedJobId]);

	useEffect(() => {
		if (!selectedJobId) {
			setJobStatus(null);
			setTaskPage(createTaskState<JobTaskRead>());
			return;
		}

		setJobStatus(null);
		setJobStatusError(null);
		setTaskPage(createTaskState<JobTaskRead>());
		void loadJobStatus(selectedJobId);
	}, [selectedJobId, loadJobStatus]);

	const selectedJobOverview = useMemo<JobOverviewItemRead | null>(
		() => jobs.find((job) => job.job_id === selectedJobId) ?? null,
		[jobs, selectedJobId],
	);

	const selectedJob = useMemo<JobStatusRead | null>(() => {
		if (jobStatus && jobStatus.job_id === selectedJobId)
			return jobStatus;
		return null;
	}, [jobStatus, selectedJobId]);

	useEffect(() => {
		if (!selectedJobId || !selectedJobOverview)
			return;
		if (!taskPage.initialized && !taskPage.loading)
			void loadTasks(selectedJobId);
	}, [loadTasks, selectedJobId, selectedJobOverview, taskPage.initialized, taskPage.loading]);

	useEffect(() => {
		if (!selectedJobId)
			return;

		const timerId = window.setInterval(() => {
			void loadJobStatus(selectedJobId);
			if (taskPage.initialized)
				void loadTasks(selectedJobId);
		}, REFRESH_INTERVAL_MS);

		return () => {
			window.clearInterval(timerId);
		};
	}, [loadJobStatus, loadTasks, selectedJobId, taskPage.initialized]);

	return (
		<>
		<HeadFilters
			title="Job Filters"
			items={[
				{
					label: "Scraping",
					active: kindFilter === "rss_scrape",
					onClick: () => setKindFilter("rss_scrape"),
				},
				{
					label: "Embedding",
					active: kindFilter === "source_embedding",
					onClick: () => setKindFilter("source_embedding"),
				},
			]}
		/>
		<PageShell size="wide" className={styles.main}>
			<HeadPanel>
				<h2>{formatInteger(jobs.length)} Jobs</h2>
				<div className={styles.headPanelActions}>
					<Button variant="primary" onClick={handleIngestSources} disabled={ingestingSources}>
						{ingestingSources ? "Ingesting..." : "Ingest sources"}
					</Button>
					<Button onClick={handleEmbedSources} disabled={embeddingSources}>
						{embeddingSources ? "Queueing..." : "Embed sources"}
					</Button>
				</div>
			</HeadPanel>
			{popInfo ? (
				<PopInfo
					key={popInfo.id}
					title={popInfo.title}
					text={popInfo.text}
					type={popInfo.type}
					onClose={closePopInfo}
				/>
			) : null}

			{overviewError ? <Notice tone="danger">{overviewError}</Notice> : null}

			<section className={styles.workspace}>
				<SidePanel
					className={styles.listPanel}
					bodyClassName={styles.jobList}
				>
					{loadingOverview && overview === null ? (
						<p className={styles.placeholder}>Loading jobs...</p>
					) : null}
					{!loadingOverview && filteredJobs.length === 0 ? (
						<p className={styles.placeholder}>No jobs for this filter.</p>
					) : null}
					{filteredJobs.map((job) => {
						const isActive = job.job_id === selectedJobId;
						return (
							<button
								key={job.job_id}
								type="button"
								className={isActive ? `${styles.jobCard} ${styles.jobCardActive}` : styles.jobCard}
								onClick={() => setSelectedJobId(job.job_id)}
							>
								<strong className={styles.jobIdentity}>{job.job_id}</strong>
								<Badge tone={statusTone(job.status)} style="minimal">{jobStatusLabel(job.status)}</Badge>
								<p className={styles.jobCardMeta}>
									<strong>Requested:</strong> {formatSourceDate(job.requested_at, "full")}
								</p>
								<p className={styles.jobCardMeta}>
									<strong>Tasks:</strong> {formatInteger(job.task_processed)} / {formatInteger(job.task_total)}
								</p>
								<p className={styles.jobCardMeta}>
									<strong>Items:</strong> {formatInteger(job.item_success)} ok / {formatInteger(job.item_error)} err
								</p>
							</button>
						);
					})}
				</SidePanel>
				{!selectedJobOverview ? (
					<Surface padding="md">
						<p className={styles.placeholder}>Select a job to view its status and tasks.</p>
					</Surface>
				) : (
					<>
						{jobStatusError ? <Notice tone="danger">{jobStatusError}</Notice> : null}
						{!selectedJob ? (
							<Surface padding="md">
								<p className={styles.placeholder}>Loading job status...</p>
							</Surface>
						) : null}
						{selectedJob ? (
							<Table
							className={styles.taskTable}
							minWidth="920px"
							header={
								<>
									<header className={styles.panelHeader}>
										<div className={styles.kpiGrid}>
											<article className={styles.kpiCard}>
												<p className={styles.kpiLabel}>Requested</p>
												<p className={styles.kpiValue}>{formatSourceDate(selectedJob.requested_at, "time")}</p>
											</article>
											<article className={styles.kpiCard}>
												<p className={styles.kpiLabel}>Started</p>
												<p className={styles.kpiValue}>{formatSourceDate(selectedJob.started_at, "time")}</p>
											</article>
											<article className={styles.kpiCard}>
												<p className={styles.kpiLabel}>Finished</p>
												<p className={styles.kpiValue}>{formatSourceDate(selectedJob.finished_at, "time")}</p>
											</article>
											<article className={styles.kpiCard}>
												<p className={styles.kpiLabel}>Worker version</p>
												<p className={styles.kpiValue}>{selectedJob.worker_version}</p>
											</article>
										</div>
									</header>
									{taskPage.error ? <Notice tone="danger">{taskPage.error}</Notice> : null}
								</>
							}
						>
							{!taskPage.initialized && taskPage.loading ? (
								<tbody>
									<tr>
										<td colSpan={9} className={styles.tableMessageCell}>
											<p className={styles.placeholder}>Loading tasks...</p>
										</td>
									</tr>
								</tbody>
							) : null}
							{taskPage.initialized && taskPage.items.length === 0 ? (
								<tbody>
									<tr>
										<td colSpan={9} className={styles.tableMessageCell}>
											<p className={styles.placeholder}>No tasks associated with this job.</p>
										</td>
									</tr>
								</tbody>
							) : null}
							{taskPage.items.length > 0 ? (
								<>
									<thead>
										<tr>
											<th>Task</th>
											<th>Status</th>
											<th>Items</th>
											<th>Success</th>
											<th>Error</th>
											<th>Pending</th>
											<th>Claimed</th>
											<th>Expires</th>
											<th>Completed</th>
										</tr>
									</thead>
									<tbody>
										{taskPage.items.map((task) => {
											const pendingItems = Math.max(
												task.item_total - task.item_success - task.item_error,
												0,
											);
											return (
												<tr key={task.task_id}>
													<td>{task.task_id}</td>
													<td data-sort-value={task.status}>
														<Badge tone={taskTone(task.status)} style="minimal">{taskStatusLabel(task.status)}</Badge>
													</td>
													<td>{formatInteger(task.item_total)}</td>
													<td>{formatInteger(task.item_success)}</td>
													<td>{formatInteger(task.item_error)}</td>
													<td>{formatInteger(pendingItems)}</td>
													<td data-sort-value={task.claimed_at ?? ""}>{formatSourceDate(task.claimed_at, "time")}</td>
													<td data-sort-value={task.claim_expires_at ?? ""}>{formatSourceDate(task.claim_expires_at, "time")}</td>
													<td data-sort-value={task.completed_at ?? ""}>{formatSourceDate(task.completed_at, "time")}</td>
												</tr>
											);
										})}
									</tbody>
								</>
							) : null}
							</Table>
						) : null}
					</>
				)}
			</section>
		</PageShell>
		</>
	);
}
