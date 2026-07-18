import { normalizeText } from "./normalizeText.js";

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const getDayLabel = (value) => {
  switch (value) {
    case 2: return "Thứ 2";
    case 3: return "Thứ 3";
    case 4: return "Thứ 4";
    case 5: return "Thứ 5";
    case 6: return "Thứ 6";
    case 7: return "Thứ 7";
    case 8: return "Chủ nhật";
    default: return "--";
  }
};

export const formatDateShort = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
};

export const getStudentClass = (student) => {
  return student?.lopHoc || student?.lop || null;
};

export const getStudentClassId = (student) => {
  return getStudentClass(student)?.id ?? student?.lopHocId ?? student?.lopId ?? null;
};

export const getStudentClassName = (student) => {
  return getStudentClass(student)?.tenLop || student?.tenLop || "";
};

export const getStudentGivenName = (fullName) => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
};

export const compareStudentsByGivenName = (a, b) => {
  const givenA = normalizeText(getStudentGivenName(a?.hoTen));
  const givenB = normalizeText(getStudentGivenName(b?.hoTen));
  const givenCompare = givenA.localeCompare(givenB, "vi", { sensitivity: "base" });
  if (givenCompare !== 0) return givenCompare;

  const fullA = normalizeText(a?.hoTen);
  const fullB = normalizeText(b?.hoTen);
  const fullCompare = fullA.localeCompare(fullB, "vi", { sensitivity: "base" });
  if (fullCompare !== 0) return fullCompare;

  return Number(a?.id || 0) - Number(b?.id || 0);
};

export const sortStudentsByGivenName = (students) =>
  Array.isArray(students) ? [...students].sort(compareStudentsByGivenName) : [];
