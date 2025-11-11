const AGENT_BASE_URL = "http://localhost:7070";

export type JobsResponse = {
  jobs: Array<{
    jobId: string;
    company: string;
    title: string;
    location?: string;
    description?: string;
    applyUrl?: string;
  }>;
};

export type ProgressPayload = {
  message: string;
  stage: string;
  timestamp: string;
  jobId?: string;
};

export type ResultsPayload = {
  jobId: string;
  resumePdfB64: string;
  coverLetterPdfB64: string;
  applyUrl?: string;
  createdAt?: string;
};

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function uploadResumeBundle(payload: {
  resume: File;
  projects: File;
  resumeText?: string;
}) {
  const formData = new FormData();
  formData.append("resume", payload.resume, payload.resume.name);
  formData.append("projects", payload.projects, payload.projects.name);
  if (payload.resumeText) {
    formData.append("resumeText", payload.resumeText);
  }

  const response = await fetch(`${AGENT_BASE_URL}/api/uploadResume`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to upload resume bundle");
  }
}

export async function triggerNextJob(): Promise<{ runId: string; job: Record<string, unknown> }> {
  const response = await fetch(`${AGENT_BASE_URL}/api/nextJob`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to start next job");
  }

  return (await response.json()) as { runId: string; job: Record<string, unknown> };
}

export async function fetchSdeJobs(): Promise<JobsResponse> {
  const response = await fetch(`${AGENT_BASE_URL}/api/jobs`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to fetch jobs");
  }
  return (await response.json()) as JobsResponse;
}

export async function getProgressFeed(): Promise<ProgressPayload[]> {
  const response = await fetch(`${AGENT_BASE_URL}/api/progress`);
  if (!response.ok) {
    throw new Error("Unable to load progress");
  }
  const data = (await response.json()) as { events?: ProgressPayload[] };
  return data.events ?? [];
}

export async function getLatestResults(): Promise<ResultsPayload | null> {
  const response = await fetch(`${AGENT_BASE_URL}/api/results`);
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Unable to load results");
  }
  const data = (await response.json()) as { results?: ResultsPayload[] };
  const [latest] = data.results ?? [];
  return latest ?? null;
}

export async function downloadResultPdf(
  jobId: string,
  kind: "resume" | "cover-letter"
): Promise<Blob> {
  const response = await fetch(`${AGENT_BASE_URL}/api/results/${encodeURIComponent(jobId)}/${kind}`, {
    method: "GET"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Unable to download ${kind}`);
  }

  return await response.blob();
}

export async function resetAgentSession(options?: {
  reloadJobs?: boolean;
  clearJobs?: boolean;
  clearResume?: boolean;
}) {
  await fetch(`${AGENT_BASE_URL}/api/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reloadJobs: options?.reloadJobs ?? false,
      clearJobs: options?.clearJobs ?? false,
      clearResume: options?.clearResume ?? false
    })
  });
}

