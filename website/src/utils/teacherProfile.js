import { getToken } from "../store/authStore.js";

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const splitSubjectList = (value) =>
  String(value ?? "")
    .split(/[,;\/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const getCurrentUsernameFromToken = () => {
  const token = getToken();
  if (!token) return "";

  try {
    const payloadPart = token.split(".")[1] || "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(normalized));
    return String(payload?.sub || "").trim().toLowerCase();
  } catch {
    return "";
  }
};

export const findTeacherByUsername = (teachers, username) => {
  const normalizedUsername = normalizeText(username);
  if (!normalizedUsername) return null;

  return (
    teachers.find((item) => {
      const candidates = [
        item?.email,
        item?.username,
        item?.maGiaoVien,
        item?.hoTen,
        item?.sdt,
        item?.soDienThoai
      ];
      return candidates.some((candidate) => normalizeText(candidate) === normalizedUsername);
    }) || null
  );
};

export const getTeacherSubjectList = (teacher) => {
  const rawSubjects = teacher?.boMon || "";
  const subjectList = splitSubjectList(rawSubjects);

  if (subjectList.length > 0) {
    return subjectList;
  }

  return String(rawSubjects || "").trim() ? [String(rawSubjects).trim()] : [];
};

export const getTeacherSubjectLabel = (teacher) => {
  const subjects = getTeacherSubjectList(teacher);
  return subjects.length > 0 ? subjects.join(", ") : "Giáo viên";
};

export const getHomeroomAssignment = (teacher, assignments) => {
  if (!teacher?.id) return null;

  return (
    assignments.find((item) => Number(item?.giaoVienId) === Number(teacher.id)) || null
  );
};

export const getTeacherRoleLabel = (teacher, assignments) => {
  const subjectLabel = getTeacherSubjectLabel(teacher);
  const homeroomAssignment = getHomeroomAssignment(teacher, assignments);
  return `${subjectLabel}${homeroomAssignment ? " (GVCN)" : ""}`;
};
