"use client";

import { useState, useEffect } from "react";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  price: string | null;
  source: string;
}

interface HistoryEntry {
  id: number;
  image: string;
  mime_type: string;
  product_name: string;
  product_category: string;
  product_description: string;
  product_brand: string;
  search_query: string;
  created_at: string;
  results: SearchResult[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Ambient background glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,163,115,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-4 no-underline">
            <img src="/icon.svg" alt="Logo" className="w-9 h-9 rounded-lg" />
            <div>
              <h1
                className="text-lg tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-instrument), serif" }}
              >
                Visual Product Finder
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] tracking-[0.2em] uppercase font-light">
                Search History
              </p>
            </div>
          </a>
          <div className="flex items-center gap-5">
            <a
              href="/history"
              className="text-xs text-[var(--accent)] transition-colors tracking-wide uppercase font-light no-underline"
            >
              History
            </a>
            <a
              href="/"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors tracking-wide uppercase font-light no-underline"
            >
              New search
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 flex-1 w-full">
        <h2
          className="text-4xl mb-8 text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-instrument), serif" }}
        >
          Search History
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-full border border-[var(--border)]" />
              <div className="absolute inset-0 rounded-full border border-transparent border-t-[var(--accent)] spin-cw" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center">
            <p
              className="text-xl text-[var(--text-secondary)] mb-2"
              style={{ fontFamily: "var(--font-instrument), serif" }}
            >
              No searches yet
            </p>
            <p className="text-sm text-[var(--text-muted)] font-light mb-6">
              Upload a product photo to get started.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-[var(--accent)] text-[var(--bg-primary)] font-medium rounded-xl hover:brightness-110 transition-all no-underline text-sm"
            >
              Start searching
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden hover:border-[var(--border-hover)] transition-colors animate-fade-up"
              >
                {/* Summary row */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                  className="block w-full px-5 py-4 flex items-center justify-between cursor-pointer bg-transparent border-none text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    {entry.image ? (
                      <img
                        src={`data:${entry.mime_type};base64,${entry.image}`}
                        alt={entry.product_name}
                        className="w-12 h-12 object-cover rounded-lg shrink-0 border border-[var(--border)]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-[var(--accent)]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3
                        className="text-base text-[var(--text-primary)] truncate"
                        style={{ fontFamily: "var(--font-instrument), serif" }}
                      >
                        {entry.product_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-[var(--accent)] tracking-wider uppercase">
                          {entry.product_category}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {entry.results.length} results
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-[var(--text-muted)] font-light hidden sm:block">
                      {formatDate(entry.created_at)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                        expandedId === entry.id ? "rotate-180" : ""
                      }`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === entry.id && (
                  <div className="border-t border-[var(--border)] animate-fade-in">
                    {/* Image + Product description */}
                    <div className="px-5 py-4 border-b border-[var(--border)] flex gap-5 items-start">
                      {entry.image && (
                        <img
                          src={`data:${entry.mime_type};base64,${entry.image}`}
                          alt={entry.product_name}
                          className="w-40 h-40 object-cover rounded-xl shrink-0 border border-[var(--border)]"
                        />
                      )}
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                          {entry.product_description}
                        </p>
                        {entry.product_brand &&
                          entry.product_brand !== "Unknown" &&
                          entry.product_brand !== "null" && (
                            <span className="inline-block mt-2 text-[10px] px-2.5 py-1 border border-[var(--border)] text-[var(--text-secondary)] rounded-full tracking-wider uppercase">
                              {entry.product_brand}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Results */}
                    {entry.results.length > 0 && (
                      <div className="px-5 py-4">
                        <p className="text-[10px] text-[var(--text-muted)] tracking-[0.2em] uppercase mb-3">
                          Purchase links
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {entry.results.map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 hover:border-[var(--border-hover)] transition-all no-underline"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                                  {r.source}
                                </span>
                                {r.price && (
                                  <span className="text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-1.5 py-0.5 rounded">
                                    {r.price}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                                {r.title}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] py-6">
        <p className="text-center text-xs text-[var(--text-muted)] tracking-wide font-light">
          Built for Agentic AI Engineering Bootcamp by Maja Grubic
        </p>
      </footer>
    </div>
  );
}
