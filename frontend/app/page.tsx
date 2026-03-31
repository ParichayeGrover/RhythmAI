import Link from "next/link";

export default function Home() {
  return (
    <main className="app-container space-y-8">
      <section className="glass-panel overflow-hidden p-8 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
          RhythmAI Engine Online
        </div>

        <h1 className="ui-title mt-6 max-w-4xl text-4xl leading-tight md:text-6xl">
          Turn raw drum loops into <span className="ui-gradient">AI-generated basslines</span> in seconds.
        </h1>

        <p className="ui-muted mt-5 max-w-3xl text-base leading-relaxed md:text-lg">
          Upload your groove, run the model pipeline, and export production-ready MIDI with a single workflow.
          RhythmAI keeps analysis, generation, and track history in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/studio"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Open Studio
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="glass-panel p-5">
          <h2 className="ui-title text-lg">Upload + Analyze</h2>
          <p className="ui-muted mt-2 text-sm">Drag audio into Studio and launch the pipeline with one action.</p>
        </article>
        <article className="glass-panel p-5">
          <h2 className="ui-title text-lg">Generate MIDI</h2>
          <p className="ui-muted mt-2 text-sm">FastAPI model response is stored and linked to each track automatically.</p>
        </article>
        <article className="glass-panel p-5">
          <h2 className="ui-title text-lg">Track History</h2>
          <p className="ui-muted mt-2 text-sm">Every generation is available in Dashboard for playback and download.</p>
        </article>
      </section>
    </main>
  );
}