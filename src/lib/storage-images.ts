export const STORAGE_IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 365;

export const STORAGE_IMAGE_UPLOADS = {
  profile: {
    maxDimension: 512,
    quality: 0.72,
  },
  document: {
    maxDimension: 1600,
    quality: 0.82,
  },
} as const;

type StorageImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

type PreparedStorageImageUpload = {
  blob: Blob;
  contentType: string;
  cacheControl: string;
  extension: string;
};

type StorageImageUploadPreset = (typeof STORAGE_IMAGE_UPLOADS)[keyof typeof STORAGE_IMAGE_UPLOADS];

const PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public/";

export function getSupabaseStorageImageUrl(
  src: string,
  options: StorageImageTransformOptions,
): string {
  void options;
  if (isSupabasePublicStorageUrl(src) && !isWebpUrl(src)) return "";
  return src;
}

export function resolveImageDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
): { width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: maxDimension, height: maxDimension };
  }

  const largestSide = Math.max(sourceWidth, sourceHeight);
  if (largestSide <= maxDimension) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = maxDimension / largestSide;
  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
  };
}

export function getStorageImageUploadOptions(sourceType: string): Omit<PreparedStorageImageUpload, "blob"> {
  void sourceType;

  return {
    contentType: "image/webp",
    cacheControl: String(STORAGE_IMAGE_CACHE_SECONDS),
    extension: "webp",
  };
}

export async function prepareStorageImageUpload(
  file: Blob,
  preset: StorageImageUploadPreset = STORAGE_IMAGE_UPLOADS.profile,
): Promise<PreparedStorageImageUpload> {
  const optimizedOptions = getStorageImageUploadOptions(file.type);

  if (!canResizeImageInBrowser(file)) {
    throw new Error("This browser cannot convert images to WebP. Please try a current browser.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = resolveImageDimensions(
      bitmap.width,
      bitmap.height,
      preset.maxDimension,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Could not prepare the image for WebP upload.");
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvasToBlob(canvas, optimizedOptions.contentType, preset.quality);
    if (!blob) {
      throw new Error("Could not convert the image to WebP.");
    }

    return {
      blob,
      ...optimizedOptions,
    };
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Could not convert the image to WebP.");
  }
}

function canResizeImageInBrowser(file: Blob): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof createImageBitmap === "function" &&
    file.type.startsWith("image/")
  );
}

function isSupabasePublicStorageUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith(PUBLIC_STORAGE_PREFIX)
    );
  } catch {
    return false;
  }
}

function isWebpUrl(src: string): boolean {
  try {
    const url = new URL(src, "https://app.local");
    return url.pathname.toLowerCase().endsWith(".webp");
  } catch {
    return false;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  contentType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, contentType, quality);
  });
}
