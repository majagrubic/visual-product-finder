"use client";

import { useState, useCallback } from "react";

interface ProductInfo {
  name: string;
  category: string;
  description: string;
  brand: string;
  searchQuery: string;
}

interface ProductResult {
  title: string;
  url: string;
  snippet: string;
  price: string | null;
  source: string;
}

type AppState = "idle" | "identifying" | "searching" | "done" | "error";

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border border-[var(--border)]" />
        <div className="absolute inset-0 rounded-full border border-transparent border-t-[var(--accent)] spin-cw" />
        <div className="absolute inset-2 rounded-full border border-transparent border-b-[var(--accent-dim)] spin-ccw" />
      </div>
      <p className="text-sm text-[var(--text-muted)] tracking-wide uppercase font-light">
        {label}
      </p>
    </div>
  );
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [state, setState] = useState<AppState>("idle");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage(base64);
      setProductInfo(null);
      setProducts([]);
      setState("idle");
      setError("");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSearch = async () => {
    if (!image) return;

    try {
      setState("identifying");
      setError("");

      const identifyRes = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType }),
      });

      if (!identifyRes.ok) throw new Error("Failed to identify product");

      const info: ProductInfo = await identifyRes.json();
      setProductInfo(info);

      // If Gemini couldn't identify a real product, skip the search
      const unidentified =
        !info.name ||
        info.name.toLowerCase() === "none" ||
        info.name.toLowerCase() === "unknown product" ||
        info.name.toLowerCase() === "unknown";

      if (unidentified) {
        setProducts([]);
        setState("done");
        return;
      }

      setState("searching");

      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: info.searchQuery }),
      });

      if (!searchRes.ok) throw new Error("Failed to search for products");

      const { products: results } = await searchRes.json();
      setProducts(results);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const reset = () => {
    setImage(null);
    setProductInfo(null);
    setProducts([]);
    setState("idle");
    setError("");
  };

  return (
    <div className="min-h-screen relative">
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
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4.5 h-4.5 text-[var(--bg-primary)]"
                >
                  <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                  <path
                    fillRule="evenodd"
                    d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1
                className="text-lg tracking-tight text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-instrument), serif" }}
              >
                Visual Product Finder
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] tracking-[0.2em] uppercase font-light">
                Identify & Shop
              </p>
            </div>
          </div>
          {image && (
            <button
              onClick={reset}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer tracking-wide uppercase font-light"
            >
              New search
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Upload State */}
        {!image ? (
          <div className="animate-fade-up">
            {/* Hero text */}
            <div className="text-center mb-12">
              <h2
                className="text-5xl md:text-7xl mb-4 text-[var(--text-primary)] leading-[1.1]"
                style={{ fontFamily: "var(--font-instrument), serif" }}
              >
                See something?
                <br />
                <span className="text-[var(--accent)]">Find it.</span>
              </h2>
              <p className="text-[var(--text-secondary)] text-lg font-light max-w-md mx-auto">
                Upload a photo of any product and we&apos;ll tell you exactly what
                it is and where to buy it.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => document.getElementById("file-input")?.click()}
              className="relative cursor-pointer group max-w-2xl mx-auto"
            >
              <div
                className={`
                  relative overflow-hidden rounded-2xl p-16 text-center transition-all duration-500
                  border border-dashed
                  ${
                    isDragging
                      ? "border-[var(--accent)] bg-[var(--accent-glow)]"
                      : "border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-card)]"
                  }
                `}
              >
                {/* Decorative corner accents */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[var(--accent)]/30 rounded-tl-sm" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[var(--accent)]/30 rounded-tr-sm" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[var(--accent)]/30 rounded-bl-sm" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[var(--accent)]/30 rounded-br-sm" />

                <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--accent)]/40 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-6 h-6 text-[var(--accent)]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <p className="text-[var(--text-primary)] text-base mb-1">
                  Drop your image here
                </p>
                <p className="text-[var(--text-muted)] text-sm font-light">
                  or click to browse &middot; JPG, PNG, WebP
                </p>
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                }}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Image + Identification */}
            <div className="grid md:grid-cols-5 gap-6">
              {/* Uploaded image - larger */}
              <div className="md:col-span-3 animate-fade-up">
                <div className="rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]">
                  <div className="relative">
                    <img
                      src={`data:${mimeType};base64,${image}`}
                      alt="Uploaded product"
                      className="w-full object-contain max-h-[480px] bg-black/20"
                    />
                    {/* Gradient overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                  </div>
                  <div className="p-5">
                    {state === "idle" && (
                      <button
                        onClick={handleSearch}
                        className="w-full py-4 px-6 bg-[var(--accent)] text-[var(--bg-primary)] font-semibold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer tracking-wide text-base shadow-[0_4px_24px_rgba(212,163,115,0.35)] hover:shadow-[0_6px_32px_rgba(212,163,115,0.5)]"
                      >
                        Identify & Find Product
                      </button>
                    )}
                    {(state === "identifying" || state === "searching") && (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <div className="w-4 h-4 rounded-full border border-transparent border-t-[var(--accent)] spin-fast" />
                        <span className="text-sm text-[var(--text-muted)] tracking-wide">
                          {state === "identifying"
                            ? "Analyzing with Gemini..."
                            : "Finding purchase links..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product info panel */}
              <div className="md:col-span-2 animate-fade-up stagger-2">
                {state === "identifying" && <Spinner label="Identifying" />}

                {productInfo && (state === "searching" || state === "done") && (
                  <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden animate-fade-up">
                    <div className="p-5 border-b border-[var(--border)]">
                      <p className="text-[10px] text-[var(--accent)] tracking-[0.25em] uppercase mb-3 font-medium">
                        Identified
                      </p>
                      <h3
                        className="text-2xl text-[var(--text-primary)] leading-snug mb-3"
                        style={{
                          fontFamily: "var(--font-instrument), serif",
                        }}
                      >
                        {productInfo.name}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[10px] px-2.5 py-1 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full tracking-wider uppercase">
                          {productInfo.category}
                        </span>
                        {productInfo.brand !== "Unknown" && (
                          <span className="text-[10px] px-2.5 py-1 border border-[var(--border)] text-[var(--text-secondary)] rounded-full tracking-wider uppercase">
                            {productInfo.brand}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-light">
                        {productInfo.description}
                      </p>
                    </div>
                  </div>
                )}

                {state === "error" && (
                  <div className="rounded-2xl bg-[var(--bg-card)] border border-red-900/30 p-6 text-center animate-fade-up">
                    <p className="text-red-400 text-sm mb-3">{error}</p>
                    <button
                      onClick={() => {
                        setState("idle");
                        setError("");
                      }}
                      className="text-xs text-[var(--accent)] hover:underline cursor-pointer tracking-wide uppercase"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search loading */}
            {state === "searching" && <Spinner label="Searching retailers" />}

            {/* Product Results */}
            {state === "done" && products.length > 0 && (
              <div className="animate-fade-up stagger-3">
                <div className="flex items-baseline justify-between mb-6">
                  <h3
                    className="text-3xl text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-instrument), serif" }}
                  >
                    Where to buy
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] tracking-wider uppercase">
                    {products.length} results
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product, i) => (
                    <a
                      key={i}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        group block rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]
                        p-5 transition-all duration-300
                        hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)]
                        hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--accent-glow)]
                        animate-fade-up stagger-${Math.min(i + 1, 5)}
                      `}
                    >
                      {/* Source + Price row */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-medium text-[var(--text-muted)] tracking-[0.2em] uppercase">
                          {product.source}
                        </span>
                        {product.price && (
                          <span className="text-sm font-medium text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-md">
                            {product.price}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-[var(--text-primary)] leading-snug mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                        {product.title}
                      </h4>

                      {/* Snippet */}
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3 mb-4">
                        {product.snippet}
                      </p>

                      {/* CTA */}
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2 8a.75.75 0 0 1 .75-.75h8.69L8.22 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06-1.06l3.22-3.22H2.75A.75.75 0 0 1 2 8Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {state === "done" && products.length === 0 && (
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-10 text-center animate-fade-up">
                <p
                  className="text-xl text-[var(--text-secondary)] mb-2"
                  style={{ fontFamily: "var(--font-instrument), serif" }}
                >
                  {productInfo &&
                  (!productInfo.name ||
                    productInfo.name.toLowerCase() === "none" ||
                    productInfo.name.toLowerCase() === "unknown product" ||
                    productInfo.name.toLowerCase() === "unknown")
                    ? "Couldn\u2019t identify a product"
                    : "No matching products found"}
                </p>
                <p className="text-sm text-[var(--text-muted)] font-light">
                  Try uploading a clearer photo of a specific product.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] py-6">
        <p className="text-center text-xs text-[var(--text-muted)] tracking-wide font-light">
          Built for Agentic AI Engineering Bootcamp by Maja Grubic & Murali Lakshman
        </p>
      </footer>
    </div>
  );
}
