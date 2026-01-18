import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

/**
 * Profile persistence helpers (Supabase-first, safe-by-default).
 *
 * Notes:
 * - All functions are "safe by default": they never throw and return {ok:false,...} on failures.
 * - RLS is expected to be configured in Supabase (user_id = auth.uid()).
 *
 * Tables used (current schema):
 * - public.users
 * - public.user_skills + public.skills
 * - public.education
 * - public.projects
 * - public.languages
 * - public.career_preferences
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

function safeTrim(value) {
  return String(value ?? "").trim();
}

function parseLanguagesCsv(csv) {
  const raw = String(csv || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeProjectTechnologies(value) {
  // DB allows text or JSON; we store text to avoid schema mismatch.
  // Accept array or string and serialize to a human-friendly string.
  if (Array.isArray(value)) {
    return value.map((v) => safeTrim(v)).filter(Boolean).join(", ") || null;
  }
  const s = safeTrim(value);
  return s || null;
}

function parseExpectedSalaryToNumber(value) {
  const raw = safeTrim(value);
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
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

  // Re-fetch by lower(name) to reliably obtain ids; use broad fetch and filter client-side.
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

async function loadEducationRows(userId) {
  const { data, error } = await supabase
    .from("education")
    .select("id,degree,school_or_college,year_of_passing,percentage_or_grade,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

async function loadProjectRows(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("id,project_name,description,technologies,link,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

async function loadLanguageRows(userId) {
  const { data, error } = await supabase
    .from("languages")
    .select("id,language_name,proficiency,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

async function loadCareerPreferencesRow(userId) {
  const { data, error } = await supabase
    .from("career_preferences")
    .select(
      "id,preferred_location,preferred_role,preferred_salary,preferred_shift,job_type,employment_type,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) return { ok: false, reason: "error", error: { message: error.message } };
  return { ok: true, row: data || null };
}

async function replaceAllEducation(userId, educationItems) {
  const { error: delErr } = await supabase.from("education").delete().eq("user_id", userId);
  if (delErr) return { ok: false, reason: "error", error: { message: delErr.message } };

  const rows = (Array.isArray(educationItems) ? educationItems : [])
    .map((e) => ({
      user_id: userId,
      degree: safeTrim(e?.degree) || null,
      school_or_college: safeTrim(e?.schoolOrCollege ?? e?.school_or_college) || null,
      year_of_passing: e?.yearOfPassing ?? e?.year_of_passing ?? null,
      percentage_or_grade: safeTrim(e?.percentageOrGrade ?? e?.percentage_or_grade) || null,
    }))
    .filter((r) => r.degree || r.school_or_college || r.year_of_passing || r.percentage_or_grade);

  if (!rows.length) return { ok: true };

  const { error: insErr } = await supabase.from("education").insert(rows);
  if (insErr) return { ok: false, reason: "error", error: { message: insErr.message } };
  return { ok: true };
}

async function replaceAllProjects(userId, projects) {
  const { error: delErr } = await supabase.from("projects").delete().eq("user_id", userId);
  if (delErr) return { ok: false, reason: "error", error: { message: delErr.message } };

  const rows = (Array.isArray(projects) ? projects : [])
    .map((p) => ({
      user_id: userId,
      project_name: safeTrim(p?.title ?? p?.projectName ?? p?.project_name) || null,
      description: safeTrim(p?.description) || null,
      technologies: normalizeProjectTechnologies(p?.technologies),
      link: safeTrim(p?.link) || null,
    }))
    .filter((r) => r.project_name || r.description || r.technologies || r.link);

  if (!rows.length) return { ok: true };

  const { error: insErr } = await supabase.from("projects").insert(rows);
  if (insErr) return { ok: false, reason: "error", error: { message: insErr.message } };
  return { ok: true };
}

async function replaceAllLanguages(userId, languageItems) {
  const { error: delErr } = await supabase.from("languages").delete().eq("user_id", userId);
  if (delErr) return { ok: false, reason: "error", error: { message: delErr.message } };

  const rows = (Array.isArray(languageItems) ? languageItems : [])
    .map((l) => ({
      user_id: userId,
      language_name: safeTrim(l?.language ?? l?.name ?? l?.language_name) || null,
      proficiency: safeTrim(l?.proficiency) || null,
    }))
    .filter((r) => r.language_name);

  if (!rows.length) return { ok: true };

  const { error: insErr } = await supabase.from("languages").insert(rows);
  if (insErr) return { ok: false, reason: "error", error: { message: insErr.message } };
  return { ok: true };
}

async function upsertCareerPreferences(userId, prefs) {
  // Keep a single row per user (delete existing and insert fresh to avoid schema mismatch on constraints)
  const { error: delErr } = await supabase.from("career_preferences").delete().eq("user_id", userId);
  if (delErr) return { ok: false, reason: "error", error: { message: delErr.message } };

  const row = {
    user_id: userId,
    preferred_location: safeTrim(prefs?.preferredLocation ?? prefs?.preferred_location) || null,
    preferred_role: safeTrim(prefs?.preferredRole ?? prefs?.preferred_role) || null,
    preferred_salary: parseExpectedSalaryToNumber(prefs?.expectedSalary ?? prefs?.preferred_salary),
    preferred_shift: safeTrim(prefs?.shift ?? prefs?.preferred_shift) || null,
    job_type: safeTrim(prefs?.jobType ?? prefs?.job_type) || null,
    employment_type: safeTrim(prefs?.employmentType ?? prefs?.employment_type) || null,
  };

  // If the user cleared everything, just keep it deleted (no insert).
  const hasAny =
    row.preferred_location ||
    row.preferred_role ||
    row.preferred_salary !== null ||
    row.preferred_shift ||
    row.job_type ||
    row.employment_type;

  if (!hasAny) return { ok: true };

  const { error: insErr } = await supabase.from("career_preferences").insert(row);
  if (insErr) return { ok: false, reason: "error", error: { message: insErr.message } };
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function loadProfileAndSkillsFromSupabase() {
  /**
   * Loads profile + skills + profile-related tables for the current user from Supabase.
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
      // No profile row yet: treat as not found.
      return { ok: true, found: false };
    }

    const [skillsRes, eduRes, projRes, langRes, prefRes] = await Promise.all([
      loadUserSkills(userRes.userId),
      loadEducationRows(userRes.userId),
      loadProjectRows(userRes.userId),
      loadLanguageRows(userRes.userId),
      loadCareerPreferencesRow(userRes.userId),
    ]);

    const firstBad = [skillsRes, eduRes, projRes, langRes, prefRes].find((r) => !r.ok);
    if (firstBad) return firstBad;

    // Map DB -> UI profile shape used across Talenvia.
    const profile = {
      fullName: userRow.full_name || "",
      email: userRow.email || "",
      phone: userRow.phone_number || "",
      bio: userRow.profile_summary || "",
      profilePhotoUrl: userRow.profile_photo_url || "",
      resume: userRow.resume_url ? { url: userRow.resume_url } : null,

      // New sections (UI expects some of these as "legacy"/simple shapes; keep compatible)
      // Education: existing UI currently stores {tenth, twelfth, graduation} as strings.
      // We map latest 3 rows (if present) into those fields, otherwise leave blank.
      education: (() => {
        const rows = eduRes.rows || [];
        if (!rows.length) return undefined;

        const toLine = (r) => {
          const parts = [];
          if (r?.degree) parts.push(r.degree);
          if (r?.school_or_college) parts.push(r.school_or_college);
          if (r?.year_of_passing) parts.push(String(r.year_of_passing));
          if (r?.percentage_or_grade) parts.push(String(r.percentage_or_grade));
          return parts.filter(Boolean).join(" • ");
        };

        // Preserve existing UI fields; we just show 3 most recent as tenth/twelfth/graduation
        return {
          tenth: toLine(rows[2] || rows[rows.length - 1] || {}),
          twelfth: toLine(rows[1] || {}),
          graduation: toLine(rows[0] || {}),
        };
      })(),

      // Projects: existing UI expects array with {title, description}
      projects: (projRes.rows || []).map((r) => ({
        id: r.id,
        title: r.project_name || "",
        description: r.description || "",
        technologies: r.technologies || "",
        link: r.link || "",
      })),

      // Languages: existing UI stores a comma-separated string. We join rows for backward compatibility.
      languages: (langRes.rows || [])
        .map((r) => r.language_name)
        .filter(Boolean)
        .join(", "),

      // Career preferences: existing UI expects careerPreferences object with these keys
      careerPreferences: prefRes.row
        ? {
            id: prefRes.row.id,
            preferredLocation: prefRes.row.preferred_location || "",
            preferredRole: prefRes.row.preferred_role || "",
            expectedSalary:
              prefRes.row.preferred_salary === null || prefRes.row.preferred_salary === undefined
                ? ""
                : String(prefRes.row.preferred_salary),
            shift: prefRes.row.preferred_shift || "",
            jobType: prefRes.row.job_type || "",
            employmentType: prefRes.row.employment_type || "",
          }
        : undefined,
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
   * Upserts profile + skills + related table data for the current user into Supabase.
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

    // Education:
    // UI currently stores a simple object {tenth, twelfth, graduation}.
    // We map those 3 strings into 3 education rows to satisfy CRUD, even if the
    // mapping isn't perfect. (Better UI can later become a real list editor.)
    const eduObj = safeProfile?.education;
    const eduItems = eduObj
      ? [
          {
            degree: safeTrim(eduObj.graduation) ? "Graduation" : "",
            schoolOrCollege: safeTrim(eduObj.graduation),
            yearOfPassing: null,
            percentageOrGrade: null,
          },
          {
            degree: safeTrim(eduObj.twelfth) ? "12th" : "",
            schoolOrCollege: safeTrim(eduObj.twelfth),
            yearOfPassing: null,
            percentageOrGrade: null,
          },
          {
            degree: safeTrim(eduObj.tenth) ? "10th" : "",
            schoolOrCollege: safeTrim(eduObj.tenth),
            yearOfPassing: null,
            percentageOrGrade: null,
          },
        ].filter((x) => x.schoolOrCollege)
      : [];

    const eduRes = await replaceAllEducation(userRes.userId, eduItems);
    if (!eduRes.ok) return eduRes;

    // Projects: profile.projects array -> projects rows
    const projRes = await replaceAllProjects(userRes.userId, Array.isArray(safeProfile?.projects) ? safeProfile.projects : []);
    if (!projRes.ok) return projRes;

    // Languages: profile.languages string (csv) -> languages rows (default proficiency)
    const langCsv = safeProfile?.languages;
    const langItems = parseLanguagesCsv(langCsv).map((name) => ({ language: name, proficiency: "Read+Write+Speak" }));
    const langRes = await replaceAllLanguages(userRes.userId, langItems);
    if (!langRes.ok) return langRes;

    // Career preferences: profile.careerPreferences -> career_preferences row
    const prefRes = await upsertCareerPreferences(userRes.userId, safeProfile?.careerPreferences || null);
    if (!prefRes.ok) return prefRes;

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function deleteEducationFromSupabase() {
  /** Deletes all education rows for the current user (safe-by-default). */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };
  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { error } = await supabase.from("education").delete().eq("user_id", userRes.userId);
    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function deleteProjectsFromSupabase() {
  /** Deletes all project rows for the current user (safe-by-default). */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };
  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { error } = await supabase.from("projects").delete().eq("user_id", userRes.userId);
    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function deleteLanguagesFromSupabase() {
  /** Deletes all language rows for the current user (safe-by-default). */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };
  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { error } = await supabase.from("languages").delete().eq("user_id", userRes.userId);
    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}

// PUBLIC_INTERFACE
export async function deleteCareerPreferencesFromSupabase() {
  /** Deletes career preferences row(s) for the current user (safe-by-default). */
  if (!isSupabaseConfigured() || !supabase) return { ok: false, reason: "not_configured" };
  const userRes = await getCurrentUserId();
  if (!userRes.ok) return userRes;

  try {
    const { error } = await supabase.from("career_preferences").delete().eq("user_id", userRes.userId);
    if (error) return { ok: false, reason: "error", error: { message: error.message } };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", error: { message: e instanceof Error ? e.message : String(e) } };
  }
}
