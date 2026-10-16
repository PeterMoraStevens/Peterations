/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Hosts allowed by `images.remotePatterns` in next.config.mjs. Anything else
// (e.g. a pasted third-party URL) is served unoptimised instead of crashing.
const OPTIMISED_HOSTS = [/\.googleapis\.com$/, /(^|\.)petermorastevens\.rocks$/, /^i\.scdn\.co$/, /^image\.tmdb\.org$/];

function canOptimise(src: string) {
  try {
    const { hostname } = new URL(src);
    return OPTIMISED_HOSTS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

interface BlogImageProps {
  src: string;
  alt?: string;
  caption?: string;
  /** Percentage of the column width, e.g. "50". */
  width?: string | number;
  align?: "left" | "center" | "right";
  /** CSS aspect ratio such as "16/9"; "auto" keeps the original. */
  aspect?: string;
  className?: string;
}

export function BlogImage({ src, alt, caption, width, align = "center", aspect, className }: BlogImageProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) return null;

  const pct = Number(width) || 100;
  const cropped = aspect && aspect !== "auto";
  const unoptimized = !canOptimise(src);

  const lightbox = open ? (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-4 p-4"
      onClick={() => setOpen(false)}
    >
      <button
        aria-label="Close image"
        className="absolute top-4 right-4 z-20 p-2 rounded-xl border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
        onClick={() => setOpen(false)}
      >
        <X size={18} />
      </button>
      <Image
        height={1600}
        width={1600}
        src={src}
        alt={alt ?? ""}
        unoptimized={unoptimized}
        className="max-h-[85vh] max-w-[92vw] w-auto h-auto rounded-xl border-2 border-white block"
        onClick={(e) => e.stopPropagation()}
      />
      {caption && <p className="text-sm text-white/80 text-center max-w-xl">{caption}</p>}
    </div>
  ) : null;

  return (
    <figure
      className={cn(
        "not-prose my-8 max-w-full",
        align === "center" && "mx-auto",
        align === "right" && "ml-auto",
        className,
      )}
      style={{ width: `${pct}%` }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in rounded-xl border-2 border-border shadow-brutal overflow-hidden bg-muted"
        style={cropped ? { aspectRatio: aspect } : undefined}
        aria-label={alt ? `Expand image: ${alt}` : "Expand image"}
      >
        <Image
          src={src}
          height={1200}
          width={1200}
          alt={alt ?? ""}
          unoptimized={unoptimized}
          sizes="(max-width: 768px) 100vw, 768px"
          className={cn("block w-full", cropped ? "h-full object-cover" : "h-auto")}
        />
      </button>
      {caption && (
        <figcaption className="mt-3 text-sm text-center text-muted-foreground">{caption}</figcaption>
      )}
      {mounted && createPortal(lightbox, document.body)}
    </figure>
  );
}
