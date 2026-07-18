/**
 * NFC normalization for display: ensures Vietnamese characters render correctly.
 * Converts NFD (decomposed) form to NFC (composed) form.
 * Use for: displaying Vietnamese text in UI.
 */
export function normalizeVietnameseDisplay(value) {
  if (typeof value !== "string") return value || "";
  return value.normalize("NFC");
}

/**
 * Full Vietnamese text normalization: NFD decomposition, diacritic removal,
 * đ→d, lowercase, strip non-alphanumeric (except spaces), collapse spaces.
 * Use for: search, matching, sorting.
 */
export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Like normalizeText but keeps & and - characters.
 * Use for: subject name matching where names contain & or -.
 */
export function normalizeSubjectText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9&\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strict normalization: strips ALL non-alphanumeric (no spaces).
 * Use for: generating IDs, keys, or codes from Vietnamese text.
 */
export function normalizeStrict(value) {
  return String(value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Email-safe normalization: handles uppercase Đ, keeps spaces.
 * Use for: generating email addresses from Vietnamese names.
 */
export function normalizeEmailPart(value) {
  return String(value || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
