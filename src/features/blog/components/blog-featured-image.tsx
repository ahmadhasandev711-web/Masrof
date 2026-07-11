"use client";

import Image from "next/image";
import { useState } from "react";

type BlogFeaturedImageProps = {
  src?: string | null;
  alt: string;
  fallbackLetter: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholderClassName?: string;
};

export function BlogFeaturedImage({
  src,
  alt,
  fallbackLetter,
  className = "object-cover",
  sizes,
  priority = false,
  placeholderClassName,
}: BlogFeaturedImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] p-6 ${placeholderClassName ?? ""}`}
      >
        <span className="font-[family-name:var(--font-marketing-display)] text-5xl font-semibold text-[#065F46]/25">
          {fallbackLetter}
        </span>
      </div>
    );
  }

  if (src.startsWith("/uploads/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local uploads may be missing after redeploy; avoid Next optimizer errors.
      <img
        src={src}
        alt={alt}
        className={`h-full w-full ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
