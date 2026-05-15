"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseStorageImageUrl } from "@/lib/storage-images";

interface StorageImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  quality?: number;
}

export function StorageImage({
  src,
  alt,
  width,
  height,
  className,
  quality = 70,
}: StorageImageProps) {
  const optimizedSrc = useMemo(
    () => getSupabaseStorageImageUrl(src, { width, height, quality }),
    [height, quality, src, width],
  );
  const [currentSrc, setCurrentSrc] = useState(optimizedSrc);

  useEffect(() => {
    setCurrentSrc(optimizedSrc);
  }, [optimizedSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (currentSrc !== src) setCurrentSrc(src);
      }}
    />
  );
}
