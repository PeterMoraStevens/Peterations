/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Image from "next/image";

interface BlogImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
}

export function BlogImage({ src, alt, className, ...props }: BlogImageProps) {
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

  const lightbox = open ? (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={() => setOpen(false)}
    >
      <button
        className="absolute top-4 right-4 z-20 p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
        onClick={() => setOpen(false)}
      >
        <X size={18} />
      </button>
      <Image
        height={400}
        width={400}
        src={src}
        alt={alt ?? ""}
        className="max-h-[90vh] max-w-[90vw] w-auto h-auto border-2 border-white block"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  ) : null;

  return (
    <>
      <Image
        src={src}
        height={800}
        width={800}
        alt={alt ?? ""}
        className={`cursor-zoom-in ${className ?? ""} w-auto max-h-400px`}
        onClick={() => setOpen(true)}
        {...props}
      />
      {mounted && createPortal(lightbox, document.body)}
    </>
  );
}
