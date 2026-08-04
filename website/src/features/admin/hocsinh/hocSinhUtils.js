import { normalizeStrict, normalizeEmailPart } from "../../../utils/normalizeText.js";

// Re-export for convenience
export { normalizeStrict as normalizeText };

/** Lấy tên (từ cuối cùng) từ họ tên đầy đủ. Vd: "Bùi Văn An" → "An" */
export const getGivenName = (hoTen) => {
  const parts = String(hoTen || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
};

/** Bảng thứ tự chữ cái tiếng Việt chuẩn (a→ă→â→b→c→d→đ→e→ê→g→...) */
const VI_ALPHA = "aăâbcdđeêghiklmnoôơpqrstuưvxy";
const VI_MAP = {};
for (let i = 0; i < VI_ALPHA.length; i++) VI_MAP[VI_ALPHA[i]] = i;

/** Chuyển tên thành chuỗi sort key tiếng Việt (Đ xếp sau D, trước E) */
export const viSortKey = (str) =>
  String(str || "")
    .replace(/Đ/g, "DĐ")   // Đ → DĐ trước khi normalize
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // bỏ dấu thanh/diacritics
    .toLowerCase()
    .split("")
    .map((ch) => {
      const pos = VI_MAP[ch];
      return pos !== undefined ? String.fromCharCode(65 + pos) : ch;
    })
    .join("");

/** Lấy khối (10, 11, 12) từ học sinh */
export const getStudentKhoi = (s) => {
  const raw = s?.lop?.khoi ?? s?.khoi ?? "";
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
};

/** Lấy tên lớp để sort cùng khối */
export const getStudentTenLop = (s) => String(s?.lop?.tenLop || "");

/** Sort: 1) Khối 10→11→12, 2) Tên lớp, 3) Tên (A→Z tiếng Việt) */
export const sortByGivenName = (list) =>
  [...list].sort((a, b) => {
    const khoiA = getStudentKhoi(a);
    const khoiB = getStudentKhoi(b);
    if (khoiA !== khoiB) return khoiA - khoiB;

    const lopA = getStudentTenLop(a);
    const lopB = getStudentTenLop(b);
    if (lopA < lopB) return -1;
    if (lopA > lopB) return 1;

    const keyA = viSortKey(getGivenName(a?.hoTen));
    const keyB = viSortKey(getGivenName(b?.hoTen));
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

export const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getGenderLabel = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  if (value === true || normalized === "true" || normalized === "nam") return "Nam";
  if (value === false || normalized === "false" || normalized === "nu") return "Nữ";
  return "--";
};

export const getStatusLabel = (status) => {
  if (Number(status) === 3) return "Chuyển trường";
  if (Number(status) === 2) return "Đã tốt nghiệp";
  if (Number(status) === 1) return "Đang học";
  return "Ngừng học";
};

export const getStudentStatus = (student) => {
  if (student == null) return 1;
  if (student.trangThai !== undefined && student.trangThai !== null) {
    return Number(student.trangThai);
  }
  if (student.user && typeof student.user.isActive !== "undefined") {
    return student.user.isActive ? 1 : 0;
  }
  return 1;
};

export const buildStudentEmailPreview = (fullName) => {
  const normalized = normalizeEmailPart(fullName);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstLetters = parts.slice(0, -1).map((part) => part[0]).join("");
  const lastName = parts[parts.length - 1];
  const localPart = `${firstLetters}${lastName}` || "hocsinh";
  return `${localPart}@tdn.edu.vn`;
};

export const buildParentEmailPreview = (fullName, phone) => {
  const base = normalizeEmailPart(fullName) || "phuhuynh";
  const suffix = phone ? phone.replace(/[^0-9]/g, "") : "";
  return `${base}${suffix}@tdn.edu.vn`;
};

export const notifyUsersUpdated = () => {
  window.dispatchEvent(new Event("users-updated"));
  window.localStorage.setItem("usersUpdatedAt", String(Date.now()));
};

export const normalizeStudent = (student) => {
  if (!student) return student;
  return {
    ...student,
    lop: student.lop || null
  };
};

export const compareClassesByName = (a, b) => {
  const gradeA = Number(a?.khoi || 0);
  const gradeB = Number(b?.khoi || 0);
  if (gradeA !== gradeB) return gradeA - gradeB;

  const nameA = String(a?.tenLop || "");
  const nameB = String(b?.tenLop || "");
  const nameCompare = nameA.localeCompare(nameB, "vi", {
    sensitivity: "base",
    numeric: true
  });
  if (nameCompare !== 0) return nameCompare;

  return Number(a?.id || 0) - Number(b?.id || 0);
};

export const validateStudentAgeAndYear = (ngaySinh, namNhapHoc, khoi) => {
  const currentYear = new Date().getFullYear();
  let error = null;

  if (namNhapHoc) {
    if (namNhapHoc > currentYear + 1) {
      error = `Năm nhập học không được vượt quá ${currentYear + 1}`;
    } else if (namNhapHoc < 2000) {
      error = "Năm nhập học phải từ năm 2000 trở đi";
    }
  }

  if (!error && ngaySinh && khoi) {
    const birthYear = new Date(ngaySinh).getFullYear();
    const age = currentYear - birthYear;
    
    let validAge = false;
    if (khoi == 10 && (age >= 16 && age <= 18)) validAge = true;
    else if (khoi == 11 && (age >= 17 && age <= 19)) validAge = true;
    else if (khoi == 12 && (age >= 18 && age <= 20)) validAge = true;

    if (!validAge) {
      error = `Độ tuổi ${age} không phù hợp với Khối ${khoi} (Năm sinh: ${birthYear}, Năm hiện tại: ${currentYear})`;
    }
  }

  return error;
};

export const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  const normalized = normalizeStrict(value);
  if (["true", "1", "co", "cophai", "yes", "x", "nam"].includes(normalized)) return true;
  if (["false", "0", "khong", "no", "nu", ""].includes(normalized)) return false;
  return fallback;
};

export const normalizePhone = (value) => {
  if (value === null || value === undefined) return "";
  let s = String(value).trim();
  if (!s) return "";
  s = s.replace(/[^0-9]/g, "");
  if (s.length === 9) return `0${s}`;
  if (s.length === 11 && s.startsWith("84")) return `0${s.slice(2)}`;
  return s;
};

export const formatPhoneDisplay = (value) => {
  if (!value && value !== 0) return "";
  const s = String(value).trim();
  if (!s) return "";
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length === 9) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith("84")) return `0${digits.slice(2)}`;
  return digits;
};

export const parseStatus = (value) => {
  const normalized = normalizeStrict(value);
  if (["3", "chuyentruong", "transfer"].includes(normalized)) return 3;
  if (["1", "danghoc", "active"].includes(normalized)) return 1;
  if (["2", "datotnghiep", "graduated"].includes(normalized)) return 2;
  if (["0", "ngunghoc", "inactive"].includes(normalized)) return 0;
  return 1;
};

export const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const findColumnValue = (row, aliases) => {
  const entries = Object.entries(row || {});
  for (const alias of aliases) {
    const normalizedAlias = normalizeStrict(alias);
    const match = entries.find(([key]) => normalizeStrict(key) === normalizedAlias);
    if (match) return match[1];
  }
  return "";
};

export const extractBackendError = (err) => {
  const message = err?.response?.data?.message;
  if (message) return message;
  return "không thể lưu dữ liệu";
};

export const normalizeDateCell = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number") {
    try {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const jsDate = new Date(epoch.getTime() + Math.round(value) * 24 * 60 * 60 * 1000);
      const year = jsDate.getUTCFullYear();
      const month = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(jsDate.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parts = text.split(/[\/\-.]/);
  if (parts.length === 3) {
    const [first, second, third] = parts.map((part) => Number(part));
    if ([first, second, third].every((item) => Number.isFinite(item))) {
      const year = first > 31 ? first : third;
      const month = second;
      const day = first > 31 ? third : first;
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }

  const parsedDate = new Date(text);
  if (isNaN(parsedDate.getTime())) return null;
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const EXCEL_TEMPLATE_COLUMNS = [
  "Họ tên",
  "Ngày sinh",
  "Giới tính",
  "Lớp",
  "Số điện thoại",
  "Địa chỉ",
  "Năm nhập học",
  "Mã BHYT",
  "Dân tộc",
  "Tôn giáo",
  "Diện chính sách",
  "Trạng thái",
  "Phụ huynh - Họ tên",
  "Phụ huynh - SĐT",
  "Phụ huynh - Email",
  "Phụ huynh - Nghề nghiệp",
  "ID phụ huynh (tùy chọn)"
];

export const EXCEL_FIELD_ALIASES = {
  hoTen: ["Họ tên", "Họ và tên", "HO_TEN"],
  ngaySinh: ["Ngày sinh", "NGAY_SINH"],
  gioiTinh: ["Giới tính", "GIOI_TINH"],
  lop: ["Lớp", "Lớp học", "LOP"],
  sdt: ["Số điện thoại", "Điện thoại", "SDT", "SO_DIEN_THOAI"],
  email: ["Email", "EMAIL"],
  diaChi: ["Địa chỉ", "DIA_CHI"],
  namNhapHoc: ["Năm nhập học", "NAM_NHAP_HOC"],
  maBhyt: ["Mã BHYT", "MA_BHYT"],
  danToc: ["Dân tộc", "DAN_TOC"],
  tonGiao: ["Tôn giáo", "TON_GIAO"],
  dienChinhSach: ["Diện chính sách", "DIEN_CHINH_SACH"],
  trangThai: ["Trạng thái", "TRANG_THAI"],
  phuHuynhHoTen: ["Phụ huynh - Họ tên", "PHU_HUYNH_HO_TEN", "PHUHUYNH_HOTEN"],
  phuHuynhSdt: ["Phụ huynh - SĐT", "PHU_HUYNH_SDT", "PHUHUYNH_SDT"],
  phuHuynhEmail: ["Phụ huynh - Email", "PHU_HUYNH_EMAIL", "PHUHUYNH_EMAIL"],
  phuHuynhNgheNghiep: [
    "Phụ huynh - Nghề nghiệp",
    "PHU_HUYNH_NGHE_NGHIEP",
    "PHUHUYNH_NGHENGHIEP"
  ],
  phuHuynhIdOptional: [
    "ID phụ huynh (tùy chọn)",
    "ID phụ huynh",
    "PHUHUYNH_ID",
    "ID_PHUHUYNH"
  ],
  hocBaId: ["ID học bạ", "HOCBA_ID", "ID_HOCBA"],
  danTocId: ["ID dân tộc", "DANTOC_ID", "ID_DANTOC"],
  phuHuynhId: ["ID phụ huynh", "PHUHUYNH_ID", "ID_PHUHUYNH"]
};

export const REQUIRED_EXCEL_FIELDS = ["hoTen", "lop"];

export const DEFAULT_ACCOUNT_PASSWORD = "123456";

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

