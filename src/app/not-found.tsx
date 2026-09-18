import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden>
        🔌
      </p>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">That page is not here</h1>
      <p className="mt-3 leading-relaxed text-muted">
        The API you are looking for may have been renamed, or removed from the catalogue after it
        stopped responding. Searching usually finds it.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/browse"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-on transition hover:bg-accent-hover"
        >
          Search the catalogue
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium transition hover:border-accent hover:text-accent"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
