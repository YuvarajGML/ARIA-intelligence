import { PERSONAS } from "./personas";
import type { Evidence, PersonaId } from "./types";
import type { GitHubRepository, GitHubService } from "./github";

export interface GitHubDeliveryInput {
  runId: string;
  topic: string;
  report: string;
  confidence: number;
  persona: PersonaId;
  topEvidence: Pick<Evidence, "title" | "url" | "source" | "snippet">[];
}

export interface FounderSignal {
  type: "competitor" | "risk";
  label: string;
  detail: string;
  severity: "medium" | "high";
}

export interface GitHubRepoAnalysis {
  trendingRepositories: GitHubRepository[];
  founderSignals: FounderSignal[];
  recommendations: string[];
}

export async function analyzeGitHubRepos(
  github: GitHubService,
  input: GitHubDeliveryInput,
): Promise<GitHubRepoAnalysis> {
  const pushedAfter = new Date(Date.now() - 120 * 86400_000).toISOString().slice(0, 10);
  const query = `${input.topic} in:name,description pushed:>${pushedAfter}`;
  const trendingRepositories = await github.searchRepositories(query, 5).catch(() => []);
  const founderSignals = findFounderSignals(input, trendingRepositories);

  return {
    trendingRepositories,
    founderSignals,
    recommendations: buildRecommendations(input, trendingRepositories, founderSignals),
  };
}

export function buildGitHubMarkdownReport(
  input: GitHubDeliveryInput,
  analysis: GitHubRepoAnalysis,
): string {
  const persona = PERSONAS[input.persona];
  const sourceLines = input.topEvidence.length
    ? input.topEvidence
        .map((e, i) => `${i + 1}. [${e.title}](${e.url})${e.source ? ` - ${e.source}` : ""}`)
        .join("\n")
    : "No source links captured.";
  const repoLines = analysis.trendingRepositories.length
    ? analysis.trendingRepositories
        .map(
          (repo, i) =>
            `${i + 1}. [${repo.full_name}](${repo.html_url}) - ${repo.stargazers_count.toLocaleString()} stars, ${repo.forks_count.toLocaleString()} forks, ${repo.language ?? "unknown"}`,
        )
        .join("\n")
    : "No matching trending repositories found via GitHub Search.";
  const signalLines = analysis.founderSignals.length
    ? analysis.founderSignals
        .map((s) => `- **${s.severity.toUpperCase()} ${s.type}:** ${s.label} - ${s.detail}`)
        .join("\n")
    : "- No founder-specific competitor or risk signals crossed the alert threshold.";
  const recommendationLines = analysis.recommendations.map((r) => `- ${r}`).join("\n");

  return `# ARIA ${persona.label} Report: ${input.topic}

## Run Metadata

- Run ID: \`${input.runId}\`
- Persona: ${persona.label}
- Confidence: ${Math.round(input.confidence * 100)}%
- Generated: ${new Date().toISOString()}

## Recommendations

${recommendationLines}

## Founder Alerts

${signalLines}

## Trending GitHub Repositories

${repoLines}

## Source Links

${sourceLines}

## Report

${input.report.trim() || "_No report text was generated._"}
`;
}

export function buildGitHubIssue(
  input: GitHubDeliveryInput,
  analysis: GitHubRepoAnalysis,
  reportPath: string,
) {
  const persona = PERSONAS[input.persona];
  const hasHighSignal = analysis.founderSignals.some((s) => s.severity === "high");
  const prefix =
    input.persona === "founder" && analysis.founderSignals.length > 0
      ? "Founder Alert"
      : `${persona.label} Alert`;
  const title = `[ARIA] ${prefix}: ${input.topic}`;
  const labels = [
    "aria-alert",
    `persona:${input.persona}`,
    hasHighSignal ? "priority:high" : "priority:normal",
    ...(analysis.founderSignals.some((s) => s.type === "competitor") ? ["competitor-signal"] : []),
    ...(analysis.founderSignals.some((s) => s.type === "risk") ? ["risk-signal"] : []),
  ];

  const body = `## Summary

ARIA generated a ${persona.label.toLowerCase()} report for **${input.topic}**.

- Confidence: **${Math.round(input.confidence * 100)}%**
- Markdown report: \`${reportPath}\`
- Run ID: \`${input.runId}\`

## Recommendations

${analysis.recommendations.map((r) => `- ${r}`).join("\n")}

## Founder Signals

${
  analysis.founderSignals.length
    ? analysis.founderSignals
        .map((s) => `- **${s.severity.toUpperCase()} ${s.type}:** ${s.label} - ${s.detail}`)
        .join("\n")
    : "- No founder-specific competitor or risk signals crossed the alert threshold."
}

## Trending Repositories

${
  analysis.trendingRepositories.length
    ? analysis.trendingRepositories
        .map(
          (repo) =>
            `- [${repo.full_name}](${repo.html_url}) - ${repo.stargazers_count.toLocaleString()} stars, ${repo.language ?? "unknown"}`,
        )
        .join("\n")
    : "- No matching repositories found."
}

## Source Links

${
  input.topEvidence.length
    ? input.topEvidence
        .map((e) => `- [${e.title}](${e.url})${e.source ? ` - ${e.source}` : ""}`)
        .join("\n")
    : "- No source links captured."
}
`;

  return { title, body, labels };
}

export function reportPathFor(input: GitHubDeliveryInput): string {
  const day = new Date().toISOString().slice(0, 10);
  return `reports/${day}-${slugify(input.topic)}-${input.runId}.md`;
}

function findFounderSignals(
  input: GitHubDeliveryInput,
  repos: GitHubRepository[],
): FounderSignal[] {
  const signals: FounderSignal[] = [];
  const reportText =
    `${input.topic}\n${input.report}\n${input.topEvidence.map((e) => `${e.title} ${e.snippet}`).join("\n")}`.toLowerCase();
  const riskWords = [
    "risk",
    "lawsuit",
    "security",
    "breach",
    "outage",
    "regulation",
    "pricing",
    "churn",
    "layoff",
    "shutdown",
  ];

  if (repos.length > 0) {
    const top = repos[0];
    const severity = top.stargazers_count >= 10_000 ? "high" : "medium";
    signals.push({
      type: "competitor",
      label: top.full_name,
      detail: `${top.stargazers_count.toLocaleString()} stars and recent activity may indicate developer traction.`,
      severity,
    });
  }

  for (const word of riskWords) {
    if (reportText.includes(word)) {
      signals.push({
        type: "risk",
        label: word,
        detail: `The research mentions "${word}", so this should be reviewed before acting on the finding.`,
        severity: ["breach", "lawsuit", "outage", "shutdown"].includes(word) ? "high" : "medium",
      });
    }
  }

  return dedupeSignals(signals).slice(0, input.persona === "founder" ? 5 : 3);
}

function buildRecommendations(
  input: GitHubDeliveryInput,
  repos: GitHubRepository[],
  signals: FounderSignal[],
): string[] {
  if (input.persona === "student") {
    return [
      "Review the source links and turn the report into a short study note.",
      "Inspect the trending repositories to connect concepts with working implementations.",
      "Re-run with higher depth if confidence is below 70%.",
    ];
  }

  if (input.persona === "investor") {
    return [
      "Validate each market or traction claim against primary sources before diligence use.",
      "Use the GitHub repository activity as a technical adoption proxy, not a standalone investment signal.",
      "Open follow-up diligence issues for any high-severity risks.",
    ];
  }

  return [
    signals.length > 0
      ? "Assign an owner to review competitor and risk signals within 24 hours."
      : "Scan for competitor movement, but no urgent founder signal crossed the threshold.",
    repos.length > 0
      ? "Review the top GitHub repositories for positioning, roadmap clues, and developer traction."
      : "Run a narrower competitor query if GitHub Search did not find relevant repositories.",
    input.confidence >= 0.7
      ? "Convert the strongest findings into a concrete GTM or product experiment."
      : "Treat this as directional and re-run with deeper research before making a major decision.",
  ];
}

function dedupeSignals(signals: FounderSignal[]): FounderSignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.type}:${signal.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "report"
  );
}
