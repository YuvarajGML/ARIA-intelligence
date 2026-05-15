export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export interface GitHubIssue {
  number: number;
  html_url: string;
  id: number;
}

export interface GitHubContentCommit {
  content?: { html_url?: string; path?: string; sha?: string };
  commit?: { html_url?: string; sha?: string };
}

export interface GitHubRepository {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string;
  topics?: string[];
}

interface GitHubErrorBody {
  message?: string;
  documentation_url?: string;
}

const GITHUB_API = "https://api.github.com";
const MAX_RETRIES = 2;

export class GitHubService {
  private readonly token: string;
  readonly repoRef: GitHubRepoRef;

  constructor(token: string, repo: string) {
    this.token = token;
    this.repoRef = parseRepo(repo);
  }

  async createIssue(input: {
    title: string;
    body: string;
    labels?: string[];
  }): Promise<GitHubIssue> {
    const payload = { title: input.title, body: input.body, labels: input.labels ?? [] };
    try {
      return await this.request<GitHubIssue>(`/repos/${this.repoPath}/issues`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      const labelsMayBeMissing =
        payload.labels.length > 0 && (err as Error).message.includes("github 422");
      if (!labelsMayBeMissing) throw err;

      return this.request<GitHubIssue>(`/repos/${this.repoPath}/issues`, {
        method: "POST",
        body: JSON.stringify({ title: input.title, body: input.body }),
      });
    }
  }

  async commitMarkdownReport(input: {
    path: string;
    content: string;
    message: string;
  }): Promise<GitHubContentCommit> {
    const existing = await this.getFileSha(input.path);
    const body: Record<string, string> = {
      message: input.message,
      content: toBase64(input.content),
    };
    if (existing) body.sha = existing;

    return this.request<GitHubContentCommit>(
      `/repos/${this.repoPath}/contents/${encodePath(input.path)}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  }

  async searchRepositories(query: string, perPage = 5): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: String(Math.min(Math.max(perPage, 1), 10)),
    });
    const data = await this.request<{ items?: GitHubRepository[] }>(
      `/search/repositories?${params.toString()}`,
      {
        method: "GET",
      },
    );
    return data.items ?? [];
  }

  private async getFileSha(path: string): Promise<string | undefined> {
    try {
      const data = await this.request<{ sha?: string }>(
        `/repos/${this.repoPath}/contents/${encodePath(path)}`,
        {
          method: "GET",
        },
      );
      return data.sha;
    } catch (err) {
      if (err instanceof Error && err.message.includes("github 404")) return undefined;
      throw err;
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(`${GITHUB_API}${path}`, {
          ...init,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "ARIA",
            "X-GitHub-Api-Version": "2022-11-28",
            ...init.headers,
          },
        });

        if (res.ok) return (await res.json()) as T;

        const body = (await res.json().catch(() => ({}))) as GitHubErrorBody;
        const message = body.message ?? `github ${res.status}`;
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt === MAX_RETRIES) {
          throw new Error(`github ${res.status}: ${message}`);
        }
        lastError = new Error(`github ${res.status}: ${message}`);
      } catch (err) {
        lastError = err as Error;
        if (attempt === MAX_RETRIES) break;
      }

      await sleep(300 * 2 ** attempt);
    }

    throw lastError ?? new Error("github request failed");
  }

  private get repoPath() {
    return `${this.repoRef.owner}/${this.repoRef.repo}`;
  }
}

export function createGitHubServiceFromEnv(): GitHubService | { error: string } {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { error: "GITHUB_TOKEN not set" };

  const repo = process.env.GITHUB_REPO;
  if (!repo) return { error: "GITHUB_REPO not set" };

  try {
    return new GitHubService(token, repo);
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function parseRepo(input: string): GitHubRepoRef {
  const trimmed = input
    .trim()
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/\.git$/, "");
  const [owner, repo] = trimmed.split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must be owner/repo");
  }
  return { owner, repo };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
