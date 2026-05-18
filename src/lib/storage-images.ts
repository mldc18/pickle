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

export function getSupabaseStorageImageUrl(
  src: string,
  options: StorageImageTransformOptions,
): string {
  void options;
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
    return {
      blob: file,
      ...getOriginalUploadOptions(file.type),
    };
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
      return { blob: file, ...getOriginalUploadOptions(file.type) };
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await canvasToBlob(canvas, optimizedOptions.contentType, preset.quality);
    if (!blob) {
      return { blob: file, ...getOriginalUploadOptions(file.type) };
    }

    return {
      blob,
      ...optimizedOptions,
    };
  } catch {
    return {
      blob: file,
      ...getOriginalUploadOptions(file.type),
    };
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

function getOriginalUploadOptions(sourceType: string): Omit<PreparedStorageImageUpload, "blob"> {
  const contentType = sourceType || "image/jpeg";
  return {
    contentType,
    cacheControl: String(STORAGE_IMAGE_CACHE_SECONDS),
    extension: extensionForContentType(contentType),
  };
}

function extensionForContentType(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  return "jpg";
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
