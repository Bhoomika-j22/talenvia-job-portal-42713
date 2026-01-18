import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Profile persistence helpers (Supabase-first, safe-by-default).
 *
 * This module implements CRUD wiring for the normalized schema documented in:
 * kavia-docs/CodeWiki/Specs/ArchitectureSpecs/profile-skills-supabase-sql-migration.sql.md
 *
 * Tables used:
 * - public.users (user_id PK references auth.users.id)
 * - public.skills (skill_id PK, unique lower(name))
 * - public.user_skills (user_id + skill_id unique, level)
 *
 * Notes:
 * - All functions are "safe by default": they never throw and return {ok:false,...} on failures.
 * - RLS is expected to be configured in Supabase (user_id = auth.uid()).
 */

// PUBLIC_INTERFACE
export async function getCurrentUserId() {
  /** Returns the current Supabase auth user id, or a safe error object. Never throws. */
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { ok: false, reason: "auth_error", error: { message: error.message } };
    const userId = data?.user?.id;
    if (!userId) return { ok: false, reason: "no_user" };
    return { ok: true, userId };
  } catch (e) {
    return { ok: false, reason: "auth_error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

function toSupabaseSkillLevel(level) {
  // UI uses "Beginner/Intermediate/Expert" while DB CHECK expects lowercase.
  const raw = String(level || "").trim().toLowerCase();
  if (raw === "beginner" || raw === "intermediate" || raw === "expert") return raw;
  return null;
}

function fromSupabaseSkillLevel(level) {
  const raw = String(level || "").trim().toLowerCase();
  if (raw === "beginner") return "Beginner";
  if (raw === "expert") return "Expert";
  // Default (also covers null/unknown)
  return "Intermediate";
}

function normalizeSkillName(name) {
  return String(name || "").trim();
}

function normalizeEmail(email) {
  return String(email || "").trim();
}

/**
 * Ensure the `public.users` row exists/updated for the given user.
 * Best-effort mapping from current UI profile object to DB columns.
 */
async function upsertUserRow(userId, profile) {
  const fullName = String(profile?.fullName || "").trim();
  const email = normalizeEmail(profile?.email);
  const phone = String(profile?.phone || "").trim();
  const profileSummary = String(profile?.bio ?? profile?.profile_summary ?? profile?.profileSummary ?? "").trim();

  // Optional fields in schema; keep as null when empty to avoid storing noise.
  const row = {
    user_id: userId,
    full_name: fullName || "Unnamed User",
    email: email || `user+${userId}@example.com`,
    phone_number: phone || null,
    profile_photo_url: profile?.profilePhotoUrl || profile?.profile_photo_url || null,
    resume_url: profile?.resume?.url || profile?.resume_url || null,
    profile_summary: profileSummary || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("users").upsert(row, { onConflict: "user_id" });
  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  return { ok: true };
}

/**
 * Fetch user_skills join rows with skill name.
 */
async function loadUserSkills(userId) {
  const { data, error } = await supabase
    .from("user_skills")
    .select(
      `
      user_skill_id,
      level,
      skills:skill_id (
        skill_id,
        name
      )
    `
    )
    .eq("user_id", userId);

  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  const rows = Array.isArray(data) ? data : [];

  const skills = rows
    .map((r) => {
      const skillName = r?.skills?.name;
      if (!skillName) return null;
      return { name: skillName, level: fromSupabaseSkillLevel(r?.level) };
    })
    .filter(Boolean);

  return { ok: true, skills };
}

/**
 * Upsert skill dictionary rows; returns map lower(name) -> skill_id.
 */
async function ensureSkillDictionary(skillNames) {
  const unique = Array.from(
    new Set(
      (skillNames || [])
        .map(normalizeSkillName)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => n.toLowerCase())
    )
  );

  if (unique.length === 0) return { ok: true, idByLowerName: new Map() };

  // Fetch any existing dictionary entries
  const { data: existing, error: existingError } = await supabase.from("skills").select("skill_id,name").in("name", unique);
  // Note: `.in("name", ...)` is case-sensitive; to handle case-insensitivity we also upsert below.
  if (existingError) return { ok: false, reason: "error", error: { message: existingError.message } };

  // Upsert desired dictionary entries (handles missing + standardizes)
  const toUpsert = unique.map((lower) => ({ name: lower }));
  const { error: upsertError } = await supabase.from("skills").upsert(toUpsert, { onConflict: "name" });
  if (upsertError) return { ok: false, reason: "error", error: { message: upsertError.message } };

  // Re-fetch by lower(name) to reliably obtain ids; use ilike list via OR.
  // Supabase doesn't offer "in ilike", so we do a broader fetch and filter client-side.
  const { data: after, error: afterError } = await supabase.from("skills").select("skill_id,name").limit(5000);
  if (afterError) return { ok: false, reason: "error", error: { message: afterError.message } };

  const idByLowerName = new Map();
  (Array.isArray(after) ? after : []).forEach((row) => {
    const n = String(row?.name || "").trim();
    if (!n) return;
    const lower = n.toLowerCase();
    if (unique.includes(lower)) {
      idByLowerName.set(lower, row.skill_id);
    }
  });

  return { ok: true, idByLowerName };
}

/**
 * Sync user_skills to match the provided array of {name, level}.
 * - Inserts/updates skills present in payload
 * - Deletes skills removed from payload
 */
async function syncUserSkills(userId, skills) {
  const input = Array.isArray(skills) ? skills : [];
  const desired = input
    .map((s) => ({ name: normalizeSkillName(s?.name), level: s?.level }))
    .filter((s) => s.name);

  const desiredLower = new Set(desired.map((s) => s.name.toLowerCase()));
  const dictRes = await ensureSkillDictionary(desired.map((s) => s.name));
  if (!dictRes.ok) return dictRes;

  // Current join rows (with skill_id) to compute deletions
  const { data: currentRows, error: currentErr } = await supabase
    .from("user_skills")
    .select(
      `
      user_skill_id,
      skill_id,
      skills:skill_id ( name )
    `
    )
    .eq("user_id", userId);

  if (currentErr) return { ok: false, reason: "error", error: { message: currentErr.message } };
  const current = Array.isArray(currentRows) ? currentRows : [];

  const toDeleteSkillIds = current
    .map((r) => ({ skill_id: r?.skill_id, name: r?.skills?.name }))
    .filter((r) => r.skill_id && r.name)
    .filter((r) => !desiredLower.has(String(r.name).toLowerCase()))
    .map((r) => r.skill_id);

  // Upsert join rows for desired skills
  const joinUpserts = desired
    .map((s) => {
      const skillId = dictRes.idByLowerName.get(s.name.toLowerCase());
      if (!skillId) return null;
      return {
        user_id: userId,
        skill_id: skillId,
        level: toSupabaseSkillLevel(s.level),
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);

  if (joinUpserts.length) {
    const { error: joinErr } = await supabase.from("user_skills").upsert(joinUpserts, { onConflict: "user_id,skill_id" });
    if (joinErr) return { ok: false, reason: "error", error: { message: joinErr.message } };
  }

  // Delete removed join rows
  if (toDeleteSkillIds.length) {
    const { error: delErr } = await supabase.from("user_skills").delete().eq("user_id", userId).in("skill_id", toDeleteSkillIds);
    if (delErr) return { ok: false, reason: "error", error: { message: delErr.message } };
  }

  return { ok: true };
}

// PUBLIC_INTERFACE
export async function loadProfileAndSkillsFromSupabase() {
  /**
   * Loads profile + skills for the current user from Supabase normalized tables.
   *
   * Returns:
   * - { ok:true, found:true, payload:{ profile:any, skills:any[] } }
   * - { ok:true, found:false } when no profile row exists yet
   * - { ok:false, reason:'not_configured'|'no_user'|'error', error?:{message} }
   */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("user_id,full_name,email,phone_number,profile_photo_url,resume_url,profile_summary")
      .eq("user_id", userRes.userId)
      .maybeSingle();

    if (userErr) return { ok: false, reason: "error", error: { message: userErr.message } };

    if (!userRow) {
      // No profile row yet: treat as not found (skills are meaningless without a user row in this schema).
      return { ok: true, found: false };
    }

    const skillsRes = await loadUserSkills(userRes.userId);
    if (!skillsRes.ok) return skillsRes;

    // Map DB row -> UI profile shape used across Talenvia.
    const profile = {
      fullName: userRow.full_name || "",
      email: userRow.email || "",
      phone: userRow.phone_number || "",
      bio: userRow.profile_summary || "",
      profilePhotoUrl: userRow.profile_photo_url || "",
      // Preserve resume shape expected by the page if possible; if only URL exists, keep minimal info.
      resume: userRow.resume_url ? { url: userRow.resume_url } : null,
    };

    return {
      ok: true,
      found: true,
      payload: {
        profile,
        skills: skillsRes.skills,
      },
    };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function saveProfileAndSkillsToSupabase(payload) {
  /**
   * Upserts profile + skills for the current user into Supabase normalized tables.
   *
   * payload:
   * - { profile: object, skills: array }
   *
   * Returns:
   * - { ok:true }
   * - { ok:false, reason:'not_configured'|'no_user'|'error', error?:{message} }
   */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };

  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  const safeProfile = payload?.profile && typeof payload.profile === "object" ? payload.profile : {};
  const safeSkills = Array.isArray(payload?.skills) ? payload.skills : [];

  try {
    const upUser = await upsertUserRow(userRes.userId, safeProfile);
    if (!upUser.ok) return upUser;

    const sync = await syncUserSkills(userRes.userId, safeSkills);
    if (!sync.ok) return sync;

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
