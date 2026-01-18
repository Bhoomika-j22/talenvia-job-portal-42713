import React, { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import EditableSection from "../components/EditableSection";

/**
 * This page is the unified Profile & Skills screen.
 * It is based on the user-provided ProfileSkills component, adapted to:
 * - use Talenvia's existing Violet Dreams CSS utility classes (page/card/input/btn/primary-btn)
 * - persist data in the app's existing local state (AppState)
 *
 * Enhancements:
 * - Client-side validation with inline error messages
 * - Prevent invalid submissions on "Save Profile" and "Add skill"
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Very tolerant phone validation:
 * - allow +, digits, spaces, hyphens, parentheses
 * - require at least 7 digits total
 */
const PHONE_ALLOWED_CHARS_REGEX = /^[0-9+()\-\s.]*$/;

// PUBLIC_INTERFACE
export default function ProfileAndSkillsPage() {
  /** Unified Profile & Skills page based on the provided ProfileSkills component, with inline validation. */
  const { state, actions } = useAppState();

  // BASIC DETAILS + SUMMARY drafts (persist on Save Profile)
  const [profileDraft, setProfileDraft] = useState(() => ({
    fullName: state.profile.fullName || "",
    email: state.profile.email || "",
    // The provided component includes phone; Talenvia default profile doesn't.
    // We'll store it inside profile as an extra field (safe in JS objects).
    phone: state.profile.phone || "",
    location: state.profile.location || "",
    bio: state.profile.bio || "",
  }));

  // Track touched state to avoid showing errors too early
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    location: false,
    bio: false,
    newSkill: false,
  });

  // Inline errors for profile fields + skill input + career preferences
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    newSkill: "",

    languages: "",

    prefLocation: "",
    prefRole: "",
    prefSalary: "",
    prefShift: "",
    prefJobType: "",
    prefEmploymentType: "",
  });

  // KEY SKILLS (persist via AppState skills list)
  const [newSkill, setNewSkill] = useState("");
  const existingSkillNamesLower = useMemo(
    () => new Set(state.skills.map((s) => String(s.name || "").toLowerCase())),
    [state.skills]
  );

  // LANGUAGES (persisted locally into profile.languages as a string; UI-only but saved to local state like other sections)
  const [languagesDraft, setLanguagesDraft] = useState(() => state.profile.languages || "");
  const [languagesTouched, setLanguagesTouched] = useState(false);

  // CAREER PREFERENCES (UI-only but should still behave like other editable sections)
  const [careerPrefDraft, setCareerPrefDraft] = useState(() => ({
    preferredLocation: state.profile.careerPreferences?.preferredLocation || "",
    preferredRole: state.profile.careerPreferences?.preferredRole || "",
    expectedSalary: state.profile.careerPreferences?.expectedSalary || "",
    shift: state.profile.careerPreferences?.shift || "",
    jobType: state.profile.careerPreferences?.jobType || "",
    employmentType: state.profile.careerPreferences?.employmentType || "",
  }));

  const [careerPrefTouched, setCareerPrefTouched] = useState({
    preferredLocation: false,
    preferredRole: false,
    expectedSalary: false,
    shift: false,
    jobType: false,
    employmentType: false,
  });

  // EDUCATION (persisted locally into profile.education)
  const [educationDraft, setEducationDraft] = useState(() => ({
    tenth: state.profile.education?.tenth || "",
    twelfth: state.profile.education?.twelfth || "",
    graduation: state.profile.education?.graduation || "",
  }));

  const [educationTouched, setEducationTouched] = useState({
    tenth: false,
    twelfth: false,
    graduation: false,
  });

  // PROJECTS (persisted locally into profile.projects)
  // We support a simple single-project draft to match the existing UI,
  // but store it as an array (future-friendly).
  const [projectDraft, setProjectDraft] = useState(() => ({
    title: state.profile.projects?.[0]?.title || "",
    description: state.profile.projects?.[0]?.description || "",
  }));

  const [projectTouched, setProjectTouched] = useState({
    title: false,
    description: false,
  });

  const errorId = (name) => `ps-err-${name}`;

  const getInputClassName = (fieldName) => {
    const hasError = Boolean(errors[fieldName]);
    // Keep base classes consistent with existing theme; only adjust border color when invalid.
    return `input${hasError ? " input-invalid" : ""}`;
  };

  const getTextareaClassName = (fieldName) => {
    const hasError = Boolean(errors[fieldName]);
    return `textarea${hasError ? " input-invalid" : ""}`;
  };

  const validateProfile = (draft) => {
    const next = { fullName: "", email: "", phone: "", location: "", bio: "", newSkill: errors.newSkill || "" };

    // Required fields (based on typical "Basic Details" expectations)
    if (!draft.fullName.trim()) next.fullName = "Full name is required.";
    if (!draft.email.trim()) next.email = "Email is required.";
    if (!draft.location.trim()) next.location = "Location is required.";

    // Email format
    if (draft.email.trim() && !EMAIL_REGEX.test(draft.email.trim())) {
      next.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    // Phone is optional, but if provided, validate basic format & digit count
    const phoneRaw = draft.phone.trim();
    if (phoneRaw) {
      if (!PHONE_ALLOWED_CHARS_REGEX.test(phoneRaw)) {
        next.phone = "Phone number can contain only digits, spaces, +, -, ( ), and dots.";
      } else {
        const digits = phoneRaw.replace(/\D/g, "");
        if (digits.length < 7) next.phone = "Phone number looks too short.";
        if (digits.length > 15) next.phone = "Phone number looks too long.";
      }
    }

    // Bio optional but keep it reasonable if present
    if (draft.bio && draft.bio.trim().length > 800) {
      next.bio = "Summary is too long (max 800 characters).";
    }

    return next;
  };

  const validateNewSkill = (skillValue) => {
    const name = skillValue.trim();
    if (!name) return "Skill name is required.";
    if (name.length > 40) return "Skill name is too long (max 40 characters).";
    if (existingSkillNamesLower.has(name.toLowerCase())) return "That skill already exists.";
    // Basic allowed characters (letters, numbers, spaces, +, #, ., -, /)
    if (!/^[\w\s+#./-]+$/.test(name)) return "Skill contains unsupported characters.";
    return "";
  };

  const validateCareerPreferences = (draft) => {
    // Keep these validations practical and inline:
    // - preferredLocation, preferredRole required (mirrors profile required fields)
    // - expectedSalary optional but must be a reasonable numeric value if provided
    // - selects must be chosen (not empty)
    const next = {
      prefLocation: "",
      prefRole: "",
      prefSalary: "",
      prefShift: "",
      prefJobType: "",
      prefEmploymentType: "",
    };

    if (!draft.preferredLocation.trim()) next.prefLocation = "Preferred location is required.";
    if (!draft.preferredRole.trim()) next.prefRole = "Preferred role is required.";

    const salaryRaw = String(draft.expectedSalary || "").trim();
    if (salaryRaw) {
      // Allow digits and separators/units; extract digits to validate magnitude.
      const digits = salaryRaw.replace(/[^\d]/g, "");
      if (!digits) {
        next.prefSalary = "Expected salary should include a number.";
      } else {
        const n = Number(digits);
        if (Number.isNaN(n)) next.prefSalary = "Expected salary is invalid.";
        if (n < 1000) next.prefSalary = "Expected salary looks too low.";
        if (n > 100000000) next.prefSalary = "Expected salary looks too high.";
      }
    }

    if (!draft.shift) next.prefShift = "Shift is required.";
    if (!draft.jobType) next.prefJobType = "Job type is required.";
    if (!draft.employmentType) next.prefEmploymentType = "Employment type is required.";

    return next;
  };

  const validateEducation = (draft) => {
    // Simple, consistent required-field validation for education.
    const next = { edu10: "", edu12: "", eduGrad: "" };

    if (!draft.tenth.trim()) next.edu10 = "10th details are required.";
    if (!draft.twelfth.trim()) next.edu12 = "12th details are required.";
    if (!draft.graduation.trim()) next.eduGrad = "Graduation details are required.";

    // Keep inputs reasonable without forcing strict formats
    if (draft.tenth.trim().length > 120) next.edu10 = "10th details are too long (max 120 chars).";
    if (draft.twelfth.trim().length > 120) next.edu12 = "12th details are too long (max 120 chars).";
    if (draft.graduation.trim().length > 160) next.eduGrad = "Graduation details are too long (max 160 chars).";

    return next;
  };

  const validateProject = (draft) => {
    // Inline validation pattern consistent with other sections:
    // - Title required
    // - Description required + max length
    const next = { projectTitle: "", projectDescription: "" };

    if (!draft.title.trim()) next.projectTitle = "Project title is required.";
    if (!draft.description.trim()) next.projectDescription = "Project description is required.";

    if (draft.title.trim().length > 80) next.projectTitle = "Project title is too long (max 80 characters).";
    if (draft.description.trim().length > 1000) next.projectDescription = "Project description is too long (max 1000 characters).";

    return next;
  };

  const validateLanguages = (value) => {
    // Expect comma-separated list, minimum 1 language.
    // Keep permissive characters to allow things like "Portuguese (BR)".
    const raw = String(value || "").trim();
    if (!raw) return "Please enter at least one language (comma-separated).";
    if (raw.length > 120) return "Languages is too long (max 120 characters).";

    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length === 0) return "Please enter at least one language.";
    if (parts.length > 10) return "Please keep it to 10 languages or fewer.";
    if (parts.some((p) => p.length > 30)) return "Each language should be 30 characters or fewer.";

    // Basic allowed characters: letters, numbers, spaces, common punctuation
    if (!/^[\p{L}\p{N}\s,.'()/+-]+$/u.test(raw)) return "Languages contains unsupported characters.";

    return "";
  };

  const markTouched = (fieldName) => {
    setTouched((p) => ({ ...p, [fieldName]: true }));
  };

  const markCareerPrefTouched = (fieldName) => {
    setCareerPrefTouched((p) => ({ ...p, [fieldName]: true }));
  };

  const markEducationTouched = (fieldName) => {
    setEducationTouched((p) => ({ ...p, [fieldName]: true }));
  };

  const markProjectTouched = (fieldName) => {
    setProjectTouched((p) => ({ ...p, [fieldName]: true }));
  };

  const updateProfileField = (fieldName, value) => {
    setProfileDraft((p) => ({ ...p, [fieldName]: value }));

    // Live-validate *after* user interacted with the field.
    setErrors((prev) => {
      const maybeNext = { ...prev };
      const nextProfileErrors = validateProfile({ ...profileDraft, [fieldName]: value });

      // Only update the single field's error here to avoid surprising updates in other fields.
      maybeNext[fieldName] = nextProfileErrors[fieldName] || "";
      return maybeNext;
    });
  };

  const updateCareerPrefField = (fieldName, value) => {
    setCareerPrefDraft((p) => ({ ...p, [fieldName]: value }));

    // Live-validate only the corresponding error field, after touch.
    setErrors((prev) => {
      const next = { ...prev };
      const nextPrefErrors = validateCareerPreferences({ ...careerPrefDraft, [fieldName]: value });

      if (fieldName === "preferredLocation") next.prefLocation = nextPrefErrors.prefLocation || "";
      if (fieldName === "preferredRole") next.prefRole = nextPrefErrors.prefRole || "";
      if (fieldName === "expectedSalary") next.prefSalary = nextPrefErrors.prefSalary || "";
      if (fieldName === "shift") next.prefShift = nextPrefErrors.prefShift || "";
      if (fieldName === "jobType") next.prefJobType = nextPrefErrors.prefJobType || "";
      if (fieldName === "employmentType") next.prefEmploymentType = nextPrefErrors.prefEmploymentType || "";

      return next;
    });
  };

  const updateEducationField = (fieldName, value) => {
    setEducationDraft((p) => ({ ...p, [fieldName]: value }));

    // Live-validate only the corresponding error field (consistent with other sections)
    setErrors((prev) => {
      const next = { ...prev };
      const nextEduErrors = validateEducation({ ...educationDraft, [fieldName]: value });

      if (fieldName === "tenth") next.edu10 = nextEduErrors.edu10 || "";
      if (fieldName === "twelfth") next.edu12 = nextEduErrors.edu12 || "";
      if (fieldName === "graduation") next.eduGrad = nextEduErrors.eduGrad || "";

      return next;
    });
  };

  const updateProjectField = (fieldName, value) => {
    setProjectDraft((p) => ({ ...p, [fieldName]: value }));

    // Live-validate only the corresponding error field, consistent with other sections.
    setErrors((prev) => {
      const next = { ...prev };
      const nextProjectErrors = validateProject({ ...projectDraft, [fieldName]: value });

      if (fieldName === "title") next.projectTitle = nextProjectErrors.projectTitle || "";
      if (fieldName === "description") next.projectDescription = nextProjectErrors.projectDescription || "";

      return next;
    });
  };

  const addSkill = () => {
    // Mark as touched to show inline error if invalid
    markTouched("newSkill");

    const err = validateNewSkill(newSkill);
    setErrors((p) => ({ ...p, newSkill: err }));

    if (err) return;

    const name = newSkill.trim();

    // The user-provided component does not include a level; we default to Intermediate.
    actions.addSkill({ name, level: "Intermediate" });
    setNewSkill("");
    setTouched((p) => ({ ...p, newSkill: false }));
    setErrors((p) => ({ ...p, newSkill: "" }));
  };

  const removeSkill = (skillName) => {
    actions.removeSkill(skillName);
  };

  const saveProfile = () => {
    // Mark all profile fields as touched to reveal all errors if submission fails.
    setTouched((p) => ({ ...p, fullName: true, email: true, phone: true, location: true, bio: true }));

    const nextErrors = validateProfile(profileDraft);
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    const hasAnyError = Object.values(nextErrors).some(Boolean);
    if (hasAnyError) {
      actions.pushToast({
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Some profile details are missing or invalid.",
      });
      return;
    }

    actions.updateProfile({
      fullName: profileDraft.fullName.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
      location: profileDraft.location.trim(),
      bio: profileDraft.bio,
    });
  };

  const resetProfile = () => {
    setProfileDraft({
      fullName: state.profile.fullName || "",
      email: state.profile.email || "",
      phone: state.profile.phone || "",
      location: state.profile.location || "",
      bio: state.profile.bio || "",
    });
    setTouched({
      fullName: false,
      email: false,
      phone: false,
      location: false,
      bio: false,
      newSkill: touched.newSkill,
    });
    setErrors((p) => ({ ...p, fullName: "", email: "", phone: "", location: "", bio: "" }));
  };

  const saveCareerPreferences = () => {
    // Mark all as touched so errors show if invalid.
    setCareerPrefTouched({
      preferredLocation: true,
      preferredRole: true,
      expectedSalary: true,
      shift: true,
      jobType: true,
      employmentType: true,
    });

    const nextErrors = validateCareerPreferences(careerPrefDraft);
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    const hasAnyError = Object.values(nextErrors).some(Boolean);
    if (hasAnyError) {
      actions.pushToast({
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Some career preference fields are missing or invalid.",
      });
      return;
    }

    // Persist into profile as an extra field; AppState already merges profile patches safely.
    actions.updateProfile({
      careerPreferences: {
        preferredLocation: careerPrefDraft.preferredLocation.trim(),
        preferredRole: careerPrefDraft.preferredRole.trim(),
        expectedSalary: String(careerPrefDraft.expectedSalary || "").trim(),
        shift: careerPrefDraft.shift,
        jobType: careerPrefDraft.jobType,
        employmentType: careerPrefDraft.employmentType,
      },
    });
  };

  const resetCareerPreferences = () => {
    setCareerPrefDraft({
      preferredLocation: state.profile.careerPreferences?.preferredLocation || "",
      preferredRole: state.profile.careerPreferences?.preferredRole || "",
      expectedSalary: state.profile.careerPreferences?.expectedSalary || "",
      shift: state.profile.careerPreferences?.shift || "",
      jobType: state.profile.careerPreferences?.jobType || "",
      employmentType: state.profile.careerPreferences?.employmentType || "",
    });
    setCareerPrefTouched({
      preferredLocation: false,
      preferredRole: false,
      expectedSalary: false,
      shift: false,
      jobType: false,
      employmentType: false,
    });
    setErrors((p) => ({
      ...p,
      prefLocation: "",
      prefRole: "",
      prefSalary: "",
      prefShift: "",
      prefJobType: "",
      prefEmploymentType: "",
    }));
  };

  const saveEducation = () => {
    // Mark all as touched so errors show if invalid.
    setEducationTouched({ tenth: true, twelfth: true, graduation: true });

    const nextErrors = validateEducation(educationDraft);
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    const hasAnyError = Object.values(nextErrors).some(Boolean);
    if (hasAnyError) {
      actions.pushToast({
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Some education fields are missing or invalid.",
      });
      return;
    }

    actions.updateProfile({
      education: {
        tenth: educationDraft.tenth.trim(),
        twelfth: educationDraft.twelfth.trim(),
        graduation: educationDraft.graduation.trim(),
      },
    });
  };

  const resetEducation = () => {
    setEducationDraft({
      tenth: state.profile.education?.tenth || "",
      twelfth: state.profile.education?.twelfth || "",
      graduation: state.profile.education?.graduation || "",
    });
    setEducationTouched({ tenth: false, twelfth: false, graduation: false });
    setErrors((p) => ({ ...p, edu10: "", edu12: "", eduGrad: "" }));
  };

  const saveProject = () => {
    setProjectTouched({ title: true, description: true });

    const nextErrors = validateProject(projectDraft);
    setErrors((prev) => ({ ...prev, ...nextErrors }));

    const hasAnyError = Object.values(nextErrors).some(Boolean);
    if (hasAnyError) {
      actions.pushToast({
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Some project fields are missing or invalid.",
      });
      return;
    }

    actions.updateProfile({
      projects: [
        {
          title: projectDraft.title.trim(),
          description: projectDraft.description.trim(),
        },
      ],
    });
  };

  const resetProject = () => {
    setProjectDraft({
      title: state.profile.projects?.[0]?.title || "",
      description: state.profile.projects?.[0]?.description || "",
    });
    setProjectTouched({ title: false, description: false });
    setErrors((p) => ({ ...p, projectTitle: "", projectDescription: "" }));
  };

  const saveLanguages = () => {
    setLanguagesTouched(true);

    const err = validateLanguages(languagesDraft);
    setErrors((p) => ({ ...p, languages: err }));

    if (err) {
      actions.pushToast({
        type: "error",
        title: "Please fix the highlighted fields",
        description: "Languages is missing or invalid.",
      });
      return;
    }

    actions.updateProfile({
      languages: String(languagesDraft || "").trim(),
    });
  };

  const resetLanguages = () => {
    setLanguagesDraft(state.profile.languages || "");
    setLanguagesTouched(false);
    setErrors((p) => ({ ...p, languages: "" }));
  };

  return (
    <section className="page">
      {/* Local inline style for invalid state (kept scoped + minimal, no new CSS file needed) */}
      <style>{`
        .input-invalid {
          border-color: rgba(239, 68, 68, 0.55) !important;
        }
        .field-error {
          margin: 0;
          color: var(--red-500);
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>

      <h1 className="page-title">Profile & Skills</h1>
      <p className="page-subtitle">
        Manage your profile details, upload a resume, and keep your key skills up-to-date.
      </p>

      <div className="grid">
        <EditableSection
          title="Profile"
          viewContent={
            <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Full name</h4>
                <p>{state.profile.fullName || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Email</h4>
                <p>{state.profile.email || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Location</h4>
                <p>{state.profile.location || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Phone</h4>
                <p>{state.profile.phone || "—"}</p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <h4 style={{ marginTop: 0 }}>Summary</h4>
                <p style={{ color: "var(--muted)" }}>{state.profile.bio || "Add a short summary to strengthen your profile."}</p>
              </div>
            </div>
          }
          editContent={
            <>
              {/* BASIC DETAILS (edit) */}
              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-fullname">Full Name</label>
                  <input
                    id="ps-fullname"
                    className={getInputClassName("fullName")}
                    placeholder="Full Name"
                    value={profileDraft.fullName}
                    onChange={(e) => updateProfileField("fullName", e.target.value)}
                    onBlur={() => {
                      markTouched("fullName");
                      const next = validateProfile(profileDraft);
                      setErrors((p) => ({ ...p, fullName: next.fullName }));
                    }}
                    aria-invalid={Boolean(touched.fullName && errors.fullName)}
                    aria-describedby={touched.fullName && errors.fullName ? errorId("fullName") : undefined}
                  />
                  {touched.fullName && errors.fullName ? (
                    <p className="field-error" id={errorId("fullName")}>
                      {errors.fullName}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="ps-email">Email</label>
                  <input
                    id="ps-email"
                    className={getInputClassName("email")}
                    type="email"
                    placeholder="Email"
                    value={profileDraft.email}
                    onChange={(e) => updateProfileField("email", e.target.value)}
                    onBlur={() => {
                      markTouched("email");
                      const next = validateProfile(profileDraft);
                      setErrors((p) => ({ ...p, email: next.email }));
                    }}
                    aria-invalid={Boolean(touched.email && errors.email)}
                    aria-describedby={touched.email && errors.email ? errorId("email") : undefined}
                  />
                  {touched.email && errors.email ? (
                    <p className="field-error" id={errorId("email")}>
                      {errors.email}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-phone">Phone Number</label>
                  <input
                    id="ps-phone"
                    className={getInputClassName("phone")}
                    placeholder="Phone Number"
                    value={profileDraft.phone}
                    onChange={(e) => updateProfileField("phone", e.target.value)}
                    onBlur={() => {
                      markTouched("phone");
                      const next = validateProfile(profileDraft);
                      setErrors((p) => ({ ...p, phone: next.phone }));
                    }}
                    aria-invalid={Boolean(touched.phone && errors.phone)}
                    aria-describedby={touched.phone && errors.phone ? errorId("phone") : undefined}
                  />
                  {touched.phone && errors.phone ? (
                    <p className="field-error" id={errorId("phone")}>
                      {errors.phone}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="ps-location">Location</label>
                  <input
                    id="ps-location"
                    className={getInputClassName("location")}
                    placeholder="Location"
                    value={profileDraft.location}
                    onChange={(e) => updateProfileField("location", e.target.value)}
                    onBlur={() => {
                      markTouched("location");
                      const next = validateProfile(profileDraft);
                      setErrors((p) => ({ ...p, location: next.location }));
                    }}
                    aria-invalid={Boolean(touched.location && errors.location)}
                    aria-describedby={touched.location && errors.location ? errorId("location") : undefined}
                  />
                  {touched.location && errors.location ? (
                    <p className="field-error" id={errorId("location")}>
                      {errors.location}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* PROFILE SUMMARY (edit) */}
              <div className="row" style={{ marginTop: 10 }}>
                <div className="field" style={{ minWidth: "100%" }}>
                  <label htmlFor="ps-summary">Summary</label>
                  <textarea
                    id="ps-summary"
                    rows={4}
                    className={getTextareaClassName("bio")}
                    placeholder="Write a short professional summary..."
                    value={profileDraft.bio}
                    onChange={(e) => updateProfileField("bio", e.target.value)}
                    onBlur={() => {
                      markTouched("bio");
                      const next = validateProfile(profileDraft);
                      setErrors((p) => ({ ...p, bio: next.bio }));
                    }}
                    aria-invalid={Boolean(touched.bio && errors.bio)}
                    aria-describedby={touched.bio && errors.bio ? errorId("bio") : undefined}
                  />
                  {touched.bio && errors.bio ? (
                    <p className="field-error" id={errorId("bio")}>
                      {errors.bio}
                    </p>
                  ) : null}
                  <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 12 }}>
                    {profileDraft.bio.trim().length}/800
                  </p>
                </div>
              </div>
            </>
          }
          onSave={saveProfile}
          onCancel={resetProfile}
        />

        {/* RESUME */}
        <div className="card full">
          <h4>Resume</h4>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
            Resume upload is UI-only in this preview build.
          </p>

          <div className="row" style={{ marginTop: 12 }}>
            <input type="file" aria-label="Upload resume file" />
            <button
              className="primary-btn"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Resume upload (preview)",
                  description: "File upload is not wired to a backend yet.",
                })
              }
            >
              Upload
            </button>
            <button
              className="btn"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Replace resume (preview)",
                  description: "Connect a backend endpoint to store resumes.",
                })
              }
            >
              Replace
            </button>
            <button
              className="btn danger"
              type="button"
              onClick={() =>
                actions.pushToast({
                  type: "info",
                  title: "Delete resume (preview)",
                  description: "Connect a backend endpoint to delete stored resumes.",
                })
              }
            >
              Delete
            </button>
          </div>
        </div>

        {/* KEY SKILLS */}
        <div className="card full">
          <h4>Key Skills</h4>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field" style={{ flex: 1, minWidth: 260 }}>
              <label htmlFor="ps-new-skill">Add skill</label>
              <input
                id="ps-new-skill"
                className={getInputClassName("newSkill")}
                placeholder="Add skill"
                value={newSkill}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewSkill(v);

                  // Live validate after the user has interacted with the field.
                  if (touched.newSkill) {
                    setErrors((p) => ({ ...p, newSkill: validateNewSkill(v) }));
                  }
                }}
                onBlur={() => {
                  markTouched("newSkill");
                  setErrors((p) => ({ ...p, newSkill: validateNewSkill(newSkill) }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                aria-invalid={Boolean(touched.newSkill && errors.newSkill)}
                aria-describedby={touched.newSkill && errors.newSkill ? errorId("newSkill") : undefined}
              />
              {touched.newSkill && errors.newSkill ? (
                <p className="field-error" id={errorId("newSkill")}>
                  {errors.newSkill}
                </p>
              ) : null}
            </div>

            <button className="primary-btn" type="button" onClick={addSkill}>
              Add
            </button>

            <span className="badge" style={{ marginLeft: "auto" }}>
              {state.skills.length} skills
            </span>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            {state.skills.map((s) => (
              <span
                key={s.name}
                className="badge"
                style={{
                  borderColor: "rgba(124,58,237,0.22)",
                  background: "rgba(124,58,237,0.08)",
                }}
              >
                <span style={{ fontWeight: 800 }}>{s.name}</span>
                <span className="pill" style={{ background: "rgba(13,148,136,0.92)" }}>
                  {s.level || "Intermediate"}
                </span>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() => removeSkill(s.name)}
                  aria-label={`Remove ${s.name}`}
                  style={{ padding: "6px 10px", borderRadius: 999 }}
                >
                  ✕
                </button>
              </span>
            ))}
            {state.skills.length === 0 ? (
              <div className="card full">
                <h4>No skills yet</h4>
                <p>Add your first skill to start building a strong profile.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* PROJECTS */}
        <EditableSection
          title="Projects"
          viewContent={
            <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Project title</h4>
                <p>{state.profile.projects?.[0]?.title || "—"}</p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <h4 style={{ marginTop: 0 }}>Project description</h4>
                <p style={{ color: "var(--muted)" }}>
                  {state.profile.projects?.[0]?.description || "Add a short description of what you built, your role, and impact."}
                </p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Save will persist locally (preview mode). Cancel will revert unsaved changes.
                </p>
              </div>
            </div>
          }
          editContent={
            <>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Add one highlight project. Title and description are required.
              </p>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-project-title">Project Title</label>
                  <input
                    id="ps-project-title"
                    className={getInputClassName("projectTitle")}
                    placeholder="e.g. Design System for Hiring Portal"
                    value={projectDraft.title}
                    onChange={(e) => updateProjectField("title", e.target.value)}
                    onBlur={() => {
                      markProjectTouched("title");
                      const next = validateProject(projectDraft);
                      setErrors((p) => ({ ...p, projectTitle: next.projectTitle }));
                    }}
                    aria-invalid={Boolean(projectTouched.title && errors.projectTitle)}
                    aria-describedby={projectTouched.title && errors.projectTitle ? errorId("projectTitle") : undefined}
                  />
                  {projectTouched.title && errors.projectTitle ? (
                    <p className="field-error" id={errorId("projectTitle")}>
                      {errors.projectTitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field" style={{ minWidth: "100%" }}>
                  <label htmlFor="ps-project-desc">Project Description</label>
                  <textarea
                    id="ps-project-desc"
                    className={getTextareaClassName("projectDescription")}
                    placeholder="What did you build? What was your role? Tech stack? Outcomes?"
                    value={projectDraft.description}
                    onChange={(e) => updateProjectField("description", e.target.value)}
                    onBlur={() => {
                      markProjectTouched("description");
                      const next = validateProject(projectDraft);
                      setErrors((p) => ({ ...p, projectDescription: next.projectDescription }));
                    }}
                    aria-invalid={Boolean(projectTouched.description && errors.projectDescription)}
                    aria-describedby={
                      projectTouched.description && errors.projectDescription ? errorId("projectDescription") : undefined
                    }
                  />
                  {projectTouched.description && errors.projectDescription ? (
                    <p className="field-error" id={errorId("projectDescription")}>
                      {errors.projectDescription}
                    </p>
                  ) : null}
                  <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 12 }}>
                    {projectDraft.description.trim().length}/1000
                  </p>
                </div>
              </div>
            </>
          }
          onSave={saveProject}
          onCancel={resetProject}
        />

        {/* EDUCATION */}
        <EditableSection
          title="Education"
          viewContent={
            <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>10th</h4>
                <p style={{ color: "var(--muted)" }}>{state.profile.education?.tenth || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>12th</h4>
                <p style={{ color: "var(--muted)" }}>{state.profile.education?.twelfth || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Graduation</h4>
                <p style={{ color: "var(--muted)" }}>{state.profile.education?.graduation || "—"}</p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Save will persist locally (preview mode). Cancel will revert unsaved changes.
                </p>
              </div>
            </div>
          }
          editContent={
            <>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Add your education details. All three fields are required.
              </p>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-edu-10">10th School & Percentage</label>
                  <input
                    id="ps-edu-10"
                    className={getInputClassName("edu10")}
                    placeholder="e.g. ABC School • 92%"
                    value={educationDraft.tenth}
                    onChange={(e) => updateEducationField("tenth", e.target.value)}
                    onBlur={() => {
                      markEducationTouched("tenth");
                      const next = validateEducation(educationDraft);
                      setErrors((p) => ({ ...p, edu10: next.edu10 }));
                    }}
                    aria-invalid={Boolean(educationTouched.tenth && errors.edu10)}
                    aria-describedby={educationTouched.tenth && errors.edu10 ? errorId("edu10") : undefined}
                  />
                  {educationTouched.tenth && errors.edu10 ? (
                    <p className="field-error" id={errorId("edu10")}>
                      {errors.edu10}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="ps-edu-12">12th School & Percentage</label>
                  <input
                    id="ps-edu-12"
                    className={getInputClassName("edu12")}
                    placeholder="e.g. XYZ Junior College • 88%"
                    value={educationDraft.twelfth}
                    onChange={(e) => updateEducationField("twelfth", e.target.value)}
                    onBlur={() => {
                      markEducationTouched("twelfth");
                      const next = validateEducation(educationDraft);
                      setErrors((p) => ({ ...p, edu12: next.edu12 }));
                    }}
                    aria-invalid={Boolean(educationTouched.twelfth && errors.edu12)}
                    aria-describedby={educationTouched.twelfth && errors.edu12 ? errorId("edu12") : undefined}
                  />
                  {educationTouched.twelfth && errors.edu12 ? (
                    <p className="field-error" id={errorId("edu12")}>
                      {errors.edu12}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-edu-grad">Graduation (Degree, College)</label>
                  <input
                    id="ps-edu-grad"
                    className={getInputClassName("eduGrad")}
                    placeholder="e.g. B.Tech (CSE) • University Name"
                    value={educationDraft.graduation}
                    onChange={(e) => updateEducationField("graduation", e.target.value)}
                    onBlur={() => {
                      markEducationTouched("graduation");
                      const next = validateEducation(educationDraft);
                      setErrors((p) => ({ ...p, eduGrad: next.eduGrad }));
                    }}
                    aria-invalid={Boolean(educationTouched.graduation && errors.eduGrad)}
                    aria-describedby={educationTouched.graduation && errors.eduGrad ? errorId("eduGrad") : undefined}
                  />
                  {educationTouched.graduation && errors.eduGrad ? (
                    <p className="field-error" id={errorId("eduGrad")}>
                      {errors.eduGrad}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          }
          onSave={saveEducation}
          onCancel={resetEducation}
        />

        {/* LANGUAGES */}
        <EditableSection
          title="Languages"
          viewContent={
            <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <h4 style={{ marginTop: 0 }}>Languages</h4>
                <p style={{ color: "var(--muted)" }}>
                  {state.profile.languages?.trim()
                    ? state.profile.languages
                    : "Add languages you can speak (comma-separated)."}
                </p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Save will persist locally (preview mode). Cancel will revert unsaved changes.
                </p>
              </div>
            </div>
          }
          editContent={
            <>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Enter a comma-separated list (e.g. English, Hindi, Tamil).
              </p>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field" style={{ minWidth: "100%" }}>
                  <label htmlFor="ps-languages">Languages</label>
                  <input
                    id="ps-languages"
                    className={getInputClassName("languages")}
                    placeholder="e.g. English, Hindi, Tamil"
                    value={languagesDraft}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLanguagesDraft(v);

                      // Live-validate after interaction
                      if (languagesTouched) {
                        setErrors((p) => ({ ...p, languages: validateLanguages(v) }));
                      }
                    }}
                    onBlur={() => {
                      setLanguagesTouched(true);
                      setErrors((p) => ({ ...p, languages: validateLanguages(languagesDraft) }));
                    }}
                    aria-invalid={Boolean(languagesTouched && errors.languages)}
                    aria-describedby={languagesTouched && errors.languages ? errorId("languages") : undefined}
                  />
                  {languagesTouched && errors.languages ? (
                    <p className="field-error" id={errorId("languages")}>
                      {errors.languages}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          }
          onSave={saveLanguages}
          onCancel={resetLanguages}
        />

        {/* CAREER PREFERENCES */}
        <EditableSection
          title="Career Preferences"
          viewContent={
            <div className="grid" style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 12 }}>
              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Preferred location</h4>
                <p>{state.profile.careerPreferences?.preferredLocation || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Preferred role</h4>
                <p>{state.profile.careerPreferences?.preferredRole || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Expected salary</h4>
                <p style={{ color: "var(--muted)" }}>{state.profile.careerPreferences?.expectedSalary || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Shift</h4>
                <p>{state.profile.careerPreferences?.shift || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Job type</h4>
                <p>{state.profile.careerPreferences?.jobType || "—"}</p>
              </div>

              <div className="card third" style={{ gridColumn: "span 4" }}>
                <h4 style={{ marginTop: 0 }}>Employment type</h4>
                <p>{state.profile.careerPreferences?.employmentType || "—"}</p>
              </div>

              <div className="card full" style={{ gridColumn: "1 / -1" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  These preferences are stored locally (preview mode). Use them as a consistent baseline while applying.
                </p>
              </div>
            </div>
          }
          editContent={
            <>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Update your targets. Save will persist locally; Cancel will revert unsaved changes.
              </p>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-pref-location">Preferred Location</label>
                  <input
                    id="ps-pref-location"
                    className={getInputClassName("prefLocation")}
                    placeholder="e.g. Remote / Bengaluru"
                    value={careerPrefDraft.preferredLocation}
                    onChange={(e) => updateCareerPrefField("preferredLocation", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("preferredLocation");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefLocation: next.prefLocation }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.preferredLocation && errors.prefLocation)}
                    aria-describedby={
                      careerPrefTouched.preferredLocation && errors.prefLocation ? errorId("prefLocation") : undefined
                    }
                  />
                  {careerPrefTouched.preferredLocation && errors.prefLocation ? (
                    <p className="field-error" id={errorId("prefLocation")}>
                      {errors.prefLocation}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="ps-pref-role">Preferred Role</label>
                  <input
                    id="ps-pref-role"
                    className={getInputClassName("prefRole")}
                    placeholder="e.g. Frontend Engineer"
                    value={careerPrefDraft.preferredRole}
                    onChange={(e) => updateCareerPrefField("preferredRole", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("preferredRole");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefRole: next.prefRole }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.preferredRole && errors.prefRole)}
                    aria-describedby={careerPrefTouched.preferredRole && errors.prefRole ? errorId("prefRole") : undefined}
                  />
                  {careerPrefTouched.preferredRole && errors.prefRole ? (
                    <p className="field-error" id={errorId("prefRole")}>
                      {errors.prefRole}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <div className="field">
                  <label htmlFor="ps-pref-salary">Expected Salary</label>
                  <input
                    id="ps-pref-salary"
                    className={getInputClassName("prefSalary")}
                    placeholder="e.g. 18 LPA / 120000"
                    value={careerPrefDraft.expectedSalary}
                    onChange={(e) => updateCareerPrefField("expectedSalary", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("expectedSalary");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefSalary: next.prefSalary }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.expectedSalary && errors.prefSalary)}
                    aria-describedby={
                      careerPrefTouched.expectedSalary && errors.prefSalary ? errorId("prefSalary") : undefined
                    }
                  />
                  {careerPrefTouched.expectedSalary && errors.prefSalary ? (
                    <p className="field-error" id={errorId("prefSalary")}>
                      {errors.prefSalary}
                    </p>
                  ) : null}
                </div>

                <div className="field" style={{ maxWidth: 260 }}>
                  <label htmlFor="ps-pref-shift">Shift</label>
                  <select
                    id="ps-pref-shift"
                    className={`select${errors.prefShift ? " input-invalid" : ""}`}
                    value={careerPrefDraft.shift}
                    onChange={(e) => updateCareerPrefField("shift", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("shift");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefShift: next.prefShift }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.shift && errors.prefShift)}
                    aria-describedby={careerPrefTouched.shift && errors.prefShift ? errorId("prefShift") : undefined}
                  >
                    <option value="">Select shift</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                  {careerPrefTouched.shift && errors.prefShift ? (
                    <p className="field-error" id={errorId("prefShift")}>
                      {errors.prefShift}
                    </p>
                  ) : null}
                </div>

                <div className="field" style={{ maxWidth: 260 }}>
                  <label htmlFor="ps-pref-jobtype">Job Type</label>
                  <select
                    id="ps-pref-jobtype"
                    className={`select${errors.prefJobType ? " input-invalid" : ""}`}
                    value={careerPrefDraft.jobType}
                    onChange={(e) => updateCareerPrefField("jobType", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("jobType");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefJobType: next.prefJobType }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.jobType && errors.prefJobType)}
                    aria-describedby={careerPrefTouched.jobType && errors.prefJobType ? errorId("prefJobType") : undefined}
                  >
                    <option value="">Select job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                  {careerPrefTouched.jobType && errors.prefJobType ? (
                    <p className="field-error" id={errorId("prefJobType")}>
                      {errors.prefJobType}
                    </p>
                  ) : null}
                </div>

                <div className="field" style={{ maxWidth: 260 }}>
                  <label htmlFor="ps-pref-emptype">Employment Type</label>
                  <select
                    id="ps-pref-emptype"
                    className={`select${errors.prefEmploymentType ? " input-invalid" : ""}`}
                    value={careerPrefDraft.employmentType}
                    onChange={(e) => updateCareerPrefField("employmentType", e.target.value)}
                    onBlur={() => {
                      markCareerPrefTouched("employmentType");
                      const next = validateCareerPreferences(careerPrefDraft);
                      setErrors((p) => ({ ...p, prefEmploymentType: next.prefEmploymentType }));
                    }}
                    aria-invalid={Boolean(careerPrefTouched.employmentType && errors.prefEmploymentType)}
                    aria-describedby={
                      careerPrefTouched.employmentType && errors.prefEmploymentType
                        ? errorId("prefEmploymentType")
                        : undefined
                    }
                  >
                    <option value="">Select employment type</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                  </select>
                  {careerPrefTouched.employmentType && errors.prefEmploymentType ? (
                    <p className="field-error" id={errorId("prefEmploymentType")}>
                      {errors.prefEmploymentType}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          }
          onSave={saveCareerPreferences}
          onCancel={resetCareerPreferences}
        />

      </div>
    </section>
  );
}
