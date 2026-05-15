import { describe, expect, it } from "vitest";

import {
  STORAGE_IMAGE_CACHE_SECONDS,
  STORAGE_IMAGE_UPLOADS,
  getStorageImageUploadOptions,
  getSupabaseStorageImageUrl,
  resolveImageDimensions,
} from "./storage-images";

describe("storage image optimization", () => {
  it("builds a small Supabase render URL for public storage images", () => {
    const url = getSupabaseStorageImageUrl(
      "https://project-ref.supabase.co/storage/v1/object/public/photos/user-1/display.jpg",
      { width: 96, height: 96, quality: 70 },
    );

    expect(url).toBe(
      "https://project-ref.supabase.co/storage/v1/render/image/public/photos/user-1/display.jpg?width=96&height=96&resize=cover&quality=70",
    );
  });

  it("leaves non-storage images unchanged", () => {
    expect(getSupabaseStorageImageUrl("/lampa-logo.jpg", { width: 96, height: 96 })).toBe(
      "/lampa-logo.jpg",
    );
    expect(getSupabaseStorageImageUrl("blob:https://app.local/photo", { width: 96 })).toBe(
      "blob:https://app.local/photo",
    );
  });

  it("keeps resized uploads within the target square while preserving aspect ratio", () => {
    expect(resolveImageDimensions(4000, 2000, STORAGE_IMAGE_UPLOADS.profile.maxDimension)).toEqual({
      width: 768,
      height: 384,
    });
    expect(resolveImageDimensions(300, 200, STORAGE_IMAGE_UPLOADS.profile.maxDimension)).toEqual({
      width: 300,
      height: 200,
    });
  });

  it("uses JPEG upload options with a long browser cache for user photos", () => {
    expect(getStorageImageUploadOptions("image/png")).toEqual({
      contentType: "image/jpeg",
      cacheControl: String(STORAGE_IMAGE_CACHE_SECONDS),
      extension: "jpg",
    });
  });
});
