"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import {
  Download,
  FileBadge,
  Link as LinkIcon,
  Loader2,
  Play,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  downloadResultPdf,
  fetchSdeJobs,
  getLatestResults,
  getProgressFeed,
  resetAgentSession,
  triggerNextJob,
  uploadResumeBundle,
  type ResultsPayload,
} from "@/lib/api";

type ProgressStatus = "pending" | "success" | "error";

type ProgressEntry = {
  id: string;
  message: string;
  status?: ProgressStatus;
  timestamp?: string;
  stage?: string;
  source?: "backend" | "local";
};

const MAX_PROGRESS_ENTRIES = 5;

const resolveStatus = (stage: string | undefined): ProgressStatus => {
  if (!stage) {
    return "pending";
  }

  const normalized = stage.toLowerCase();
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "error";
  }
  if (
    normalized.includes("complete") ||
    normalized.includes("package") ||
    normalized.includes("done")
  ) {
    return "success";
  }
  return "pending";
};

export default function WalkthroughContent() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [progressLogs, setProgressLogs] = useState<ProgressEntry[]>([]);
  const [latestResult, setLatestResult] = useState<ResultsPayload | null>(null);
  const [applicationUrl, setApplicationUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushProgressEntry = useCallback((entry: ProgressEntry) => {
    setProgressLogs((current) => {
      const filtered = current.filter((existing) => existing.id !== entry.id);
      return [entry, ...filtered].slice(0, MAX_PROGRESS_ENTRIES);
    });
  }, []);

  useEffect(
    () => () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      if (progressPollRef.current) {
        clearInterval(progressPollRef.current);
      }
      if (resultsPollRef.current) {
        clearInterval(resultsPollRef.current);
      }
    },
    []
  );

  const filesReady = useMemo(
    () => Boolean(resumeFile && projectFile),
    [resumeFile, projectFile]
  );

  const processFile = (type: "resume" | "projects", file: File | null) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      const message = "Please upload a PDF file.";
      if (type === "resume") {
        setResumeError(message);
        setResumeFile(null);
      } else {
        setProjectError(message);
        setProjectFile(null);
      }
      return;
    }

    if (type === "resume") {
      setResumeFile(file);
      setResumeError(null);
    } else {
      setProjectFile(file);
      setProjectError(null);
    }
  };

  const handleFileSelect =
    (type: "resume" | "projects") => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";
      processFile(type, file);
    };

  const handleFileDrop =
    (type: "resume" | "projects") => (file: File | null) => {
      processFile(type, file);
    };

  const stopPolling = () => {
    if (progressPollRef.current) {
      clearInterval(progressPollRef.current);
      progressPollRef.current = null;
    }
    if (resultsPollRef.current) {
      clearInterval(resultsPollRef.current);
      resultsPollRef.current = null;
    }
  };

  const startPolling = () => {
    if (!progressPollRef.current) {
      progressPollRef.current = setInterval(async () => {
        try {
          const data = await getProgressFeed();
          setProgressLogs((current) => {
            const backendEntries = data
              .map((entry, index) => ({
                id: `${entry.timestamp ?? "unknown"}-${entry.stage ?? index}`,
                message: entry.message,
                status: resolveStatus(entry.stage),
                timestamp: entry.timestamp,
                stage: entry.stage,
                source: "backend" as const,
              }))
              .sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA;
              });

            const localEntries = current.filter(
              (entry) => entry.source === "local"
            );
            const combined = [...backendEntries, ...localEntries];
            const deduped: ProgressEntry[] = [];
            for (const entry of combined) {
              if (!deduped.some((existing) => existing.id === entry.id)) {
                deduped.push(entry);
              }
              if (deduped.length >= MAX_PROGRESS_ENTRIES) {
                break;
              }
            }
            return deduped;
          });
        } catch (error) {
          console.error("Failed to fetch progress", error);
        }
      }, 2000);
    }

    if (!resultsPollRef.current) {
      resultsPollRef.current = setInterval(async () => {
        try {
          const latest = await getLatestResults();
          if (latest) {
            setLatestResult(latest);
            setApplicationUrl(latest.applyUrl ?? "");
            setIsApplying(false);
            stopPolling();
          }
        } catch (error) {
          console.error("Failed to fetch results", error);
        }
      }, 2500);
    }
  };

  const handleRemoveFile = (type: "resume" | "projects") => {
    if (type === "resume") {
      setResumeFile(null);
      setResumeError(null);
    } else {
      setProjectFile(null);
      setProjectError(null);
    }
  };

  const startJobRun = async () => {
    if (!resumeFile || !projectFile) {
      setApplyError(
        "Upload both resume and related projects PDFs before applying."
      );
      return;
    }

    setApplyError(null);
    stopPolling();

    setIsApplying(true);
    setLatestResult(null);
    setApplicationUrl("");
    setProgressLogs([]);
    pushProgressEntry({
      id: `start-${Date.now()}`,
      message: "Submitting documents to auto-applier…",
      status: "pending",
      timestamp: new Date().toISOString(),
      stage: "apply_start",
      source: "local",
    });

    try {
      await resetAgentSession({
        clearJobs: false,
        clearResume: false,
        reloadJobs: false,
      });

      await uploadResumeBundle({ resume: resumeFile, projects: projectFile });
      const { runId } = await triggerNextJob();
      setLastRunId(runId);
      pushProgressEntry({
        id: `run-${runId}`,
        message: `Agent run ${runId.slice(0, 8)} started.`,
        status: "pending",
        timestamp: new Date().toISOString(),
        stage: "run_started",
        source: "local",
      });
      startPolling();
    } catch (error) {
      console.error(error);
      setApplyError(
        error instanceof Error ? error.message : "Failed to start applying"
      );
      setIsApplying(false);
    }
  };

  const handleStartApplying = async () => {
    if (!filesReady) {
      setApplyError(
        "Upload both resume and related projects PDFs before applying."
      );
      return;
    }

    await startJobRun();
  };

  const handleResetWorkspace = () => {
    stopPolling();
    setResumeFile(null);
    setResumeError(null);
    setProjectFile(null);
    setProjectError(null);
    setIsApplying(false);
    setProgressLogs([]);
    setLatestResult(null);
    setApplicationUrl("");
    setCopyFeedback("");
    setApplyError(null);
    setLastRunId(null);
    resetAgentSession({
      clearJobs: false,
      clearResume: true,
      reloadJobs: false,
    }).catch((error) => {
      console.error("Failed to reset state", error);
    });
  };

  const handleDownloadResult = async (kind: "resume" | "cover-letter") => {
    if (!latestResult) {
      return;
    }
    try {
      const blob = await downloadResultPdf(latestResult.jobId, kind);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${
        kind === "resume" ? "processed-resume" : "tailored-cover-letter"
      }-${latestResult.jobId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${kind}`, error);
      setApplyError(
        error instanceof Error ? error.message : `Failed to download ${kind}`
      );
    }
  };

  const handleCopyLink = async () => {
    if (!applicationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopyFeedback("Link copied to clipboard.");

      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopyFeedback("");
      }, 2000);
    } catch {
      setCopyFeedback("Unable to copy link. Please copy manually.");
    }
  };

  const progressStatusLabel = useMemo(() => {
    if (isApplying) {
      return "Application in progress. Streaming updates from backend.";
    }
    if (latestResult) {
      return "Application package ready. Review downloads before submitting.";
    }
    if (filesReady) {
      return "Ready to apply. Backend will start once you trigger.";
    }
    return "Upload both PDFs to enable the apply flow.";
  }, [filesReady, isApplying, latestResult]);

  const progressEmptyLabel = useMemo(() => {
    if (isApplying) {
      return "Waiting for backend progress updates…";
    }
    return "No progress yet. Start an application to see updates here.";
  }, [isApplying]);

  const downloads = useMemo(
    () => [
      {
        id: "processedResume",
        label: "Processed resume PDF",
        description: "Cleaned with tailored bullet points.",
        kind: "resume" as const,
      },
      {
        id: "tailoredCoverLetter",
        label: "Tailored cover letter PDF",
        description: "Generated draft based on job requirements.",
        kind: "cover-letter" as const,
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJobFetch = async () => {
    try {
      const jobs = await fetchSdeJobs();
      pushProgressEntry({
        id: `jobs-${Date.now()}`,
        message: `Fetched ${jobs.jobs.length} jobs from the agent service.`,
        status: "success",
        timestamp: new Date().toISOString(),
        stage: "jobs_fetch",
        source: "local",
      });
    } catch (error) {
      pushProgressEntry({
        id: `jobs-error-${Date.now()}`,
        message:
          error instanceof Error
            ? `Failed to fetch jobs: ${error.message}`
            : "Failed to fetch jobs.",
        status: "error",
        timestamp: new Date().toISOString(),
        stage: "jobs_fetch_error",
        source: "local",
      });
    }
  };

  const handleNextJob = async () => {
    await startJobRun();
  };

  return (
    <article className="document">
      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Prepare your documents</h2>
            <p className="panel__subtitle">
              Upload a resume PDF and the related projects PDF to kick off the
              auto-applier.
            </p>
          </div>
        </header>
        <div className={clsx("upload-grid", "upload-grid--two")}>
          <UploadSlot
            id="resume-upload"
            label="Resume PDF"
            description="Primary resume used to match job requirements."
            file={resumeFile}
            error={resumeError}
            onSelect={handleFileSelect("resume")}
            onDrop={handleFileDrop("resume")}
            onClear={() => handleRemoveFile("resume")}
          />
          <UploadSlot
            id="projects-upload"
            label="Related projects PDF"
            description="Supporting material the AI can reference for tailoring."
            file={projectFile}
            error={projectError}
            onSelect={handleFileSelect("projects")}
            onDrop={handleFileDrop("projects")}
            onClear={() => handleRemoveFile("projects")}
          />
        </div>
      </section>

      <section className="panel panel--compact">
        <div className="apply-controls">
          <div className="apply-controls__status">{progressStatusLabel}</div>
          <div className="button-row">
            <button
              type="button"
              className="pill-button"
              disabled={!filesReady || isApplying}
              onClick={handleStartApplying}
            >
              {isApplying ? (
                <Loader2 className="spinner" size={16} />
              ) : (
                <Play size={16} />
              )}
              {isApplying ? "Applying…" : "Start applying"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleJobFetch}
            >
              Refresh job cache
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleResetWorkspace}
              disabled={
                isApplying ||
                (!resumeFile && !projectFile && progressLogs.length === 0)
              }
            >
              Clear workspace
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Progress feed</h2>
            <p className="panel__subtitle">
              Stream backend updates (parsing, tailoring, QA) to keep applicants
              informed.
            </p>
          </div>
        </header>
        <div className="progress-feed">
          {progressLogs.length === 0 ? (
            <p className="progress-feed__empty">{progressEmptyLabel}</p>
          ) : (
            progressLogs.map((entry) => {
              const status = entry.status ?? "pending";
              return (
                <div key={entry.id} className="progress-entry">
                  <div className="progress-entry__headline">
                    <span
                      className={clsx("status-dot", `status-dot--${status}`)}
                      aria-hidden="true"
                    />
                    <span>{entry.message}</span>
                  </div>
                  {entry.timestamp ? (
                    <span className="progress-entry__timestamp">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  ) : null}
                  {entry.stage ? (
                    <span className="progress-entry__stage">
                      Stage: {entry.stage}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="document__grid document__grid--two">
        <section className="panel">
          <header className="panel__header">
            <div>
              <h2>Download PDFs</h2>
              <p className="panel__subtitle">
                Expose download links once processing is complete.
              </p>
            </div>
          </header>
          <div className="download-list">
            {downloads.map((item) => (
              <div key={item.id} className="download-item">
                <div className="download-item__meta">
                  <span>{item.label}</span>
                  <span className="download-item__status">
                    {latestResult
                      ? "Ready to download"
                      : "Pending from backend"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDownloadResult(item.kind)}
                  disabled={!latestResult}
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}
            <button
              type="button"
              className="pill-button"
              disabled={isApplying || !filesReady || !latestResult}
              onClick={handleNextJob}
            >
              Start next job
            </button>
          </div>
        </section>

        <section className="panel">
          <header className="panel__header">
            <div>
              <h2>Application link</h2>
              <p className="panel__subtitle">
                Paste the final URL returned by the backend so the applicant can
                submit manually.
              </p>
            </div>
          </header>
          <div className="url-input-group">
            <div>
              <label htmlFor="application-url" className="panel__subtitle">
                Application URL
              </label>
              <input
                id="application-url"
                type="url"
                placeholder="https://company.jobs/apply/..."
                value={applicationUrl}
                onChange={(event) => setApplicationUrl(event.target.value)}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleCopyLink}
              disabled={!applicationUrl}
            >
              <LinkIcon size={16} />
              Copy link
            </button>
            {copyFeedback ? (
              <span className="copy-feedback">{copyFeedback}</span>
            ) : null}
          </div>
        </section>
      </section>
    </article>
  );
}

type UploadSlotProps = {
  id: string;
  label: string;
  description: string;
  file: File | null;
  error: string | null;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (file: File | null) => void;
  onClear: () => void;
};

function UploadSlot({
  id,
  label,
  description,
  file,
  error,
  onSelect,
  onDrop,
  onClear,
}: UploadSlotProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDropEvent = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    onDrop(droppedFile);
    event.dataTransfer.clearData();
  };

  return (
    <div
      className={clsx(
        "upload-slot",
        file && "upload-slot--ready",
        isDragging && "upload-slot--dragging"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
    >
      <input
        id={id}
        type="file"
        accept="application/pdf"
        onChange={onSelect}
        hidden
      />
      <label htmlFor={id}>
        <div className="upload-slot__prompt">
          <UploadCloud size={24} />
          <div className="upload-slot__info">
            <span>{label}</span>
            <span className="upload-slot__meta">{description}</span>
          </div>
        </div>
        <p className="upload-slot__hint">Drop your PDF or click to browse</p>
      </label>

      {file ? (
        <div
          className="upload-slot__file"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <FileBadge size={24} />
          <div className="upload-slot__info">
            <span>{file.name}</span>
            <span className="upload-slot__meta">
              {formatFileSize(file.size)}
            </span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClear();
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : null}

      {error ? <p className="upload-slot__error">{error}</p> : null}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes) {
    return "0 KB";
  }

  const kiloBytes = bytes / 1024;
  if (kiloBytes < 1024) {
    return `${kiloBytes.toFixed(1)} KB`;
  }

  const megaBytes = kiloBytes / 1024;
  return `${megaBytes.toFixed(2)} MB`;
}

function formatTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
