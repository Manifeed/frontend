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
	cancelJob,
	createRssScrapeJob,
	deleteJob,
	createSourceEmbeddingJob,
	getJobsOverview,
	getJobStatus,
	getJobTasks,
	pauseJob,
	resumeJob,
} from "@/services/api/jobs.service";
import type {
	JobControlCommandRead,
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

type JobControlAction = "pause" | "resume" | "cancel" | "delete";
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

function formatJobControlSummary(result: JobStatusRead | JobControlCommandRead): string {
	const base = [`job=${result.job_id.slice(0, 8)}`];
	if ("status" in result && result.status) {
		base.push(`status=${result.status}`);
	}
	if ("deleted" in result && result.deleted) {
		base.push("deleted=true");
	}
	return base.join(" | ");
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
		case "paused":
			return "Paused";
		case "finalizing":
			return "Finalizing";
		case "cancelled":
			return "Cancelled";
		case "completed":
			return "Completed";
		case "completed_with_errors":
			return "Completed with errors";
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
		case "cancelled":
			return "Cancelled";
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
		case "paused":
			return "warning";
		case "finalizing":
			return "warning";
		case "cancelled":
			return "danger";
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
		case "cancelled":
			return "warning";
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
	const [activeJobControl, setActiveJobControl] = useState<JobControlAction | null>(null);
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

	const handleJobControl = useCallback(
		async (action: JobControlAction) => {
			if (!selectedJob)
				return;

			const { job_id: jobId } = selectedJob;
			if (action === "cancel") {
				const confirmed = window.confirm(
					`Cancel job ${jobId}? Pending and processing tasks will be stopped.`,
				);
				if (!confirmed)
					return;
			}
			if (action === "delete") {
				const confirmed = window.confirm(
					`Delete job ${jobId} permanently? This also removes its tasks.`,
				);
				if (!confirmed)
					return;
			}

			setActiveJobControl(action);
			try {
				if (action === "pause") {
					const payload = await pauseJob(jobId);
					setJobStatus(payload);
					await Promise.all([loadOverview(true), loadTasks(jobId)]);
					showPopInfo("Job paused", formatJobControlSummary(payload), "info");
					return;
				}
				if (action === "resume") {
					const payload = await resumeJob(jobId);
					setJobStatus(payload);
					await Promise.all([loadOverview(true), loadTasks(jobId)]);
					showPopInfo("Job resumed", formatJobControlSummary(payload), "info");
					return;
				}
				if (action === "cancel") {
					const payload = await cancelJob(jobId);
					setJobStatus(payload);
					await Promise.all([loadOverview(true), loadTasks(jobId)]);
					showPopInfo("Job cancelled", formatJobControlSummary(payload), "alert");
					return;
				}

				const payload = await deleteJob(jobId);
				setSelectedJobId(null);
				setJobStatus(null);
				setTaskPage(createTaskState<JobTaskRead>());
				await loadOverview(true);
				showPopInfo("Job deleted", formatJobControlSummary(payload), "alert");
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unexpected error while controlling job";
				showPopInfo("Job control error", message, "alert");
			} finally {
				setActiveJobControl(null);
			}
		},
		[loadOverview, loadTasks, selectedJob, showPopInfo],
	);

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

	const canPauseSelectedJob = selectedJob?.status === "queued" || selectedJob?.status === "processing";
	const canResumeSelectedJob = selectedJob?.status === "paused";
	const canCancelSelectedJob =
		selectedJob?.status === "queued" ||
		selectedJob?.status === "processing" ||
		selectedJob?.status === "paused" ||
		selectedJob?.status === "finalizing";
	const isControllingJob = activeJobControl !== null;

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
										<div className={styles.jobDetailHeader}>
											<div className={styles.jobDetailMeta}>
												<div className={styles.jobDetailTitleRow}>
													<h3 className={styles.jobDetailTitle}>{selectedJob.job_id}</h3>
													<Badge tone={statusTone(selectedJob.status)} style="minimal">
														{jobStatusLabel(selectedJob.status)}
													</Badge>
												</div>
												<p className={styles.jobDetailSummary}>
													{selectedJob.job_kind} · {formatInteger(selectedJob.task_processed)} / {formatInteger(selectedJob.task_total)} tasks · {formatInteger(selectedJob.item_success)} ok / {formatInteger(selectedJob.item_error)} err
												</p>
											</div>
											<div className={styles.jobControlActions}>
												<Button
													size="sm"
													onClick={() => void handleJobControl("pause")}
													disabled={!canPauseSelectedJob || isControllingJob}
												>
													{activeJobControl === "pause" ? "Pausing..." : "Pause"}
												</Button>
												<Button
													size="sm"
													onClick={() => void handleJobControl("resume")}
													disabled={!canResumeSelectedJob || isControllingJob}
												>
													{activeJobControl === "resume" ? "Resuming..." : "Resume"}
												</Button>
												<Button
													size="sm"
													onClick={() => void handleJobControl("cancel")}
													disabled={!canCancelSelectedJob || isControllingJob}
												>
													{activeJobControl === "cancel" ? "Cancelling..." : "Cancel"}
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => void handleJobControl("delete")}
													disabled={isControllingJob}
												>
													{activeJobControl === "delete" ? "Deleting..." : "Delete"}
												</Button>
											</div>
										</div>
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
