import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { getCurrentUserId } from "./profilePersistence";

/**
 * Supabase Storage integration for resume uploads.
 *
 * Bucket assumption (must exist in Supabase Storage):
 * - Bucket: resumes
 *
 * Storage path convention (per-user, single file):
 * - resumes/{userId}/resume.{ext}
 *
 * Notes:
 * - We use `upsert: true` so "upload" acts as replace.
 * - We store metadata in the existing `user_profiles.profile.resume` object.
 * - If Supabase isn't configured, helpers return { ok:false, reason:'not_configured' } and never throw.
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
  const path = `${userRes.userId}/resume.${ext}`;

  try {
    const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
      upsert: true,
      contentType: mime,
      cacheControl: "3600",
    });

    if (error) return { ok: false, reason: "error", error: { message: error.message } };

    const { data } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";

    return {
      ok: true,
      resume: {
        bucket: RESUME_BUCKET,
        path,
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

  const safePath = String(path || "").trim();
  if (!safePath) return { ok: true, deleted: false };

  // Safety: only allow deleting within the current user's prefix.
  if (!safePath.startsWith(`${userRes.userId}/`)) {
    return { ok: false, reason: "invalid_path", error: { message: "Refusing to delete a path outside your account." } };
  }

  try {
    const { error } = await supabase.storage.from(RESUME_BUCKET).remove([safePath]);
    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true, deleted: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
