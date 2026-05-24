import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createHocSinh,
  deleteHocSinh,
  getHocSinh,
  updateHocSinh
} from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { createPhuHuynh, getPhuHuynh, updatePhuHuynh } from "../../../api/phuhuynhApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";
import { createUser, getUsers } from "../../../api/userApi.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getGenderLabel = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  if (value === true || normalized === "true" || normalized === "nam") return "Nam";
  if (value === false || normalized === "false" || normalized === "nu") return "Nữ";
  return "--";
};

const getStatusLabel = (status) => (Number(status) === 1 ? "Đang học" : "Ngừng học");

const getStudentStatus = (student) => {
  if (student == null) return 1;
  if (student.trangThai !== undefined && student.trangThai !== null) {
    return Number(student.trangThai) === 1 ? 1 : 0;
  }
  // Fallback: derive from linked user active flag when backend doesn't store trangThai
  if (student.user && typeof student.user.isActive !== "undefined") {
    return student.user.isActive ? 1 : 0;
  }
  return 1;
};

const normalizeEmailPart = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildStudentEmailPreview = (fullName) => {
  const normalized = normalizeEmailPart(fullName);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstLetters = parts.slice(0, -1).map((part) => part[0]).join("");
  const lastName = parts[parts.length - 1];
  const localPart = `${firstLetters}${lastName}` || "hocsinh";
  return `${localPart}@tdn.edu.vn`;
};

const buildParentEmailPreview = (fullName, phone) => {
  const base = normalizeEmailPart(fullName) || "phuhuynh";
  const suffix = phone ? phone.replace(/[^0-9]/g, "") : "";
  return `${base}${suffix}@tdn.edu.vn`;
};

const notifyUsersUpdated = () => {
  window.dispatchEvent(new Event("users-updated"));
  window.localStorage.setItem("usersUpdatedAt", String(Date.now()));
};

const compareClassThenGivenName = (a, b) => {
  const classA = String(a?.lopHoc?.tenLop || a?.lop?.tenLop || "").trim();
  const classB = String(b?.lopHoc?.tenLop || b?.lop?.tenLop || "").trim();
  const classCompare = classA.localeCompare(classB, "vi", {
    numeric: true,
    sensitivity: "base"
  });
  if (classCompare !== 0) return classCompare;

  const nameA = String(a?.hoTen || "").trim();
  const nameB = String(b?.hoTen || "").trim();

  const getGiven = (fullName) => {
    if (!fullName) return "";
    const parts = fullName.split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : fullName;
  };

  const givenA = getGiven(nameA).toString();
  const givenB = getGiven(nameB).toString();

  const givenCompare = givenA.localeCompare(givenB, "vi", { sensitivity: "base" });
  if (givenCompare !== 0) return givenCompare;

  // Fallback: compare full name, then id
  const nameCompare = nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
  if (nameCompare !== 0) return nameCompare;

  return Number(a?.id || 0) - Number(b?.id || 0);
};

const normalizeStudent = (student) => {
  if (!student) return student;
  return {
    ...student,
    lopHoc: student.lopHoc || student.lop || null
  };
};

const EXCEL_TEMPLATE_COLUMNS = [
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

const EXCEL_FIELD_ALIASES = {
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

const REQUIRED_EXCEL_FIELDS = ["hoTen", "lop"];

const normalizeText = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  const normalized = normalizeText(value);
  if (["true", "1", "co", "cophai", "yes", "x", "nam"].includes(normalized)) return true;
  if (["false", "0", "khong", "no", "nu", ""].includes(normalized)) return false;
  return fallback;
};

// Normalize phone values coming from Excel or loose input.
// Preserve leading zero if a 9-digit number is provided (common when Excel trims the 0).
const normalizePhone = (value) => {
  if (value === null || value === undefined) return "";
  let s = String(value).trim();
  if (!s) return "";
  // remove all non-digit characters but keep leading + for detection
  s = s.replace(/[^0-9]/g, "");
  // If number lost the leading 0 (e.g. 912345678 -> 0912345678), add it back when length is 9
  if (s.length === 9) return `0${s}`;
  // If it looks like a vietnam country code without leading zero (84912345678), convert to 0...
  if (s.length === 11 && s.startsWith("84")) return `0${s.slice(2)}`;
  return s;
};

const formatPhoneDisplay = (value) => {
  if (!value && value !== 0) return "";
  const s = String(value).trim();
  if (!s) return "";
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length === 9) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith("84")) return `0${digits.slice(2)}`;
  return digits;
};

const parseStatus = (value) => {
  const normalized = normalizeText(value);
  if (["1", "danghoc", "active"].includes(normalized)) return 1;
  if (["0", "ngunghoc", "inactive"].includes(normalized)) return 0;
  return 1;
};

const parseNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const findColumnValue = (row, aliases) => {
  const entries = Object.entries(row || {});
  for (const alias of aliases) {
    const normalizedAlias = normalizeText(alias);
    const match = entries.find(([key]) => normalizeText(key) === normalizedAlias);
    if (match) return match[1];
  }
  return "";
};

const extractBackendError = (err) => {
  const message = err?.response?.data?.message;
  if (message) return message;
  return "không thể lưu dữ liệu";
};

// ✅ FIX: Xử lý đầy đủ Date object, số serial Excel, và chuỗi ngày tháng
const normalizeDateCell = (value) => {
  if (value === null || value === undefined || value === "") return null;

  // ✅ Xử lý JS Date object (do cellDates: true trả về)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Xử lý số serial Excel (fallback nếu không dùng cellDates)
  if (typeof value === "number") {
    try {
      // Excel lưu ngày dạng số nguyên (ngày tính từ 1899-12-30, có bug năm nhuận 1900)
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

  // Định dạng ISO: yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  // Định dạng dd/mm/yyyy hoặc dd-mm-yyyy hoặc dd.mm.yyyy
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

export default function HocSinhList() {
  const [excelError, setExcelError] = useState("");
  const [excelSuccess, setExcelSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    lopHocId: "",
    danTocTen: "",
    tonGiao: "",
    phuHuynhId: "",
    phuHuynhHoTen: "",
    phuHuynhSdt: "",
    phuHuynhEmail: "",
    phuHuynhNgheNghiep: "",
    sdt: "",
    email: "",
    diaChi: "",
    namNhapHoc: "",
    maBhyt: "",
    dienChinhSach: "false",
    trangThai: 1
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState("");

  const ensureStudentUserAccount = async (student, fallbackFullName = "") => {
    const candidate =
      String(student?.email || "").trim() || buildStudentEmailPreview(fallbackFullName);

    if (!candidate) return;

    try {
      const usersResponse = await getUsers();
      const users = usersResponse?.data?.data || [];
      const normalizedCandidate = candidate.toLowerCase();

      const exists = users.some((user) => {
        const username = String(user?.username || "").trim().toLowerCase();
        const email = String(user?.email || "").trim().toLowerCase();
        return username === normalizedCandidate || email === normalizedCandidate;
      });

      if (exists) return;

      await createUser({
        username: candidate,
        email: candidate,
        password: "Abc1234@",
        status: Number(student?.trangThai) === 1 ? 1 : 0,
        role: "HOCSINH"
      });
    } catch {
      // Giữ tạo học sinh thành công dù tạo tài khoản fallback thất bại
    }
  };

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [hsRes, lopRes, phRes] = await Promise.allSettled([
          getHocSinh(),
          getLop(),
          getPhuHuynh()
        ]);
        if (!active) return;
        if (hsRes.status === "fulfilled") {
          setStudents((hsRes.value?.data?.data || []).map(normalizeStudent));
        }
        if (lopRes.status === "fulfilled") {
          setClasses(lopRes.value?.data?.data || []);
        }
        if (phRes.status === "fulfilled") {
          setParents(phRes.value?.data?.data || []);
        }

        if (hsRes.status === "rejected" || lopRes.status === "rejected") {
          setError("Không thể tải đầy đủ dữ liệu học sinh/lớp.");
        }
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = students.length;
    const activeCount = students.filter((item) => getStudentStatus(item) === 1).length;
    const pausedCount = total - activeCount;
    return { total, activeCount, pausedCount };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const lower = keyword.toLowerCase();
    const source = students.filter((student) => {
      const matchKeyword = keyword.trim()
        ? [student.hoTen, student.sdt, student.email, student?.lopHoc?.tenLop]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(lower))
        : true;

      const studentGrade = String(student?.lopHoc?.khoi || "");
      const studentClassId = String(student?.lopHoc?.id || student?.lop?.id || "");

      const matchGrade = gradeFilter === "all" ? true : studentGrade === gradeFilter;
      const matchClass = classFilter === "all" ? true : studentClassId === classFilter;

      return matchKeyword && matchGrade && matchClass;
    });

    return [...source].sort(compareClassThenGivenName);
  }, [keyword, students, gradeFilter, classFilter]);

  const classesByGrade = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      const grade = item?.khoi ? String(item.khoi) : "Khác";
      if (!map.has(grade)) map.set(grade, []);
      map.get(grade).push(item);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([grade, items]) => ({
        grade,
        items: [...items].sort((x, y) =>
          String(x.tenLop || "").localeCompare(String(y.tenLop || ""))
        )
      }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (gradeFilter === "all") return classes;
    return classes.filter((item) => String(item?.khoi || "") === gradeFilter);
  }, [classes, gradeFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents.length, pageSize]);

  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize, gradeFilter, classFilter]);

  useEffect(() => {
    if (classFilter === "all") return;
    const exists = filteredClasses.some((item) => String(item.id) === classFilter);
    if (!exists) {
      setClassFilter("all");
    }
  }, [filteredClasses, classFilter]);

  // When user picks a specific class, update the grade filter to match that class's `khoi`.
  const handleClassSelect = (classId) => {
    setClassFilter(classId);
    if (classId === "all") {
      setGradeFilter("all");
      return;
    }
    const found = classes.find((c) => String(c.id) === String(classId));
    if (found && found.khoi !== undefined && found.khoi !== null) {
      setGradeFilter(String(found.khoi));
    }
  };

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingStudent(null);
    setForm({
      hoTen: "",
      ngaySinh: "",
      gioiTinh: "true",
      lopHocId: classes[0]?.id ? String(classes[0].id) : "",
      danTocTen: "",
      tonGiao: "",
      phuHuynhId: "",
      phuHuynhHoTen: "",
      phuHuynhSdt: "",
      phuHuynhEmail: "",
      phuHuynhNgheNghiep: "",
      sdt: "",
      email: "",
      diaChi: "",
      namNhapHoc: "",
      maBhyt: "",
      dienChinhSach: "false",
      trangThai: 1
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (student) => {
    const selectedParent = parents.find(
      (item) => String(item.id) === String(student?.phuHuynhId || "")
    );
    setEditingStudent(student);
    // If phuHuynhId isn't present on the student, try fetching linked parents
    (async () => {
      let parentToUse = selectedParent;
      if (!parentToUse) {
        try {
          const res = await getParentsForStudent(student.id);
          const fetched = res?.data?.data || [];
          if (fetched.length) {
            parentToUse = fetched[0];
            // ensure parent is in local parents list so selects show it
            setParents((prev) => {
              const exists = prev.some((p) => String(p.id) === String(parentToUse.id));
              return exists ? prev : [parentToUse, ...prev];
            });
          }
        } catch (e) {
          // ignore fetch errors — proceed with whatever we have
        }
      }

      setForm({
      hoTen: student.hoTen || "",
      ngaySinh: formatDateInput(student.ngaySinh),
      gioiTinh: String(student.gioiTinh ?? true),
      lopHocId: student?.lopHoc?.id
        ? String(student.lopHoc.id)
        : student?.lop?.id
        ? String(student.lop.id)
        : "",
      danTocTen: student?.danToc || "",
      tonGiao: student?.tonGiao || "",
      phuHuynhId: student?.phuHuynhId
        ? String(student.phuHuynhId)
        : parentToUse?.id
        ? String(parentToUse.id)
        : "",
      phuHuynhHoTen: parentToUse?.hoTen || selectedParent?.hoTen || "",
      phuHuynhSdt: formatPhoneDisplay(parentToUse?.soDienThoai || selectedParent?.soDienThoai || ""),
      phuHuynhEmail: parentToUse?.email || selectedParent?.email || "",
      phuHuynhNgheNghiep: parentToUse?.ngheNghiep || selectedParent?.ngheNghiep || "",
      sdt: student.sdt || "",
      email: student.email || "",
      diaChi: student.diaChi || "",
      namNhapHoc:
        student.namNhapHoc !== null && student.namNhapHoc !== undefined
          ? String(student.namNhapHoc)
          : "",
      maBhyt: student.maBhyt || "",
      dienChinhSach: String(student.dienChinhSach ?? false),
      trangThai: student.trangThai ?? (student.user?.isActive ? 1 : 0)
    });
      setFormError("");
      setSuccessMessage("");
      setModalOpen(true);
    })();
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Xóa học sinh ${student.hoTen}?`)) return;
    try {
      await deleteHocSinh(student.id);
      setStudents((prev) => prev.filter((item) => item.id !== student.id));
      setError("");
      setSuccessMessage("Xóa học sinh thành công.");
    } catch (err) {
      setError("Không thể xóa học sinh.");Chu
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.hoTen.trim()) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    if (!form.lopHocId) {
      setFormError("Vui lòng chọn lớp học.");
      return;
    }

    const ethnicityName = form.danTocTen.trim();
    if (!ethnicityName) {
      setFormError("Vui lòng nhập dân tộc.");
      return;
    }

    const danTocId = editingStudent?.danTocId || 1;
    let phuHuynhId = form.phuHuynhId ? Number(form.phuHuynhId) : null;

    if (!phuHuynhId) {
      const hasParentContact =
        form.phuHuynhHoTen.trim() ||
        form.phuHuynhSdt.trim() ||
        form.phuHuynhEmail.trim();

      if (hasParentContact) {
        try {
          const candidateEmail =
            form.phuHuynhEmail.trim() ||
            buildParentEmailPreview(form.phuHuynhHoTen, form.phuHuynhSdt);
          let createdUserId = null;
          try {
            const userRes = await createUser({
              username: candidateEmail,
              email: candidateEmail,
              password: "Abc1234@",
              status: 1,
              role: "PHU_HUYNH"
            });
            createdUserId = userRes?.data?.data?.id;
          } catch {
            try {
              const usersRes = await getUsers();
              const found = (usersRes?.data?.data || []).find((u) => {
                const email = String(u?.email || "").toLowerCase();
                return email === candidateEmail.toLowerCase();
              });
              if (found?.id) createdUserId = found.id;
            } catch {
              // ignore
            }
          }

          const phPayload = {
            hoTen: form.phuHuynhHoTen.trim() || null,
            soDienThoai: form.phuHuynhSdt.trim() || null,
            email: form.phuHuynhEmail.trim() || null,
            diaChi: null,
            ngheNghiep: form.phuHuynhNgheNghiep.trim() || null,
            quanHe: "CHA",
            isSmSActive: true
          };
          if (createdUserId) phPayload.user = { id: Number(createdUserId) };

          const phRes = await createPhuHuynh(phPayload);
          const createdParent = phRes?.data?.data;
          if (createdParent?.id) {
            phuHuynhId = Number(createdParent.id);
            setParents((prev) => [createdParent, ...prev]);
          }
        } catch {
          setFormError("Không thể tạo thông tin phụ huynh.");
          return;
        }
      }
    }

    if (!phuHuynhId) {
      const fallbackParent = parents[0];
      if (fallbackParent?.id) {
        phuHuynhId = Number(fallbackParent.id);
      }
    }

    if (!phuHuynhId) {
      setFormError("Vui lòng chọn phụ huynh hoặc nhập thông tin liên hệ phụ huynh.");
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      ngaySinh: form.ngaySinh || null,
      gioiTinh: form.gioiTinh === "true",
      lop: form.lopHocId ? { id: Number(form.lopHocId) } : null,
      hocBaId: editingStudent?.hocBaId || 1,
      danTocId,
      danToc: ethnicityName,
      phuHuynhId,
      tonGiao: form.tonGiao.trim() || null,
      sdt: form.sdt.trim() || null,
      email: editingStudent
        ? form.email.trim() || null
        : buildStudentEmailPreview(form.hoTen) || null,
      diaChi: form.diaChi.trim() || null,
      namNhapHoc: form.namNhapHoc ? Number(form.namNhapHoc) : null,
      maBhyt: form.maBhyt.trim() || null,
      dienChinhSach: form.dienChinhSach === "true",
      trangThai: Number(form.trangThai)
    };

    try {
      if (editingStudent) {
        const response = await updateHocSinh(editingStudent.id, payload);
        const updated = normalizeStudent(response?.data?.data);
        setStudents((prev) =>
          prev.map((item) => (item.id === editingStudent.id ? updated : item))
        );
      } else {
        const response = await createHocSinh(payload);
        const created = normalizeStudent(response?.data?.data);
        const selectedClass = classes.find(
          (item) => String(item.id) === String(form.lopHocId)
        );
        const normalizedCreated = {
          ...created,
          lopHoc: created?.lopHoc || created?.lop || selectedClass || null,
          email: created?.email || buildStudentEmailPreview(form.hoTen)
        };
        setStudents((prev) => [normalizedCreated, ...prev]);
        await ensureStudentUserAccount(normalizedCreated, form.hoTen);
        notifyUsersUpdated();
      }

      setError("");
      setSuccessMessage(
        editingStudent ? "Cập nhật hồ sơ học sinh thành công." : "Thêm học sinh thành công."
      );
      setModalOpen(false);
    } catch (err) {
      setFormError(`Không thể lưu hồ sơ học sinh: ${extractBackendError(err)}.`);
      setSuccessMessage("");
    }
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        "Họ tên": "Nguyễn Văn A",
        "Ngày sinh": "2008-09-15",
        "Giới tính": "Nam",
        "Lớp": "10A1",
        "Số điện thoại": "0901234567",
        "Địa chỉ": "12 Nguyễn Trãi",
        "Năm nhập học": 2023,
        "Mã BHYT": "BHYT001",
        "Dân tộc": "Kinh",
        "Tôn giáo": "Không",
        "Diện chính sách": "Không",
        "Trạng thái": "Đang học",
        "Phụ huynh - Họ tên": "Nguyễn Văn B",
        "Phụ huynh - SĐT": "0912345678",
        "Phụ huynh - Email": "phuhuynh@example.com",
        "Phụ huynh - Nghề nghiệp": "Kinh doanh",
        "ID phụ huynh (tùy chọn)": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows, {
      header: EXCEL_TEMPLATE_COLUMNS
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HocSinh");
    XLSX.writeFile(workbook, "mau_nhap_hoc_sinh_viet_hoa.xlsx");
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelError("");
    setExcelSuccess("");
    setImporting(true);

    try {
      const buffer = await file.arrayBuffer();

      // ✅ FIX: Thêm cellDates: true để SheetJS tự convert số serial thành JS Date
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Đọc toàn bộ dưới dạng mảng thô để phát hiện header
      const allRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false  // ✅ FIX: raw: false giúp giá trị Date được format đúng khi dùng với cellDates
      });

      if (!allRows || allRows.length === 0) {
        setExcelError("File Excel không có dữ liệu.");
        return;
      }

      // Tìm dòng header trong 5 dòng đầu
      let headerRowIndex = -1;
      let headerArray = null;

      for (let i = 0; i < Math.min(5, allRows.length); i += 1) {
        const hdr = allRows[i] || [];
        const normalized = new Set(hdr.map((h) => normalizeText(String(h || ""))));
        const hasAll = REQUIRED_EXCEL_FIELDS.every((field) =>
          EXCEL_FIELD_ALIASES[field].some((alias) => normalized.has(normalizeText(alias)))
        );
        if (hasAll) {
          headerRowIndex = i;
          headerArray = hdr.map((h) => String(h || ""));
          break;
        }
      }

      // Nếu không tìm thấy, thử gộp 2-3 dòng đầu
      if (headerRowIndex === -1) {
        const maxCombine = Math.min(3, allRows.length - 1);
        for (let span = 1; span <= maxCombine && headerRowIndex === -1; span += 1) {
          const maxCols = Math.max(...allRows.slice(0, span + 1).map((r) => (r || []).length));
          const combined = [];
          for (let c = 0; c < maxCols; c += 1) {
            const parts = [];
            for (let r = 0; r <= span; r += 1) {
              const cell = (allRows[r] || [])[c];
              if (cell !== undefined && cell !== null && String(cell || "").trim() !== "") {
                parts.push(String(cell));
              }
            }
            combined[c] = parts.join(" ").trim();
          }

          const normalizedCombined = new Set(
            combined.map((h) => normalizeText(String(h || "")))
          );
          const hasAll = REQUIRED_EXCEL_FIELDS.every((field) =>
            EXCEL_FIELD_ALIASES[field].some((alias) =>
              normalizedCombined.has(normalizeText(alias))
            )
          );
          if (hasAll) {
            headerRowIndex = span;
            headerArray = combined;
            break;
          }
        }
      }

      let rows = [];
      let baseRowNumber = 2;

      if (headerRowIndex >= 0) {
        const header =
          headerArray || allRows[headerRowIndex].map((h) => String(h || ""));
        const dataRows = allRows.slice(headerRowIndex + 1);
        rows = dataRows.map((r) => {
          const obj = {};
          for (let c = 0; c < header.length; c += 1) {
            const key = header[c] || `COL_${c}`;
            obj[key] = r[c] === undefined ? "" : r[c];
          }
          return obj;
        });
        baseRowNumber = headerRowIndex + 2;
      } else {
        // Fallback: dùng dòng đầu làm header
        const tmp = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        if (!tmp.length) {
          setExcelError("File Excel không có dữ liệu.");
          return;
        }
        rows = tmp;
        baseRowNumber = 2;
      }

      if (!rows.length) {
        setExcelError("File Excel không có dữ liệu (sau khi xử lý header).");
        return;
      }

      const normalizedHeaders = new Set(
        Object.keys(rows[0] || {}).map((header) => normalizeText(header))
      );
      const missingFields = REQUIRED_EXCEL_FIELDS.filter(
        (field) =>
          !EXCEL_FIELD_ALIASES[field].some((alias) =>
            normalizedHeaders.has(normalizeText(alias))
          )
      );
      if (missingFields.length) {
        const missingLabels = missingFields.map((field) => EXCEL_FIELD_ALIASES[field][0]);
        setExcelError(`Thiếu cột bắt buộc: ${missingLabels.join(", ")}`);
        return;
      }

      const classMap = new Map();
      classes.forEach((lop) => {
        classMap.set(normalizeText(lop.tenLop), lop);
      });

      const fuzzyFindClass = (normName) => {
        if (!normName) return null;
        if (classMap.has(normName)) return classMap.get(normName);
        for (const [key, lop] of classMap.entries()) {
          if (key.includes(normName) || normName.includes(key)) return lop;
        }
        const simple = normName.replace(/[^a-z0-9]/g, "");
        for (const [key, lop] of classMap.entries()) {
          if (key.includes(simple) || simple.includes(key)) return lop;
        }
        return null;
      };

      // ✅ FIX: Cache phụ huynh đã tạo trong lần import để tránh tạo trùng
      const createdParentCache = new Map(); // key: email hoặc sdt → phuHuynhId

      const createdStudents = [];
      const failedRows = [];
      const originalRowNumbers = rows.map((_, i) => baseRowNumber + i);
      let totalNonEmptyRows = 0;

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = originalRowNumbers[index];

        // Bỏ qua dòng trống hoàn toàn
        const isEmptyRow = Object.values(row || {}).every(
          (v) => v === null || v === undefined || String(v || "").trim() === ""
        );
        if (isEmptyRow) continue;
        totalNonEmptyRows += 1;

        const className = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.lop) || ""
        ).trim();
        const normClassName = normalizeText(className);
        let classMatch = classMap.get(normClassName);
        if (!classMatch) classMatch = fuzzyFindClass(normClassName);

        const fullName = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.hoTen) || ""
        ).trim();

        if (!fullName) {
          const preview = Object.entries(row || {})
            .slice(0, 6)
            .map(([k, v]) => `${String(k).slice(0, 40)}:${String(v).slice(0, 40)}`)
            .join(" | ");
          failedRows.push(
            `Dòng ${rowNumber}: thiếu cột Họ tên — dữ liệu: ${preview}`
          );
          continue;
        }

        if (!classMatch) {
          const preview = Object.entries(row || {})
            .slice(0, 6)
            .map(([k, v]) => `${String(k).slice(0, 40)}:${String(v).slice(0, 40)}`)
            .join(" | ");
          failedRows.push(
            `Dòng ${rowNumber}: không tìm thấy lớp '${className || "(trống)"}' — dữ liệu: ${preview}`
          );
          continue;
        }

        const hocBaId =
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.hocBaId)) ?? 1;
        const danTocId =
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.danTocId)) ?? 1;

        // Xử lý phụ huynh: ưu tiên ID có sẵn → cache → tạo mới
        let phuHuynhId =
          parseNullableNumber(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhIdOptional)
          ) ??
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhId)) ??
          null;

        if (!phuHuynhId) {
          const phHoTen = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhHoTen) || ""
          ).trim();
          const phSdt = normalizePhone(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhSdt) || ""
          );
          const phEmail = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhEmail) || ""
          ).trim();
          const phNgheNghiep = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhNgheNghiep) || ""
          ).trim();

          // ✅ FIX: Dùng email hoặc SĐT làm cache key, tránh tạo trùng phụ huynh
          const cacheKey = phEmail || phSdt || phHoTen;

          if (cacheKey && createdParentCache.has(cacheKey)) {
            // Tái sử dụng phụ huynh đã tạo trong lần import này
            phuHuynhId = createdParentCache.get(cacheKey);
          } else if (phHoTen || phSdt || phEmail) {
            try {
              // Kiểm tra phụ huynh đã tồn tại trong DB chưa (theo email hoặc SĐT)
              const existingParent = parents.find((p) => {
                if (phEmail && String(p.email || "").toLowerCase() === phEmail.toLowerCase())
                  return true;
                if (phSdt && String(p.soDienThoai || "") === phSdt) return true;
                return false;
              });

              if (existingParent?.id) {
                phuHuynhId = Number(existingParent.id);
                if (cacheKey) createdParentCache.set(cacheKey, phuHuynhId);
                // If parent exists but ngheNghiep provided in Excel, update parent to persist profession
                try {
                  if (phNgheNghiep && String(existingParent.ngheNghiep || "").trim() === "") {
                    await updatePhuHuynh(existingParent.id, { ...existingParent, ngheNghiep: phNgheNghiep || null });
                    setParents((prev) =>
                      prev.map((p) => (p.id === existingParent.id ? { ...p, ngheNghiep: phNgheNghiep || null } : p))
                    );
                  }
                } catch {
                  // ignore update failure
                }
              } else {
                // Tạo user cho phụ huynh
                const candidateEmail =
                  phEmail || buildParentEmailPreview(phHoTen, phSdt);
                let createdUserId = null;
                try {
                  const userRes = await createUser({
                    username: candidateEmail,
                    email: candidateEmail,
                    password: "Abc1234@",
                    status: 1,
                    role: "PHU_HUYNH"
                  });
                  createdUserId = userRes?.data?.data?.id;
                } catch {
                  try {
                    const usersRes = await getUsers();
                    const found = (usersRes?.data?.data || []).find(
                      (u) =>
                        String(u?.email || "").toLowerCase() ===
                        candidateEmail.toLowerCase()
                    );
                    if (found?.id) createdUserId = found.id;
                  } catch {
                    // ignore
                  }
                }

                      const phPayload = {
                        hoTen: phHoTen || null,
                        soDienThoai: phSdt || null,
                        email: phEmail || null,
                        diaChi: null,
                        ngheNghiep: phNgheNghiep || null,
                        quanHe: "CHA",
                        isSmSActive: true
                      };
                if (createdUserId) phPayload.user = { id: Number(createdUserId) };

                const phRes = await createPhuHuynh(phPayload);
                const createdParent = phRes?.data?.data;
                if (createdParent?.id) {
                  phuHuynhId = Number(createdParent.id);
                  setParents((prev) => [createdParent, ...prev]);
                  if (cacheKey) createdParentCache.set(cacheKey, phuHuynhId);
                }
              }
            } catch {
              // Nếu không tạo được phụ huynh, dùng fallback
            }
          }
        }

        // Fallback cuối: dùng phụ huynh đầu tiên trong danh sách
        if (!phuHuynhId) {
          phuHuynhId = parents[0]?.id ? Number(parents[0].id) : 1;
        }

        // ✅ FIX: Dùng normalizeDateCell đã được fix để xử lý Date object
        const ngaySinhRaw = findColumnValue(row, EXCEL_FIELD_ALIASES.ngaySinh);
        const ngaySinhNormalized = normalizeDateCell(ngaySinhRaw);

          const payload = {
          hoTen: fullName,
          ngaySinh: ngaySinhNormalized,
          gioiTinh: parseBoolean(
            findColumnValue(row, EXCEL_FIELD_ALIASES.gioiTinh),
            true
          ),
          lop: { id: Number(classMatch.id) },
          hocBaId,
          danTocId,
          danToc:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.danToc) || "").trim() || null,
          phuHuynhId,
          sdt: normalizePhone(findColumnValue(row, EXCEL_FIELD_ALIASES.sdt) || "") || null,
          email:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.email) || "").trim() ||
            buildStudentEmailPreview(fullName) ||
            null,
          diaChi:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.diaChi) || "").trim() || null,
          namNhapHoc: parseNullableNumber(
            findColumnValue(row, EXCEL_FIELD_ALIASES.namNhapHoc)
          ),
          maBhyt:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.maBhyt) || "").trim() || null,
          tonGiao:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.tonGiao) || "").trim() || null,
          dienChinhSach: parseBoolean(
            findColumnValue(row, EXCEL_FIELD_ALIASES.dienChinhSach),
            false
          ),
          trangThai: parseStatus(findColumnValue(row, EXCEL_FIELD_ALIASES.trangThai))
        };

        try {
          const response = await createHocSinh(payload);
          const created = response?.data?.data;
          if (created) createdStudents.push(created);
        } catch (err) {
          failedRows.push(`Dòng ${rowNumber}: ${extractBackendError(err)}`);
        }
      }

      if (createdStudents.length) {
        setStudents((prev) => [...createdStudents, ...prev]);
        await Promise.allSettled(
          createdStudents.map((student) =>
            ensureStudentUserAccount(student, student?.hoTen || "")
          )
        );
        notifyUsersUpdated();
      }

      if (failedRows.length) {
        setExcelError(
          `Nhập thành công ${createdStudents.length}/${totalNonEmptyRows || 0}. ${failedRows
            .slice(0, 3)
            .join(" | ")}`
        );
      } else {
        setExcelSuccess(
          `Đã nhập thành công ${createdStudents.length} học sinh từ Excel.`
        );
      }
    } catch (err) {
      setExcelError("Không thể đọc file Excel. Vui lòng kiểm tra lại biểu mẫu.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục học sinh"
        description="Theo dõi, cập nhật thông tin và trạng thái học sinh."
        actions={
          <div className="users-actions">
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo tên, lớp, SĐT hoặc email"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <label className="form-field users-filter-field">
              <span>Khối</span>
              <select
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
              >
                <option value="all">Tất cả khối</option>
                {classesByGrade.map((group) => (
                  <option key={group.grade} value={group.grade}>
                    Khối {group.grade}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field users-filter-field">
              <span>Lớp</span>
              <select
                value={classFilter}
                onChange={(event) => handleClassSelect(event.target.value)}
              >
                <option value="all">Tất cả lớp</option>
                {filteredClasses
                  .slice()
                  .sort((a, b) =>
                    String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", {
                      sensitivity: "base"
                    })
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.tenLop}
                    </option>
                  ))}
              </select>
            </label>
            <button className="btn-primary" onClick={openCreate}>
              Thêm học sinh
            </button>
            <button className="btn-outline" onClick={() => setExcelModalOpen(true)}>
              Thêm bằng Excel
            </button>
          </div>
        }
      />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng học sinh</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Đang học</div>
          <div className="stat-value">{loading ? "..." : stats.activeCount}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Ngừng học</div>
          <div className="stat-value">{loading ? "..." : stats.pausedCount}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách học sinh</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && (
          <div className="table-success">{successMessage}</div>
        )}
        {!error && !loading && filteredStudents.length === 0 && (
          <div className="table-empty">Không tìm thấy học sinh phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Học sinh</div>
            <div>Lớp</div>
            <div>Liên hệ</div>
            <div>Năm nhập học</div>
            <div>Trạng thái</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedStudents.map((student, index) => (
                <div className="table-row" key={student.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{student.hoTen}</div>
                    <div className="table-meta">
                      {formatDate(student.ngaySinh) || "--"} •{" "}
                      {getGenderLabel(student.gioiTinh)}
                    </div>
                  </div>
                  <div>
                    <div className="table-title">
                      {student?.lopHoc?.tenLop || student?.lop?.tenLop || "--"}
                    </div>
                    <div className="table-meta">
                      {student?.lopHoc?.khoi || student?.lop?.khoi
                        ? `Khối ${student.lopHoc?.khoi || student.lop?.khoi}`
                        : ""}
                    </div>
                  </div>
                  <div className="table-email">
                      {formatPhoneDisplay(student.sdt) || "--"}
                    <div className="table-meta">{student.email || ""}</div>
                  </div>
                  <div className="table-date">{student.namNhapHoc || "--"}</div>
                  <div>
                    {(() => {
                      const st = getStudentStatus(student);
                      return (
                        <span className={`status-pill ${st === 1 ? "status-active" : "status-locked"}`}>
                          {getStatusLabel(st)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(student)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(student)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
        </div>
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingStudent ? "Cập nhật học sinh" : "Thêm học sinh"}
        onClose={() => setModalOpen(false)}
        width={720}
      >
        <form className="form-grid form-grid-student" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Họ và tên</span>
            <input
              value={form.hoTen}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, hoTen: event.target.value }))
              }
              placeholder="vd: Nguyễn Văn A"
            />
          </label>
          <label className="form-field">
            <span>Ngày sinh</span>
            <input
              type="date"
              value={form.ngaySinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span>Giới tính</span>
            <select
              value={form.gioiTinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gioiTinh: event.target.value }))
              }
            >
              <option value="true">Nam</option>
              <option value="false">Nữ</option>
            </select>
          </label>
          <label className="form-field">
            <span>Lớp học</span>
            <select
              value={form.lopHocId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lopHocId: event.target.value }))
              }
            >
              <option value="">Chọn lớp</option>
              {classesByGrade.map((group) => (
                <optgroup key={group.grade} label={`Khối ${group.grade}`}>
                  {group.items.map((lop) => (
                    <option key={lop.id} value={lop.id}>
                      {lop.tenLop}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Dân tộc</span>
            <input
              value={form.danTocTen}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, danTocTen: event.target.value }))
              }
              placeholder="vd: Kinh, Tày, Nùng..."
            />
          </label>
          <label className="form-field">
            <span>Tôn giáo</span>
            <input
              value={form.tonGiao}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tonGiao: event.target.value }))
              }
              placeholder="vd: Không, Phật giáo..."
            />
          </label>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              value={form.sdt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sdt: event.target.value }))
              }
              placeholder="vd: 0901234567"
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              value={
                editingStudent ? form.email : buildStudentEmailPreview(form.hoTen)
              }
              readOnly
              placeholder="Tự động tạo theo tên học sinh"
            />
          </label>
          <label className="form-field">
            <span>Địa chỉ</span>
            <input
              value={form.diaChi}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, diaChi: event.target.value }))
              }
              placeholder="vd: 12 Nguyễn Trãi"
            />
          </label>
          <label className="form-field">
            <span>Năm nhập học</span>
            <input
              type="number"
              value={form.namNhapHoc}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, namNhapHoc: event.target.value }))
              }
              placeholder="vd: 2023"
            />
          </label>
          <label className="form-field">
            <span>Mã BHYT</span>
            <input
              value={form.maBhyt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maBhyt: event.target.value }))
              }
              placeholder="vd: BHYT1234"
            />
          </label>
          <label className="form-field">
            <span>Diện chính sách</span>
            <select
              value={form.dienChinhSach}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dienChinhSach: event.target.value }))
              }
            >
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </label>
          <label className="form-field">
            <span>Trạng thái</span>
            <select
              value={form.trangThai}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  trangThai: Number(event.target.value)
                }))
              }
            >
              <option value={1}>Đang học</option>
              <option value={0}>Ngừng học</option>
            </select>
          </label>
          <div className="form-section-title">Thông tin phụ huynh</div>
          <label className="form-field">
            <span>Phụ huynh (đã có)</span>
            <select
              value={form.phuHuynhId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phuHuynhId: event.target.value }))
              }
            >
              <option value="">Chọn phụ huynh có sẵn</option>
              {parents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.hoTen || `Phụ huynh #${item.id}`}
                  {item.soDienThoai ? ` - ${formatPhoneDisplay(item.soDienThoai)}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Họ tên phụ huynh</span>
            <input
              value={form.phuHuynhHoTen}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phuHuynhHoTen: event.target.value }))
              }
              placeholder="vd: Nguyễn Văn B"
            />
          </label>
          <label className="form-field">
            <span>SĐT phụ huynh</span>
            <input
              value={form.phuHuynhSdt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phuHuynhSdt: event.target.value }))
              }
              placeholder="vd: 0901234567"
            />
          </label>
          <label className="form-field">
            <span>Email phụ huynh</span>
            <input
              value={form.phuHuynhEmail}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phuHuynhEmail: event.target.value }))
              }
              placeholder="vd: phuhuynh@gmail.com"
            />
          </label>
          <label className="form-field">
            <span>Nghề nghiệp phụ huynh</span>
            <input
              value={form.phuHuynhNgheNghiep}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  phuHuynhNgheNghiep: event.target.value
                }))
              }
              placeholder="vd: Kinh doanh"
            />
          </label>
          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingStudent ? "Cập nhật" : "Thêm học sinh"}
            </button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={excelModalOpen}
        title="Nhập học sinh bằng file Excel"
        onClose={() => setExcelModalOpen(false)}
        width={760}
      >
        <div className="excel-import-wrap">
          <div className="table-meta">
            Dùng đúng biểu mẫu Việt hóa. Cột bắt buộc: Họ tên, Lớp. Các cột ID học bạ /
            ID dân tộc / ID phụ huynh sẽ mặc định là 1 nếu để trống.
          </div>

          <div className="excel-actions">
            <button type="button" className="btn-outline" onClick={handleDownloadTemplate}>
              Tải biểu mẫu mẫu
            </button>
            <label className="btn-primary excel-upload-btn">
              {importing ? "Đang nhập..." : "Chọn file Excel"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                disabled={importing}
              />
            </label>
          </div>

          {excelError && <div className="form-error">{excelError}</div>}
          {excelSuccess && <div className="table-success">{excelSuccess}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setExcelModalOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}