#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const STORAGE_IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 365;

const PRESETS = {
  profile: { maxDimension: 512, quality: 72 },
  document: { maxDimension: 1600, quality: 82 },
};

const BUCKET_PRESETS = {
  avatars: PRESETS.profile,
  photos: PRESETS.profile,
  "la-marea-ids": PRESETS.document,
  "payment-screenshots": PRESETS.document,
};

const URL_COLUMNS = [
  "avatar_url",
  "photo_url",
  "la_marea_id_url",
  "payment_screenshot_url",
];

const CONVERTIBLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
]);

const CONVERTIBLE_EXTENSIONS = new Set([".jpeg", ".jpg", ".png", ".heic", ".heif"]);

loadEnvFile(".env.local");
loadEnvFile(".env");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const apply = process.env.APPLY === "1" || process.argv.includes("--apply");
const deleteOriginals = process.env.DELETE_ORIGINALS === "1" || process.argv.includes("--delete-originals");
const overwriteWebp = process.env.OVERWRITE_WEBP === "1" || process.argv.includes("--overwrite-webp");
const buckets = parseBuckets(process.env.BUCKETS);
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  printHelp();
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const summary = {
  scanned: 0,
  planned: 0,
  converted: 0,
  reused: 0,
  skipped: 0,
  failed: 0,
  updatedRows: 0,
  deletedOriginals: 0,
};

console.log(apply ? "Running WebP conversion." : "Dry run only. Set APPLY=1 to upload WebP files and update URLs.");
if (deleteOriginals) {
  console.log("DELETE_ORIGINALS is enabled. Old files will be removed after URL updates.");
}

for (const bucket of buckets) {
  const preset = BUCKET_PRESETS[bucket];
  if (!preset) {
    console.warn(`Skipping unknown bucket "${bucket}". Known buckets: ${Object.keys(BUCKET_PRESETS).join(", ")}`);
    continue;
  }

  const objects = await listObjects(bucket);
  const objectPaths = new Set(objects.map((object) => object.path));
  for (const object of objects) {
    summary.scanned += 1;
    if (!isConvertibleObject(object)) {
      summary.skipped += 1;
      continue;
    }

    const sourcePath = object.path;
    const webpPath = toWebpPath(sourcePath);
    if (webpPath === sourcePath) {
      summary.skipped += 1;
      continue;
    }

    summary.planned += 1;
    const sourceUrl = getPublicUrl(bucket, sourcePath);
    const webpUrl = getPublicUrl(bucket, webpPath);
    const webpExists = objectPaths.has(webpPath);
    console.log(`${apply ? (webpExists && !overwriteWebp ? "Reusing" : "Converting") : "Would convert"} ${bucket}/${sourcePath} -> ${webpPath}`);

    if (!apply) continue;

    try {
      if (webpExists && !overwriteWebp) {
        summary.reused += 1;
      } else {
        const buffer = await downloadObject(bucket, sourcePath);
        const webpBuffer = await sharp(buffer)
          .rotate()
          .resize({
            width: preset.maxDimension,
            height: preset.maxDimension,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: preset.quality })
          .toBuffer();

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(webpPath, webpBuffer, {
            contentType: "image/webp",
            cacheControl: String(STORAGE_IMAGE_CACHE_SECONDS),
            upsert: overwriteWebp,
          });

        if (uploadError) {
          throw uploadError;
        }

        summary.converted += 1;
      }

      summary.updatedRows += await updateUserUrls(sourceUrl, webpUrl);

      if (deleteOriginals) {
        const { error: removeError } = await supabase.storage.from(bucket).remove([sourcePath]);
        if (removeError) throw removeError;
        summary.deletedOriginals += 1;
      }
    } catch (error) {
      summary.failed += 1;
      console.error(`Failed ${bucket}/${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

console.log(JSON.stringify(summary, null, 2));
if (summary.failed > 0) process.exit(1);

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    const rawValue = trimmed.slice(equals + 1).trim();
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function parseBuckets(value) {
  if (!value) return Object.keys(BUCKET_PRESETS);
  return value
    .split(",")
    .map((bucket) => bucket.trim())
    .filter(Boolean);
}

async function listObjects(bucket, prefix = "") {
  const all = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (isFileObject(item)) {
        all.push({ ...item, path: objectPath });
      } else {
        all.push(...(await listObjects(bucket, objectPath)));
      }
    }

    if (!data || data.length < 1000) break;
    offset += 1000;
  }

  return all;
}

function isFileObject(item) {
  const metadata = item.metadata ?? {};
  return Boolean(item.id || metadata.size || metadata.mimetype || metadata.mimeType);
}

function isConvertibleObject(object) {
  const extension = extname(object.name).toLowerCase();
  const mimetype = String(object.metadata?.mimetype ?? object.metadata?.mimeType ?? "").toLowerCase();
  if (extension === ".webp" || mimetype === "image/webp") return false;
  return CONVERTIBLE_TYPES.has(mimetype) || CONVERTIBLE_EXTENSIONS.has(extension);
}

function toWebpPath(objectPath) {
  const extension = extname(objectPath);
  if (!extension) return `${objectPath}.webp`;
  return `${objectPath.slice(0, -extension.length)}.webp`;
}

async function downloadObject(bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

function getPublicUrl(bucket, objectPath) {
  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

async function updateUserUrls(sourceUrl, webpUrl) {
  let updated = 0;
  for (const column of URL_COLUMNS) {
    const { count, error } = await supabase
      .from("users")
      .update({ [column]: webpUrl }, { count: "exact" })
      .eq(column, sourceUrl);
    if (error) throw error;
    updated += count ?? 0;
  }
  return updated;
}

function printHelp() {
  const command = basename(process.argv[1] ?? "convert-storage-images-to-webp.mjs");
  console.log(`
Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm storage:convert-webp
  APPLY=1 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm storage:convert-webp

Options:
  APPLY=1 / --apply              Upload WebP copies and update matching users.*_url columns.
  DELETE_ORIGINALS=1             Remove old JPEG/PNG/HEIC files after successful URL updates.
  OVERWRITE_WEBP=1               Replace existing .webp objects.
  BUCKETS=photos,avatars         Limit conversion to selected buckets.

Defaults:
  Dry run only. Converts avatars/photos at 512px WebP quality 72 and document buckets at
  1600px WebP quality 82. Existing originals are kept unless DELETE_ORIGINALS=1 is set.

Script:
  ${command}
`);
}
