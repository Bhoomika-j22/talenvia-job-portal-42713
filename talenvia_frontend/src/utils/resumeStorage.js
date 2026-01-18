import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getCurrentUserId } from "./profilePersistence";

/**
 * Supabase Storage integration for resume uploads.
 *
 * Bucket assumption (must exist in Supabase Storage):
 * - Bucket: resumes
 *
 * Storage object key convention (per-user, single file):
 * - <uid>/resume.<ext>
 *
 * IMPORTANT:
 * - Supabase Storage APIs expect a BUCKET-RELATIVE OBJECT KEY (e.g. "uid/resume.pdf")
 *   not a full URL, not "resumes/uid/resume.pdf", and not "/resumes/uid/resume.pdf".
 *
 * Notes:
 * - We use `upsert: true` so "upload" acts as replace.
 * - Helpers are safe-by-default (return {ok:false,...}, never throw).
 */

const RESUME_BUCKET = "resumes";

function sanitizeFileName(name) {
  return String(name || "")
    .trim()
    .replace(/[^\w.\-()+\s]/g, "_")
    .slice(0, 120);
}

function getExtensionFromFile(file) {
  const name = String(file?.name || "");
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "";
  const ext = name.slice(dot + 1).toLowerCase();
  if (!ext || ext.length > 10) return "";
  return ext;
}

function guessMimeType(file) {
  // Prefer browser-provided mime type; fallback to a common PDF type.
  const t = String(file?.type || "").trim();
  if (t) return t;
  return "application/pdf";
}

function normalizeSlashes(v) {
  return String(v || "").replace(/\\/g, "/");
}

function stripKnownPrefix(s, prefix) {
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}

/**
 * Accepts any "path-ish" input and returns a *bucket-relative* object key.
 * Examples:
 * - "123/resume.pdf"              -> "123/resume.pdf"
 * - "/123/resume.pdf"             -> "123/resume.pdf"
 * - "resumes/123/resume.pdf"      -> "123/resume.pdf"
 * - "https://..../resumes/123..." -> "123/resume.pdf"  (best-effort)
 */
function toBucketRelativeKey(maybePathOrUrl) {
  const raw = normalizeSlashes(String(maybePathOrUrl || "").trim());
  if (!raw) return "";

  // If it's a URL, try to take the pathname portion.
  let candidate = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      candidate = normalizeSlashes(decodeURIComponent(u.pathname || ""));
    }
  } catch {
    // ignore URL parsing errors; treat as a plain string.
  }

  // Remove query/hash if present (defensive)
  candidate = candidate.split("?")[0].split("#")[0];

  // Remove leading slashes
  candidate = candidate.replace(/^\/+/, "");

  // Remove bucket name prefix if present (user might have stored "resumes/uid/..")
  candidate = stripKnownPrefix(candidate, `${RESUME_BUCKET}/`);

  // Also handle common public URL shapes:
  // /storage/v1/object/public/resumes/<key>
  // /storage/v1/object/sign/resumes/<key>
  // /storage/v1/object/resumes/<key>
  candidate = candidate.replace(/^storage\/v1\/object\/(public|sign)?\/?/i, "");
  candidate = stripKnownPrefix(candidate, `${RESUME_BUCKET}/`);

  // Normalize repeated slashes
  candidate = candidate.replace(/\/{2,}/g, "/");

  return candidate;
}

function validateBucketRelativeKey({ key, userId, operation }) {
  const k = String(key || "").trim();

  // Basic presence
  if (!k) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: empty path. Expected "<uid>/resume.<ext>".`,
      },
    };
  }

  // Must NOT start with a slash
  if (k.startsWith("/")) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: leading "/" is not allowed. Expected "<uid>/resume.<ext>".`,
      },
    };
  }

  // Must NOT include the bucket name prefix
  if (k.startsWith(`${RESUME_BUCKET}/`)) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: do not include bucket name "${RESUME_BUCKET}/" in the path. Expected "<uid>/resume.<ext>".`,
      },
    };
  }

  // Must NOT be a URL
  if (/^https?:\/\//i.test(k)) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: received a URL, expected bucket-relative key "<uid>/resume.<ext>".`,
      },
    };
  }

  // Must NOT include traversal
  if (k.includes("..")) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: path traversal ("..") is not allowed.`,
      },
    };
  }

  // Require user prefix if we know it (prevents accidental cross-user access)
  if (userId && !k.startsWith(`${userId}/`)) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Refusing ${operation}: resume path is outside your account. Expected it to start with "${userId}/".`,
      },
    };
  }

  // Must be a two-part or deeper key ("uid/file")
  if (!k.includes("/")) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: expected "<uid>/resume.<ext>" but got "${k}".`,
      },
    };
  }

  // Disallow empty segments (e.g. "uid//resume.pdf")
  if (k.split("/").some((seg) => seg.length === 0)) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: contains empty path segments.`,
      },
    };
  }

  // Keep a reasonable length (Supabase supports long keys, but this avoids accidental massive strings)
  if (k.length > 512) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message: `Invalid resume path for ${operation}: path too long.`,
      },
    };
  }

  return { ok: true, key: k };
}

function mapSupabaseStorageError(operation, error) {
  const msg = String(error?.message || "Unknown error");
  const lower = msg.toLowerCase();

  // Provide a clearer hint for the common failure shown by the user.
  if (lower.includes("requested path is invalid")) {
    return {
      ok: false,
      reason: "invalid_path",
      error: {
        message:
          `Supabase Storage rejected the resume path as invalid during ${operation}. ` +
          `This usually happens when a full URL or a "bucket/path" string is passed instead of a bucket-relative key ` +
          `like "<uid>/resume.pdf". Please try again.`,
      },
    };
  }

  return { ok: false, reason: "error", error: { message: msg } };
}

// PUBLIC_INTERFACE
export async function uploadOrReplaceResume(file) {
  /** Uploads (or replaces) the current user's resume in Supabase Storage. Never throws. */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  if (!(file instanceof File)) {
    return { ok: false, reason: "invalid_file", error: { message: "No file selected." } };
  }

  // Basic validation: allow PDF + common doc formats.
  const allowedTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

  const mime = guessMimeType(file);
  if (!allowedTypes.has(mime)) {
    return {
      ok: false,
      reason: "invalid_file",
      error: { message: "Please upload a PDF or Word document (.pdf, .doc, .docx)." },
    };
  }

  // Limit size to keep UX reasonable (10MB).
  const maxBytes = 10 * 1024 * 1024;
  if (typeof file.size === "number" && file.size > maxBytes) {
    return { ok: false, reason: "invalid_file", error: { message: "File is too large (max 10MB)." } };
  }

  const ext = getExtensionFromFile(file) || (mime === "application/pdf" ? "pdf" : "doc");
  const key = `${userRes.userId}/resume.${ext}`;

  // Defensive validation before calling Supabase.
  const v = validateBucketRelativeKey({ key, userId: userRes.userId, operation: "upload" });
  if (!v.ok) return v;

  try {
    const { error } = await supabase.storage.from(RESUME_BUCKET).upload(v.key, file, {
      upsert: true,
      contentType: mime,
      cacheControl: "3600",
    });

    if (error) return mapSupabaseStorageError("upload", error);

    const { data } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(v.key);
    const publicUrl = data?.publicUrl || "";

    return {
      ok: true,
      resume: {
        bucket: RESUME_BUCKET,
        path: v.key, // IMPORTANT: this is the bucket-relative key
        url: publicUrl,
        fileName: sanitizeFileName(file.name),
        mimeType: mime,
        sizeBytes: typeof file.size === "number" ? file.size : null,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function deleteResumeByPath(path) {
  /** Deletes a resume from Supabase Storage by storage path. Never throws. */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  // Accept either a clean key, a "resumes/<key>", or even a URL (best-effort),
  // but ALWAYS convert to a bucket-relative key before calling Storage.
  const key = toBucketRelativeKey(path);

  if (!key) return { ok: true, deleted: false };

  const v = validateBucketRelativeKey({ key, userId: userRes.userId, operation: "delete" });
  if (!v.ok) return v;

  try {
    const { error } = await supabase.storage.from(RESUME_BUCKET).remove([v.key]);
    if (error) return mapSupabaseStorageError("delete", error);
    return { ok: true, deleted: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
