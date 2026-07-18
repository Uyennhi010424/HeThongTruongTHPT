/**
 * Shared scoring policy and calculation utilities.
 * Used by AdminNhapDiemPage, NhapDiem, ScorePage, and other score-related pages.
 */
import { normalizeSubjectText } from "./normalizeText.js";

// ─── Subject classification constants ───

export const COMMENT_ONLY_SUBJECTS = [
  "giao duc the chat",
  "am nhac",
  "noi dung giao duc dia phuong",
  "hoat dong trai nghiem",
  "huong nghiep"
];

export const TX2_SUBJECTS = ["gdqp-an", "gdqp an", "giao duc quoc phong", "an ninh"];
export const TX4_SUBJECTS = ["toan", "ngu van", "tieng anh"];
export const TX3_SUBJECTS = [
  "vat li",
  "hoa hoc",
  "sinh hoc",
  "lich su",
  "dia li",
  "gdkt&pl",
  "gdkt",
  "tin hoc",
  "cong nghe"
];

// ─── Policy lookup ───

/**
 * Determine scoring policy for a subject by its name.
 * Returns { mode: "COMMENT"|"SCORE", txCount: number, label: string }
 */
export const getPolicyBySubjectName = (subjectName) => {
  const normalized = normalizeSubjectText(subjectName);

  if (COMMENT_ONLY_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "COMMENT", txCount: 0, label: "Đánh giá bằng nhận xét" };
  }

  if (TX2_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 2, label: "2 điểm đánh giá thường xuyên" };
  }

  if (TX4_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 4, label: "4 điểm đánh giá thường xuyên" };
  }

  if (TX3_SUBJECTS.some((item) => normalized.includes(item))) {
    return { mode: "SCORE", txCount: 3, label: "3 điểm đánh giá thường xuyên" };
  }

  return { mode: "SCORE", txCount: 3, label: "3 điểm đánh giá thường xuyên" };
};

/**
 * Determine scoring policy from a subject object (uses DB config if available, falls back to name).
 */
export const getPolicyBySubject = (subject) => {
  if (!subject) return { mode: "SCORE", txCount: 3, label: "3 điểm đánh giá thường xuyên" };

  // Dùng cấu hình từ DB nếu có
  if (subject.nhomDanhGia) {
    const mode = subject.nhomDanhGia === "NHAN_XET" ? "COMMENT" : "SCORE";
    const txCount = mode === "COMMENT" ? 0 : (subject.soDtxHocKy || 3);
    const label = mode === "COMMENT"
      ? "Đánh giá bằng nhận xét"
      : `${txCount} điểm đánh giá thường xuyên`;
    return { mode, txCount, label };
  }

  // Fallback: nhận diện theo tên môn
  return getPolicyBySubjectName(subject.tenMon || "");
};

// ─── Record key ───

/**
 * Generate a unique key for a student+subject record.
 */
export const getRecordKey = (studentId, subjectId) => `${studentId}_${subjectId}`;

// ─── Score conversion ───

/**
 * Convert a raw value to a valid score (0-10) or null.
 */
export const toScore = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const score = Number(value);
  if (Number.isNaN(score)) return null;
  return Math.max(0, Math.min(10, score));
};

// ─── Semester / Year calculations ───

/**
 * Create an empty semester record with the given number of TX slots.
 */
export const createEmptySemester = (txCount) => ({
  tx: Array.from({ length: txCount }, () => ""),
  gk: "",
  ck: "",
  nhanXet: "DAT"
});

/**
 * Calculate semester average: (sum_TX + 2*GK + 3*CK) / (count_TX + 5)
 * Returns null if incomplete.
 */
export const calcSemesterAverage = (semesterData) => {
  const txScores = (semesterData.tx || []).map(toScore).filter((item) => item !== null);
  const gk = toScore(semesterData.gk);
  const ck = toScore(semesterData.ck);

  if (txScores.length === 0 || gk === null || ck === null) return null;

  const sumTx = txScores.reduce((acc, curr) => acc + curr, 0);
  const avg = (sumTx + 2 * gk + 3 * ck) / (txScores.length + 5);
  return Number(avg.toFixed(2));
};

/**
 * Calculate year average: (HK1 + 2*HK2) / 3
 * Returns null if either semester is incomplete.
 */
export const calcYearAverage = (hk1Avg, hk2Avg) => {
  if (hk1Avg === null || hk2Avg === null) return null;
  return Number(((hk1Avg + 2 * hk2Avg) / 3).toFixed(2));
};

// ─── Learning level classification ───

/**
 * Get single subject learning level label from year average.
 */
export const getSingleSubjectLevel = (value) => {
  if (value === null || value === undefined) return "--";
  if (value < 4) return "Chưa đạt";
  if (value >= 8) return "Tốt";
  if (value >= 6.5) return "Khá";
  return "Đạt";
};

/**
 * Classify overall learning level (học lực) based on Thong tu 22.
 */
export const getOverallLearningLevel = ({ commentResults, numericAverages }) => {
  const totalCommentSubjects = commentResults.length;
  const commentNotReached = commentResults.filter((item) => item !== "DAT").length;
  const numericValid = numericAverages.filter((item) => item !== null);

  if (numericValid.length !== numericAverages.length) return "CHUA_DAT";

  const overallMean = numericValid.length
    ? Number((numericValid.reduce((a, b) => a + b, 0) / numericValid.length).toFixed(2))
    : 0;

  if (overallMean < 4.0) return "CHUA_DAT";

  const allCommentReached = commentNotReached === 0;
  const allAbove65 = numericValid.every((item) => item >= 6.5);
  const allAbove50 = numericValid.every((item) => item >= 5);
  const allAbove35 = numericValid.every((item) => item >= 3.5);
  const countAbove80 = numericValid.filter((item) => item >= 8).length;
  const countAbove65 = numericValid.filter((item) => item >= 6.5).length;
  const countAbove50 = numericValid.filter((item) => item >= 5).length;

  if (allCommentReached && allAbove65 && countAbove80 >= 6) return "TOT";
  if (allCommentReached && allAbove50 && countAbove65 >= 6) return "KHA";

  const maxOneCommentFailed = totalCommentSubjects > 0 ? commentNotReached <= 1 : true;
  if (maxOneCommentFailed && countAbove50 >= 6 && allAbove35) return "DAT";

  return "DAT";
};

/**
 * Get learning level display label.
 */
export const getLearningLevelLabel = (value) => {
  switch (value) {
    case "TOT": return "Tốt";
    case "KHA": return "Khá";
    case "DAT": return "Đạt";
    default: return "Chưa đạt";
  }
};

/**
 * Classify học lực for student score page (slightly different thresholds).
 */
export const classifyHocLuc = (diemTBCaNam, diemTBMons, commentResults = []) => {
  if (!diemTBMons || diemTBMons.length === 0) return null;

  const totalCommentSubjects = commentResults.length;
  const commentNotReached = commentResults.filter((item) => item !== "DAT").length;
  const numericValid = diemTBMons.filter((item) => item !== null);

  if (numericValid.length !== diemTBMons.length) return null;

  const overallMean = numericValid.length
    ? Number((numericValid.reduce((a, b) => a + b, 0) / numericValid.length).toFixed(2))
    : 0;

  if (overallMean < 4.0) return { label: "Chưa đạt", color: "text-red-700 bg-red-50", value: "CHUA_DAT" };

  const allCommentReached = commentNotReached === 0;
  const allAbove65 = numericValid.every((item) => item >= 6.5);
  const allAbove50 = numericValid.every((item) => item >= 5);
  const allAbove35 = numericValid.every((item) => item >= 3.5);
  const countAbove80 = numericValid.filter((item) => item >= 8).length;
  const countAbove65 = numericValid.filter((item) => item >= 6.5).length;
  const countAbove50 = numericValid.filter((item) => item >= 5).length;

  if (allCommentReached && allAbove65 && countAbove80 >= 6) {
    return { label: "Tốt", color: "text-green-700 bg-green-50", value: "TOT" };
  }
  if (allCommentReached && allAbove50 && countAbove65 >= 6) {
    return { label: "Khá", color: "text-blue-700 bg-blue-50", value: "KHA" };
  }

  const maxOneCommentFailed = totalCommentSubjects > 0 ? commentNotReached <= 1 : true;
  if (maxOneCommentFailed && countAbove50 >= 6 && allAbove35) {
    return { label: "Đạt", color: "text-yellow-700 bg-yellow-50", value: "DAT" };
  }

  return { label: "Chưa đạt", color: "text-red-700 bg-red-50", value: "CHUA_DAT" };
};
