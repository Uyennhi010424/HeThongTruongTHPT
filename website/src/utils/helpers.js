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

export const getLimitedSemesterWeeks = (selectedYear, hocKy = null) => {
  let currentWeek = 1;
  let schoolStart;
  if (selectedYear?.ngayBatDauHk1) {
    schoolStart = new Date(selectedYear.ngayBatDauHk1 + "T00:00:00");
  } else if (typeof selectedYear === "string") {
    const startYear = parseInt(selectedYear.split("-")[0]);
    schoolStart = new Date(startYear, 8, 7); // 7th Sept
  }
  
  if (schoolStart) {
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      currentWeek = Math.floor(diffDays / 7) + 1;
    }
  }
  
  const hk1Max = 18;
  const hk2Max = 36;

  const startWeek = (hocKy == 2) ? 19 : 1;
  const endWeek = (hocKy == 1) ? hk1Max : hk2Max;

  const wList = [];
  for (let w = startWeek; w <= endWeek; w++) {
    wList.push(w);
  }
  
  if (wList.length === 0) {
      return hocKy == 2 ? [19, 20, 21] : [1, 2, 3];
  }
  return wList;
};

export const getCurrentSemesterWeek = (selectedYear) => {
  let schoolStart;
  if (selectedYear?.ngayBatDauHk1) {
    schoolStart = new Date(selectedYear.ngayBatDauHk1 + "T00:00:00");
  } else if (typeof selectedYear === "string") {
    const startYear = parseInt(selectedYear.split("-")[0]);
    schoolStart = new Date(startYear, 8, 7);
  }
  
  if (schoolStart) {
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      const currentWeek = Math.floor(diffDays / 7) + 1;
      return Math.min(36, currentWeek);
    } else {
      return 0; // Chưa bắt đầu năm học
    }
  }
  return 1;
};

export const getWeekDates = (tuan, selectedYear = null) => {
  let schoolStart;
  if (selectedYear?.ngayBatDauHk1) {
    schoolStart = new Date(selectedYear.ngayBatDauHk1 + "T00:00:00");
  } else if (typeof selectedYear === "string") {
    const startYear = parseInt(selectedYear.split("-")[0]);
    schoolStart = new Date(startYear, 8, 7);
  } else if (selectedYear?.tenNamHoc) {
    const startYear = parseInt(selectedYear.tenNamHoc.split("-")[0]);
    schoolStart = new Date(startYear, 8, 7);
  } else {
    const currentYear = new Date().getFullYear();
    schoolStart = new Date(currentYear, 8, 7);
  }

  const dow = schoolStart.getDay();
  const monday = new Date(schoolStart);
  monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setDate(monday.getDate() + (tuan - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday };
};

export const mapTimeToPeriod = (timeStr) => {
  if (!timeStr) return 1;
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m;
  
  if (totalMins < 8 * 60) return 1;
  if (totalMins < 9 * 60) return 2;
  if (totalMins < 10 * 60) return 3;
  if (totalMins < 11 * 60) return 4;
  if (totalMins <= 12 * 60) return 5;
  
  if (totalMins < 14 * 60) return 6;
  if (totalMins < 15 * 60) return 7;
  if (totalMins < 16 * 60) return 8;
  if (totalMins < 17 * 60) return 9;
  return 10;
};

export const getActiveAcademicYear = (allNamHoc) => {
  if (!Array.isArray(allNamHoc) || allNamHoc.length === 0) return null;
  return allNamHoc.find((y) => (y?.trangThai || y?.trang_thai) === "DANG_MO") || allNamHoc[0] || null;
};

export const getAcademicYearStart = (yearItem) => {
  const name = typeof yearItem === "string" ? yearItem : (yearItem?.tenNamHoc || yearItem?.namHoc || "");
  const match = String(name).trim().match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
};

export const getVisibleAcademicYears = (allNamHoc) => {
  if (!Array.isArray(allNamHoc) || allNamHoc.length === 0) return [];
  const activeYear = getActiveAcademicYear(allNamHoc);
  if (!activeYear) return allNamHoc;

  const activeStartYear = getAcademicYearStart(activeYear);
  if (!activeStartYear) return allNamHoc;

  return allNamHoc
    .filter((y) => {
      const yStart = getAcademicYearStart(y);
      return yStart > 0 ? yStart <= activeStartYear : true;
    })
    .sort((a, b) => getAcademicYearStart(b) - getAcademicYearStart(a));
};

export const sortClasses = (a, b) => {
  const ga = Number(a?.khoi || 0);
  const gb = Number(b?.khoi || 0);
  if (ga !== gb) return ga - gb;
  return String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
    sensitivity: "base",
    numeric: true,
  });
};

