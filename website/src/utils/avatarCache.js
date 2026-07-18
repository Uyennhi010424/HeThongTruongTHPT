import { getRole } from "../store/authStore.js";
import { getCurrentUsernameFromToken } from "./teacherProfile.js";

const normalize = (value) => String(value || "").trim().toLowerCase();

const normalizeRole = (value) => {
  const role = normalize(value).replace(/[^a-z0-9]/g, "");
  if (!role) return "";
  if (role === "teacher" || role === "giaovien" || role === "gv") return "giaovien";
  if (role === "student" || role === "hocsinh" || role === "hs") return "hocsinh";
  if (role === "parent" || role === "phuhuynh" || role === "ph") return "phuhuynh";
  if (role === "vantu" || role === "vanthu") return "vanthu";
  if (role === "admin" || role === "quantri" || role === "quantrivien") return "admin";
  return role;
};

const getRoleKeyCandidates = (role) => {
  const normalizedRole = normalizeRole(role || getRole());
  const rawRole = normalize(role || getRole()).replace(/[^a-z0-9]/g, "");
  const candidates = [];

  if (normalizedRole) candidates.push(normalizedRole);
  if (rawRole && rawRole !== normalizedRole) candidates.push(rawRole);

  return [...new Set(candidates)];
};

export const getAvatarStorageKey = (username, role) => {
  const normalizedUsername = normalize(username);
  const normalizedRole = normalizeRole(role || getRole());
  if (!normalizedUsername) return "";
  return `httt_avatar:${normalizedRole || "unknown"}:${normalizedUsername}`;
};

export const readCachedAvatar = ({ username, role } = {}) => {
  const resolvedUsername = normalize(username || getCurrentUsernameFromToken());
  if (!resolvedUsername) return "";

  const keys = getRoleKeyCandidates(role).map((candidateRole) => getAvatarStorageKey(resolvedUsername, candidateRole));
  const roleAdminLegacyKey = `admin-avatar:${resolvedUsername}`;

  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  return localStorage.getItem(roleAdminLegacyKey) || "";
};

export const writeCachedAvatar = ({ avatar, username, role } = {}) => {
  const resolvedUsername = normalize(username || getCurrentUsernameFromToken());
  if (!resolvedUsername) return;

  const resolvedRole = normalizeRole(role || getRole());
  const key = getAvatarStorageKey(resolvedUsername, resolvedRole);
  const value = String(avatar || "");
  localStorage.setItem(key, value);

  const rawRole = normalize(role || getRole()).replace(/[^a-z0-9]/g, "");
  if (rawRole && rawRole !== resolvedRole) {
    localStorage.setItem(getAvatarStorageKey(resolvedUsername, rawRole), value);
  }

  window.dispatchEvent(
    new CustomEvent("httt_avatar_changed", {
      detail: {
        avatar: value,
        username: resolvedUsername,
        role: resolvedRole
      }
    })
  );
};
