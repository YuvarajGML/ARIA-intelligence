export function ReportView({ markdown }: { markdown: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Report (streaming)</div>
      {markdown ? (
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-transparent p-0 m-0">
            {markdown}
            <span className="inline-block w-2 h-4 bg-primary/70 align-middle animate-pulse ml-0.5" />
          </pre>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">synthesis pending…</div>
      )}
    </div>
  );
}
