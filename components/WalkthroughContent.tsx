 "use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Download,
  FileBadge,
  Link as LinkIcon,
  Loader2,
  Play,
  Trash2,
  UploadCloud
} from "lucide-react";

type ProgressStatus = "pending" | "success" | "error";

type ProgressEntry = {
  id: string;
  message: string;
  status?: ProgressStatus;
  timestamp?: string;
};

type OutputLinks = {
  processedResumeUrl?: string;
  tailoredCoverLetterUrl?: string;
};

export default function WalkthroughContent() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [progressLogs, setProgressLogs] = useState<ProgressEntry[]>([]);
  const [outputs, setOutputs] = useState<OutputLinks>({});
  const [applicationUrl, setApplicationUrl] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    },
    []
  );

  const filesReady = useMemo(() => Boolean(resumeFile && jobFile), [resumeFile, jobFile]);

  const handleFileSelect =
    (type: "resume" | "job") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";

      if (!file) {
        return;
      }

      if (file.type !== "application/pdf") {
        const message = "Please upload a PDF file.";
        if (type === "resume") {
          setResumeError(message);
          setResumeFile(null);
        } else {
          setJobError(message);
          setJobFile(null);
        }
        return;
      }

      if (type === "resume") {
        setResumeFile(file);
        setResumeError(null);
      } else {
        setJobFile(file);
        setJobError(null);
      }
    };

  const handleRemoveFile = (type: "resume" | "job") => {
    if (type === "resume") {
      setResumeFile(null);
      setResumeError(null);
    } else {
      setJobFile(null);
      setJobError(null);
    }
  };

  const handleStartApplying = () => {
    if (!filesReady) {
      return;
    }

    setIsApplying(true);
    setProgressLogs([]);
    setOutputs({});
    // TODO: integrate API call to backend auto-applier here.
    // Use setProgressLogs([...]) and setOutputs(...) when backend events arrive.
  };

  const handleResetWorkspace = () => {
    setResumeFile(null);
    setResumeError(null);
    setJobFile(null);
    setJobError(null);
    setIsApplying(false);
    setProgressLogs([]);
    setOutputs({});
    setApplicationUrl("");
    setCopyFeedback("");
  };

  const handleDownload = (url?: string) => {
    if (!url) {
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
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
    if (filesReady) {
      return "Ready to apply. Backend will start once you trigger.";
    }
    return "Upload both PDFs to enable the apply flow.";
  }, [filesReady, isApplying]);

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
        url: outputs.processedResumeUrl
      },
      {
        id: "tailoredCoverLetter",
        label: "Tailored cover letter PDF",
        description: "Generated draft based on job requirements.",
        url: outputs.tailoredCoverLetterUrl
      }
    ],
    [outputs]
  );

  return (
    <article className="document">
      <section className="panel">
        <header className="panel__header">
          <div>
            <h2>Prepare your documents</h2>
            <p className="panel__subtitle">
              Upload a resume PDF and the job description PDF to kick off the auto-applier.
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
            onClear={() => handleRemoveFile("resume")}
          />
          <UploadSlot
            id="job-upload"
            label="Job description PDF"
            description="Posting details that guide the tailoring process."
            file={jobFile}
            error={jobError}
            onSelect={handleFileSelect("job")}
            onClear={() => handleRemoveFile("job")}
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
              {isApplying ? <Loader2 className="spinner" size={16} /> : <Play size={16} />}
              {isApplying ? "Applying…" : "Start applying"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleResetWorkspace}
              disabled={isApplying || (!resumeFile && !jobFile && progressLogs.length === 0)}
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
              Stream backend updates (parsing, tailoring, QA) to keep applicants informed.
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
                    <span className={clsx("status-dot", `status-dot--${status}`)} aria-hidden="true" />
                    <span>{entry.message}</span>
                  </div>
                  {entry.timestamp ? (
                    <span className="progress-entry__timestamp">
                      {formatTimestamp(entry.timestamp)}
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
              <p className="panel__subtitle">Expose download links once processing is complete.</p>
            </div>
          </header>
          <div className="download-list">
            {downloads.map((item) => (
              <div key={item.id} className="download-item">
                <div className="download-item__meta">
                  <span>{item.label}</span>
                  <span className="download-item__status">
                    {item.url ? "Ready to download" : "Pending from backend"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDownload(item.url)}
                  disabled={!item.url}
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel__header">
            <div>
              <h2>Application link</h2>
              <p className="panel__subtitle">
                Paste the final URL returned by the backend so the applicant can submit manually.
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
            {copyFeedback ? <span className="copy-feedback">{copyFeedback}</span> : null}
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
  onClear: () => void;
};

function UploadSlot({ id, label, description, file, error, onSelect, onClear }: UploadSlotProps) {
  return (
    <div className={clsx("upload-slot", file && "upload-slot--ready")}>
      <input id={id} type="file" accept="application/pdf" onChange={onSelect} hidden />
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
            <span className="upload-slot__meta">{formatFileSize(file.size)}</span>
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
    minute: "2-digit"
  });
}

