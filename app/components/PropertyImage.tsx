"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { imageUrlExpiry } from "@/lib/derive/gallery";

export function PropertyImage({
  src,
  alt,
  sizes,
  loading = "lazy",
  className = "object-cover",
  iconSize = 18,
  showFailureLabel = false,
  onError,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  loading?: "eager" | "lazy";
  className?: string;
  iconSize?: number;
  showFailureLabel?: boolean;
  onError?: () => void;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const expired = src ? imageUrlExpiry(src).expired : false;
  const failed = Boolean(src && failedSrc === src);

  if (!src || expired || failed) {
    const label = expired ? "Fotografia expirada" : "Não foi possível carregar a fotografia";
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint">
        <ImageOff size={iconSize} strokeWidth={1.5} />
        {showFailureLabel && <span className="text-sm">{label}</span>}
      </div>
    );
  }

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={loading}
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
      className={className}
    />
  );
}
