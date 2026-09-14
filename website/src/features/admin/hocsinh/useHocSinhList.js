import { useEffect, useMemo, useState, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext.jsx";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import * as XLSX from "xlsx-js-style";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import {
  createHocSinh,
  deleteHocSinh,
  getHocSinh,
  updateHocSinh,
  transferClass,
  transferSchool
} from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getActiveAcademicYear, getVisibleAcademicYears, sortClasses } from "../../../utils/helpers.js";
import { createPhuHuynh, getPhuHuynh, updatePhuHuynh } from "../../../api/phuhuynhApi.js";
import { getParentsForStudent, linkParentToStudent } from "../../../api/phuhuynhHocSinhApi.js";
import { createUser, getUsers } from "../../../api/userApi.js";
import {
  buildStudentEmailPreview,
  buildParentEmailPreview,
  notifyUsersUpdated,
  normalizeStudent,
  EXCEL_TEMPLATE_COLUMNS,
  EXCEL_FIELD_ALIASES,
  REQUIRED_EXCEL_FIELDS,
  normalizeText,
  parseBoolean,
  normalizePhone,
  formatPhoneDisplay,
  parseStatus,
  parseNullableNumber,
  findColumnValue,
  extractBackendError,
  normalizeDateCell,
  formatDateInput,
  getStudentStatus,
  validateStudentAgeAndYear,
  createStudentDuplicateKey,
  isDuplicateStudent,
  calculateAdmissionYear,
  generateRealisticParentName
} from "./hocSinhUtils.js";


// Phát hiện tên phụ nữ Việt Nam dựa trên chữ lót/tên phổ biến
const FEMALE_MIDDLE_NAMES = new Set([
  "thi", "thị", "ngọc", "ngoc", "thúy", "thuy", "hương", "huong",
  "lan", "linh", "hoa", "mai", "nhung", "nhi", "vy", "yến", "yen",
  "hằng", "hang", "phương", "phuong", "dung", "thu", "nga", "trang",
  "thảo", "thao", "trúc", "truc", "loan", "hạnh", "hanh", "lý", "ly",
  "kim", "bích", "bich", "cẩm", "cam", "thanh", "vân", "van"
]);

const isFemaleVietnameseName = (fullName) => {
  if (!fullName) return false;
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  // Kiểm tra chữ đệm (phần giữa) hoặc chữ lót đặc trưng của nữ
  for (let i = 1; i < parts.length - 1; i++) {
    if (FEMALE_MIDDLE_NAMES.has(parts[i])) return true;
  }
  // Kiểm tra cả tên cuối (một số tên chỉ có họ + tên)
  if (parts.length >= 2 && FEMALE_MIDDLE_NAMES.has(parts[parts.length - 1])) return true;
  return false;
};

const getStudentSortPriority = (s) => {
  const status = Number(s?.trangThai ?? s?.trang_thai ?? 1);
  const className = String(s?.lopHoc?.tenLop || s?.lop?.tenLop || "").trim();

  // Đang học và có lớp -> ưu tiên cao nhất (xếp đầu)
  if (status === 1 && className) return 1;

  // Đang học nhưng chưa xếp lớp
  if (status === 1 && !className) return 2;

  // Tốt nghiệp (status === 2) hoặc Ngừng học (status === 0) hoặc Chuyển trường (status === 3) -> về cuối danh sách
  return 3;
};

// Lấy từ hocSinhUtils để sort nếu thiếu
const compareClassThenGivenName = (a, b) => {
  // 1. So sánh độ ưu tiên trạng thái (Đang học lên trước, Tốt nghiệp/Ngừng học về cuối)
  const priorityA = getStudentSortPriority(a);
  const priorityB = getStudentSortPriority(b);
  if (priorityA !== priorityB) return priorityA - priorityB;

  // 2. Nếu cùng có lớp: So sánh lớp học (10A1 -> 10A2 -> 11A1...)
  const classA = String(a?.lopHoc?.tenLop || a?.lop?.tenLop || "").trim();
  const classB = String(b?.lopHoc?.tenLop || b?.lop?.tenLop || "").trim();
  if (classA && classB) {
    const classCompare = classA.localeCompare(classB, "vi", {
      numeric: true,
      sensitivity: "base"
    });
    if (classCompare !== 0) return classCompare;
  }

  // 3. So sánh tên (A -> Z tiếng Việt)
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

  const nameCompare = nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
  if (nameCompare !== 0) return nameCompare;

  return Number(a?.id || 0) - Number(b?.id || 0);
};

export function useHocSinhList() {
  const { confirm } = useConfirm();

  const [excelError, setExcelError] = useState("");
  const [excelSuccess, setExcelSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    lopHocId: "",
    danTocTen: "",
    tonGiao: "Không",
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const handleRefresh = () => setRefreshToggle(prev => !prev);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const { systemName } = useTheme() || {};

  const schoolName = useMemo(() => {
    if (!systemName) return "TRƯỜNG THPT";
    const trimmed = systemName.trim();
    if (trimmed.toUpperCase().startsWith("TRƯỜNG") || trimmed.toUpperCase().startsWith("THPT")) {
      return trimmed.toUpperCase();
    }
    return `TRƯỜNG THPT ${trimmed.toUpperCase()}`;
  }, [systemName]);

  const executeExportExcel = (type, classId) => {
    if (!students || students.length === 0) {
      notifyError("Không có dữ liệu để xuất");
      return;
    }
    
    // Style configurations
    const headerStyle = {
      fill: { fgColor: { rgb: "4F81BD" } },
      font: { name: "Arial", sz: 11, color: { rgb: "FFFFFF" }, bold: true },
      alignment: { vertical: "center", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
    
    const dataStyle = {
      font: { name: "Arial", sz: 11 },
      alignment: { vertical: "center", horizontal: "left" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const centerDataStyle = { ...dataStyle, alignment: { vertical: "center", horizontal: "center" } };

    const generateSheetForStudents = (studentList, sheetTitle, classNameStr) => {
      // Row 1: Tên trường
      // Row 2: DANH SÁCH HỌC SINH
      // Row 3: Lớp: ...
      // Row 4: Header
      const wsData = [
        [schoolName],
        ["DANH SÁCH HỌC SINH"],
        [`Lớp: ${classNameStr || "Tất cả"}`],
        ["STT", "Họ và tên", "Lớp", "Khối", "Giới tính", "Ngày sinh", "Số điện thoại", "Email", "Năm nhập học", "Trạng thái"]
      ];

      studentList.forEach((s, i) => {
        wsData.push([
          i + 1,
          s.hoTen || "",
          s.lopHoc?.tenLop || s.lop?.tenLop || "",
          s.lopHoc?.khoi || s.lop?.khoi || "",
          (s.gioiTinh === "NU" || s.gioiTinh === "false" || s.gioiTinh === false) ? "Nữ" : "Nam",
          s.ngaySinh || "",
          s.sdt || "",
          s.email || "",
          s.namNhapHoc || "",
          s.trangThai === 1 ? "Đang học" : "Ngừng học"
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Merge cells
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }
      ];

      // Styling
      worksheet["A1"].s = { font: { name: "Arial", sz: 12, bold: true }, alignment: { horizontal: "left" } };
      worksheet["A2"].s = { font: { name: "Arial", sz: 16, bold: true }, alignment: { horizontal: "center", vertical: "center" } };
      worksheet["A3"].s = { font: { name: "Arial", sz: 11, italic: true }, alignment: { horizontal: "center" } };

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = 3; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: "s", v: "" };
          
          if (R === 3) {
            worksheet[cellAddress].s = headerStyle;
          } else {
            // center align STT, Khối, Giới tính, Ngày sinh, SĐT, Năm, Trạng thái
            if ([0, 3, 4, 5, 6, 8, 9].includes(C)) {
              worksheet[cellAddress].s = centerDataStyle;
            } else {
              worksheet[cellAddress].s = dataStyle;
            }
          }
        }
      }

      worksheet["!cols"] = [
        { wch: 5 }, // STT
        { wch: 25 }, // Ho ten
        { wch: 10 }, // Lop
        { wch: 8 },  // Khoi
        { wch: 10 }, // Gioi tinh
        { wch: 15 }, // Ngay sinh
        { wch: 15 }, // SDT
        { wch: 25 }, // Email
        { wch: 15 }, // Nam
        { wch: 15 }  // Trang thai
      ];

      return worksheet;
    };

    const workbook = XLSX.utils.book_new();

    if (type === "CLASS") {
      if (!classId) {
        notifyError("Vui lòng chọn lớp");
        return;
      }
      const selectedClass = classes.find(c => String(c.id) === String(classId));
      if (!selectedClass) {
        notifyError("Lớp không tồn tại");
        return;
      }
      const classStudents = students.filter(s => String(s.lopHoc?.id || s.lop?.id) === String(classId));
      if (classStudents.length === 0) {
        notifyError("Lớp này chưa có học sinh");
        return;
      }
      const sortedStudents = [...classStudents].sort(compareClassThenGivenName);
      const ws = generateSheetForStudents(sortedStudents, selectedClass.tenLop, selectedClass.tenLop);
      XLSX.utils.book_append_sheet(workbook, ws, selectedClass.tenLop);
      XLSX.writeFile(workbook, `DanhSachHocSinh_${selectedClass.tenLop}.xlsx`);

    } else if (type === "ALL") {
      // Group by class
      const classGroups = {};
      students.forEach(s => {
        const cId = s.lopHoc?.id || s.lop?.id || "unknown";
        const cName = s.lopHoc?.tenLop || s.lop?.tenLop || "Chưa có lớp";
        if (!classGroups[cId]) {
          classGroups[cId] = { name: cName, students: [] };
        }
        classGroups[cId].students.push(s);
      });

      // Sort class names nicely
      const sortedGroups = Object.values(classGroups).sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }));

      sortedGroups.forEach(group => {
        group.students.sort(compareClassThenGivenName);
        // Valid sheet name max 31 chars
        const sheetName = group.name.substring(0, 31).replace(/[\\/?*[\]]/g, "_");
        const ws = generateSheetForStudents(group.students, sheetName, group.name);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      XLSX.writeFile(workbook, `DanhSachHocSinh_TatCa.xlsx`);
    }
    
    notifySuccess("Xuất Excel thành công");
    setExportModalOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterMenuOpen(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm học sinh...");
    setIsSearchVisible(true);
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);
  const [namHocList, setNamHocList] = useState([]);
  const [yearFilter, setYearFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [transferClassModalOpen, setTransferClassModalOpen] = useState(false);
  const [transferSchoolModalOpen, setTransferSchoolModalOpen] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState(null);

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
        const [hsRes, lopRes, phRes, nhRes] = await Promise.allSettled([
          getHocSinh(),
          getLop(),
          getPhuHuynh(),
          getNamHoc()
        ]);
        if (!active) return;
        let visibleYears = [];
        let activeYrName = "";
        if (nhRes.status === "fulfilled") {
          const rawYears = nhRes.value?.data?.data || [];
          visibleYears = getVisibleAcademicYears(rawYears);
          setNamHocList(visibleYears);
          const activeYr = getActiveAcademicYear(visibleYears) || visibleYears[0];
          activeYrName = activeYr?.tenNamHoc || "";
        }
        if (hsRes.status === "fulfilled") {
          const hsData = hsRes.value?.data?.data;
          const hsList = Array.isArray(hsData) ? hsData : (hsData?.content || []);
          setStudents(hsList.map(normalizeStudent));
        }
        if (lopRes.status === "fulfilled") {
          const rawClasses = lopRes.value?.data?.data || [];
          if (visibleYears.length > 0) {
            const validYearSet = new Set(visibleYears.map(y => y.tenNamHoc));
            setClasses(rawClasses.filter(c => !c.namHoc || validYearSet.has(c.namHoc)));
          } else {
            setClasses(rawClasses);
          }
        }
        if (phRes.status === "fulfilled") {
          setParents(phRes.value?.data?.data || []);
        }

        setYearFilter((prev) => {
          if (prev === "all" || !prev) {
            return activeYrName || "all";
          }
          return prev;
        });

        if (hsRes.status === "rejected" || lopRes.status === "rejected") {
          setError("Không thể tải đầy đủ dữ liệu học sinh/lớp.");
        }
      } catch (err) {
        if (!active) return;
        console.error("[useHocSinhList] fetchData lỗi:", err);
        setError("Không thể tải danh sách học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [refreshToggle]);

  const stats = useMemo(() => {
    const total = students.length;
    const activeCount = students.filter((item) => getStudentStatus(item) === 1).length;
    const pausedCount = total - activeCount;
    return { total, activeCount, pausedCount };
  }, [students]);

  const academicYears = useMemo(() => {
    const set = new Set();
    if (namHocList.length > 0) {
      namHocList.forEach(y => { if (y.tenNamHoc) set.add(y.tenNamHoc); });
    }
    classes.forEach((c) => {
      if (c?.namHoc) set.add(c.namHoc);
    });
    students.forEach((s) => {
      if (Array.isArray(s?.namHocList)) {
        s.namHocList.forEach(y => { if (y) set.add(y); });
      }
      const yr = s?.lopHoc?.namHoc || s?.lop?.namHoc;
      if (yr) set.add(yr);
    });
    return Array.from(set).sort().reverse();
  }, [namHocList, classes, students]);

  const filteredStudents = useMemo(() => {
    const lower = keyword.toLowerCase();
    const source = students.filter((student) => {
      const matchKeyword = keyword.trim()
        ? [student.hoTen, student.sdt, student.email, student?.lopHoc?.tenLop, student?.lop?.tenLop]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(lower))
        : true;

      const studentYears = Array.isArray(student?.namHocList) && student.namHocList.length > 0
        ? student.namHocList
        : [String(student?.lopHoc?.namHoc || student?.lop?.namHoc || "")].filter(Boolean);

      const studentGrade = String(student?.lopHoc?.khoi || student?.lop?.khoi || "");
      const studentClassId = String(student?.lopHoc?.id || student?.lop?.id || "");

      const matchYear = yearFilter === "all" ? true : studentYears.includes(yearFilter);
      const matchGrade = gradeFilter === "all" ? true : studentGrade === gradeFilter;
      const matchClass = classFilter === "all" ? true : studentClassId === classFilter;

      return matchKeyword && matchYear && matchGrade && matchClass;
    });

    return [...source].sort(compareClassThenGivenName);
  }, [keyword, students, yearFilter, gradeFilter, classFilter]);

  const classesByGrade = useMemo(() => {
    const map = new Map();
    const classesForGrade = yearFilter === "all"
      ? classes
      : classes.filter((item) => String(item?.namHoc || "") === yearFilter);

    classesForGrade.forEach((item) => {
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
  }, [classes, yearFilter]);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const matchYear = yearFilter === "all" ? true : String(item?.namHoc || "") === yearFilter;
      const matchGrade = gradeFilter === "all" ? true : String(item?.khoi || "") === gradeFilter;
      return matchYear && matchGrade;
    }).slice().sort(sortClasses);
  }, [classes, yearFilter, gradeFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents.length, pageSize]);

  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize, yearFilter, gradeFilter, classFilter]);

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
      return;
    }
    const found = classes.find((c) => String(c.id) === String(classId));
    if (found) {
      if (found.khoi !== undefined && found.khoi !== null) {
        setGradeFilter(String(found.khoi));
      }
      if (found.namHoc) {
        setYearFilter(found.namHoc);
      }
    }
  };

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingStudent(null);
    const initialClass = filteredClasses[0] || classes[0];
    const initialLopId = initialClass?.id ? String(initialClass.id) : "";
    const initialNamNhapHoc = initialClass
      ? calculateAdmissionYear(initialClass.namHoc, initialClass.khoi)
      : new Date().getFullYear();

    setForm({
      hoTen: "",
      ngaySinh: "",
      gioiTinh: "true",
      lopHocId: initialLopId,
      danTocTen: "Kinh",
      tonGiao: "Không",
      phuHuynhId: "",
      phuHuynhHoTen: "",
      phuHuynhSdt: "",
      phuHuynhEmail: "",
      phuHuynhNgheNghiep: "",
      sdt: "",
      email: "",
      diaChi: "",
      namNhapHoc: initialNamNhapHoc,
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
          // ignore
        }
      }

      const currentClassId = student?.lopHoc?.id || student?.lop?.id;
      const currentClass = classes.find((c) => String(c.id) === String(currentClassId || ""));
      const computedNamNhapHoc = currentClass
        ? calculateAdmissionYear(currentClass.namHoc, currentClass.khoi)
        : (student.namNhapHoc !== null && student.namNhapHoc !== undefined
            ? Number(student.namNhapHoc)
            : new Date().getFullYear());

      setForm({
        hoTen: student.hoTen || "",
        ngaySinh: formatDateInput(student.ngaySinh),
        gioiTinh: (student.gioiTinh === "NU" || student.gioiTinh === "false" || student.gioiTinh === false) ? "false" : "true",
        lopHocId: currentClassId ? String(currentClassId) : "",
        danTocTen: student?.danToc || "",
        tonGiao: student?.tonGiao || "Không",
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
        namNhapHoc: computedNamNhapHoc,
        maBhyt: student.maBhyt || "",
        dienChinhSach: String(student.dienChinhSach ?? false),
        trangThai: student.trangThai ?? (student.user?.isActive ? 1 : 0)
      });
      setFormError("");
      setSuccessMessage("");
      setModalOpen(true);
    })();
  };

  const submitTransferClass = async (lopId) => {
    if (!transferringStudent) return;
    try {
      await transferClass(transferringStudent.id, lopId);
      
      const newLop = classes.find(c => String(c.id) === String(lopId));
      if (newLop) {
        setStudents(prev => prev.map(s => s.id === transferringStudent.id ? { ...s, lop: newLop, lopHoc: newLop } : s));
      }

      notifySuccess("Chuyển lớp thành công!");
      setTransferClassModalOpen(false);
      setTransferringStudent(null);
      // Optional: handleRefresh(); // Skip refresh to avoid loading skeleton flash
    } catch (err) {
      notifyError("Lỗi khi chuyển lớp: " + extractBackendError(err));
    }
  };

  const submitTransferSchool = async (truongMoi) => {
    if (!transferringStudent) return;
    if (!truongMoi?.trim()) {
      notifyError("Vui lòng nhập tên trường chuyển đến");
      return;
    }
    try {
      await transferSchool(transferringStudent.id, truongMoi);
      
      setStudents(prev => prev.map(s => s.id === transferringStudent.id ? { ...s, trangThai: 3, truongChuyenDen: truongMoi } : s));

      notifySuccess("Chuyển trường thành công!");
      setTransferSchoolModalOpen(false);
      setTransferringStudent(null);
      // Optional: handleRefresh();
    } catch (err) {
      notifyError("Lỗi khi chuyển trường: " + extractBackendError(err));
    }
  };

  const handleDelete = async (student) => {
    if (!(await confirm(`Xóa học sinh ${student.hoTen}?`))) return;
    try {
      await deleteHocSinh(student.id);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, trangThai: 0 } : s));
      notifySuccess("Đã cập nhật trạng thái ngừng học");
      // Cập nhật lại danh sách phụ huynh nếu có phụ huynh không còn con bị dọn dẹp
      getPhuHuynh().then(res => {
        if (res?.data?.data) setParents(res.data.data);
      }).catch(() => {});
    } catch (err) {
      setError("Không thể xóa học sinh.");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    
    // 1. Kiểm tra thông tin học sinh
    const studentName = form.hoTen.trim();
    if (!studentName) {
      setFormError("Vui lòng nhập họ và tên học sinh.");
      return;
    }
    const nameWords = studentName.split(/\s+/);
    if (nameWords.length < 2) {
      setFormError("Họ và tên học sinh phải có ít nhất 2 từ (vd: Nguyễn Văn A).");
      return;
    }
    const VI_NAME_REGEX = /^[A-Za-zÀ-ỹĐđ\s]+$/;
    if (!VI_NAME_REGEX.test(studentName)) {
      setFormError("Họ và tên học sinh chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hay ký tự đặc biệt.");
      return;
    }
    if (!form.ngaySinh) {
      setFormError("Vui lòng chọn ngày sinh học sinh.");
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
    if (!VI_NAME_REGEX.test(ethnicityName)) {
      setFormError("Tên dân tộc chỉ được chứa chữ cái tiếng Việt, không chứa số hay ký tự đặc biệt.");
      return;
    }
    const religionName = (form.tonGiao || "").trim();
    if (!religionName) {
      setFormError("Vui lòng chọn hoặc nhập tôn giáo.");
      return;
    }
    if (!VI_NAME_REGEX.test(religionName)) {
      setFormError("Tên tôn giáo chỉ được chứa chữ cái tiếng Việt, không chứa số hay ký tự đặc biệt.");
      return;
    }
    const studentPhone = form.sdt.trim();
    if (!studentPhone) {
      setFormError("Vui lòng nhập số điện thoại học sinh.");
      return;
    }
    if (!/^0\d{9}$/.test(studentPhone)) {
      setFormError("Số điện thoại học sinh phải gồm 10 chữ số và bắt đầu bằng số 0.");
      return;
    }
    const addressStr = form.diaChi.trim();
    if (!addressStr) {
      setFormError("Vui lòng nhập địa chỉ học sinh.");
      return;
    }
    const ADDRESS_REGEX = /^[A-Za-zÀ-ỹĐđ0-9\s,\/\.\-]+$/;
    if (!ADDRESS_REGEX.test(addressStr)) {
      setFormError("Địa chỉ học sinh không được chứa ký tự đặc biệt không hợp lệ (vd: @, #, $, %, ^, &, *, <, >).");
      return;
    }
    if (!form.namNhapHoc) {
      setFormError("Vui lòng chọn năm nhập học.");
      return;
    }
    const bhytStr = form.maBhyt.trim();
    if (!bhytStr) {
      setFormError("Vui lòng nhập mã BHYT học sinh.");
      return;
    }
    if (!/^[A-Za-z0-9]{10,15}$/.test(bhytStr)) {
      setFormError("Mã BHYT học sinh phải gồm 10-15 ký tự chữ và số, không chứa ký tự đặc biệt hay khoảng trắng (vd: HS1234567890).");
      return;
    }

    // 2. Kiểm tra thông tin phụ huynh
    const danTocId = editingStudent?.danTocId || 1;
    let phuHuynhId = form.phuHuynhId ? Number(form.phuHuynhId) : null;

    if (!phuHuynhId) {
      const parentName = form.phuHuynhHoTen.trim();
      const parentPhone = form.phuHuynhSdt.trim();
      const parentJob = form.phuHuynhNgheNghiep.trim();
      const parentEmail = form.phuHuynhEmail.trim();

      if (!parentName) {
        setFormError("Vui lòng chọn phụ huynh có sẵn hoặc nhập họ tên phụ huynh mới.");
        return;
      }
      const parentWords = parentName.split(/\s+/);
      if (parentWords.length < 2) {
        setFormError("Họ và tên phụ huynh phải có ít nhất 2 từ (vd: Nguyễn Văn B).");
        return;
      }
      if (!VI_NAME_REGEX.test(parentName)) {
        setFormError("Họ và tên phụ huynh chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hay ký tự đặc biệt.");
        return;
      }
      if (!parentPhone) {
        setFormError("Vui lòng nhập số điện thoại phụ huynh.");
        return;
      }
      if (!/^0\d{9}$/.test(parentPhone)) {
        setFormError("Số điện thoại phụ huynh phải gồm 10 chữ số và bắt đầu bằng số 0.");
        return;
      }
      if (!parentJob) {
        setFormError("Vui lòng nhập nghề nghiệp phụ huynh.");
        return;
      }
      if (!ADDRESS_REGEX.test(parentJob)) {
        setFormError("Nghề nghiệp phụ huynh không được chứa ký tự đặc biệt không hợp lệ.");
        return;
      }
      if (parentEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(parentEmail)) {
        setFormError("Email phụ huynh không đúng định dạng (vd: phuhuynh@gmail.com).");
        return;
      }

      // Tự động kiểm tra phụ huynh đã tồn tại theo số điện thoại hoặc email trong danh sách phụ huynh hiện có
      const rawPhoneDigits = parentPhone.replace(/\D/g, "");
      const matchedParent = parents.find((p) => {
        if (!p) return false;
        const pPhone = String(p.soDienThoai || p.sdt || "").replace(/\D/g, "");
        if (pPhone && rawPhoneDigits && pPhone === rawPhoneDigits) return true;
        if (parentEmail && p.email && p.email.toLowerCase() === parentEmail.toLowerCase()) return true;
        return false;
      });

      if (matchedParent?.id) {
        phuHuynhId = Number(matchedParent.id);
      } else {
        try {
          const candidateEmail =
            parentEmail ||
            buildParentEmailPreview(parentName, parentPhone);
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
            hoTen: parentName,
            soDienThoai: parentPhone,
            email: form.phuHuynhEmail.trim() || null,
            diaChi: form.diaChi.trim() || null,
            ngheNghiep: parentJob,
            quanHe: isFemaleVietnameseName(parentName) ? "ME" : "CHA",
            isSmSActive: true
          };
          if (createdUserId) phPayload.user = { id: Number(createdUserId) };

          const phRes = await createPhuHuynh(phPayload);
          const createdParent = phRes?.data?.data;
          if (createdParent?.id) {
            phuHuynhId = Number(createdParent.id);
            setParents((prev) => {
              const exists = prev.some((p) => String(p.id) === String(createdParent.id));
              return exists ? prev : [createdParent, ...prev];
            });
          }
        } catch {
          setFormError("Không thể tạo thông tin phụ huynh.");
          return;
        }
      }
    }

    if (!phuHuynhId) {
      setFormError("Vui lòng chọn phụ huynh có sẵn hoặc nhập đầy đủ thông tin phụ huynh.");
      return;
    }

    const selectedClass = classes.find((c) => String(c.id) === String(form.lopHocId));
    let selectedKhoi = selectedClass?.khoi;
    const finalNamNhapHoc = form.namNhapHoc
      ? Number(form.namNhapHoc)
      : (selectedClass ? calculateAdmissionYear(selectedClass.namHoc, selectedClass.khoi) : new Date().getFullYear());

    const studentAgeError = validateStudentAgeAndYear(form.ngaySinh, finalNamNhapHoc, selectedKhoi, selectedClass?.namHoc);
    if (studentAgeError) {
      setFormError(studentAgeError);
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      ngaySinh: form.ngaySinh || null,
      gioiTinh: form.gioiTinh === "true" ? "NAM" : "NU",
      lop: form.lopHocId ? { id: Number(form.lopHocId) } : null,
      hocBaId: editingStudent?.hocBaId || 1,
      danToc: danTocId ? { id: Number(danTocId) } : { id: 1 },
      phuHuynhId,
      tonGiao: form.tonGiao ? form.tonGiao.trim() : "Không",
      sdt: form.sdt.trim() || null,
      email: editingStudent
        ? form.email.trim() || null
        : buildStudentEmailPreview(form.hoTen) || null,
      diaChi: form.diaChi.trim() || null,
      namNhapHoc: finalNamNhapHoc,
      maBhyt: form.maBhyt.trim() || null,
      dienChinhSach: form.dienChinhSach === "true",
      trangThai: Number(form.trangThai)
    };

    try {
      if (editingStudent) {
        const response = await updateHocSinh(editingStudent.id, payload);
        if (phuHuynhId) {
          try {
            await updatePhuHuynh(phuHuynhId, {
              hoTen: form.phuHuynhHoTen.trim() || null,
              soDienThoai: form.phuHuynhSdt.trim() || null,
              email: form.phuHuynhEmail.trim() || null,
              ngheNghiep: form.phuHuynhNgheNghiep.trim() || null,
              quanHe: isFemaleVietnameseName(form.phuHuynhHoTen) ? "ME" : "CHA",
              isSmSActive: true
            });
            // Update the local parents state to reflect the change
            setParents((prev) =>
              prev.map((p) =>
                p.id === phuHuynhId
                  ? {
                      ...p,
                      hoTen: form.phuHuynhHoTen.trim() || null,
                      soDienThoai: form.phuHuynhSdt.trim() || null,
                      email: form.phuHuynhEmail.trim() || null,
                      ngheNghiep: form.phuHuynhNgheNghiep.trim() || null,
                    }
                  : p
              )
            );
          } catch (e) {
            console.error("Lỗi cập nhật phụ huynh:", e);
          }
        }
        if (phuHuynhId && editingStudent?.id) {
          try {
            await linkParentToStudent(editingStudent.id, phuHuynhId);
          } catch (linkErr) {
            console.warn("Lỗi liên kết phụ huynh cho học sinh:", linkErr);
          }
        }
        const updated = normalizeStudent(response?.data?.data);
        if (updated && updated.phuHuynh && phuHuynhId) {
          updated.phuHuynh.hoTen = form.phuHuynhHoTen.trim() || null;
          updated.phuHuynh.soDienThoai = form.phuHuynhSdt.trim() || null;
          updated.phuHuynh.email = form.phuHuynhEmail.trim() || null;
          updated.phuHuynh.ngheNghiep = form.phuHuynhNgheNghiep.trim() || null;
        }
        setStudents((prev) =>
          prev.map((item) => (item.id === editingStudent.id ? updated : item))
        );
      } else {
        const response = await createHocSinh(payload);
        const created = normalizeStudent(response?.data?.data);
        if (created?.id && phuHuynhId) {
          try {
            await linkParentToStudent(created.id, phuHuynhId);
          } catch (linkErr) {
            console.warn("Lỗi liên kết phụ huynh cho học sinh mới:", linkErr);
          }
        }
        const selectedClass = classes.find(
          (item) => String(item.id) === String(form.lopHocId)
        );
        const linkedParentObj = parents.find((p) => Number(p.id) === Number(phuHuynhId)) || null;
        const normalizedCreated = {
          ...created,
          lopHoc: created?.lopHoc || created?.lop || selectedClass || null,
          email: created?.email || buildStudentEmailPreview(form.hoTen),
          phuHuynhId: created?.phuHuynhId || phuHuynhId || null,
          phuHuynh: created?.phuHuynh || linkedParentObj
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

    // Style the header row (row 1)
    for (let i = 0; i < EXCEL_TEMPLATE_COLUMNS.length; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        fill: {
          fgColor: { rgb: "4F81BD" } // Màu nền xanh biển
        },
        font: {
          name: "Arial",
          sz: 11,
          color: { rgb: "FFFFFF" }, // Chữ trắng
          bold: true
        },
        alignment: {
          vertical: "center",
          horizontal: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Căn chỉnh độ rộng cột cho đẹp
    worksheet["!cols"] = [
      { wch: 25 }, // Họ tên
      { wch: 15 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 10 }, // Lớp
      { wch: 15 }, // Số điện thoại
      { wch: 35 }, // Địa chỉ
      { wch: 15 }, // Năm nhập học
      { wch: 20 }, // Mã BHYT
      { wch: 10 }, // Dân tộc
      { wch: 10 }, // Tôn giáo
      { wch: 15 }, // Diện chính sách
      { wch: 15 }, // Trạng thái
      { wch: 25 }, // Phụ huynh - Họ tên
      { wch: 15 }, // Phụ huynh - SĐT
      { wch: 30 }, // Phụ huynh - Email
      { wch: 20 }, // Phụ huynh - Nghề nghiệp
      { wch: 20 }  // ID phụ huynh
    ];

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

      // Xác định năm học mục tiêu khi import:
      // Ưu tiên năm học đang lọc (yearFilter khác 'all'), nếu 'all' thì lấy năm học hiện hành
      const activeAcademicYearObj = getActiveAcademicYear(namHocList) || namHocList[0];
      const targetNamHoc = (yearFilter && yearFilter !== "all")
        ? yearFilter
        : (activeAcademicYearObj?.tenNamHoc || "");

      // Danh sách lớp thuộc năm học mục tiêu
      const activeYearClasses = targetNamHoc
        ? classes.filter((lop) => String(lop.namHoc || "").trim() === targetNamHoc.trim())
        : classes;

      const classMap = new Map();
      activeYearClasses.forEach((lop) => {
        classMap.set(normalizeText(lop.tenLop), lop);
      });

      const findClassForStudent = (className, rowNamHoc) => {
        const normName = normalizeText(className);
        if (!normName) return null;

        const effectiveNamHoc = String(rowNamHoc || targetNamHoc || "").trim();
        if (effectiveNamHoc) {
          return (
            classes.find(
              (c) =>
                normalizeText(c.tenLop) === normName &&
                String(c.namHoc || "").trim() === effectiveNamHoc
            ) || null
          );
        }
        return classMap.get(normName) || null;
      };

      const fuzzyFindClass = (normName, rowNamHoc) => {
        if (!normName) return null;
        const exact = findClassForStudent(normName, rowNamHoc);
        if (exact) return exact;

        const effectiveNamHoc = String(rowNamHoc || targetNamHoc || "").trim();
        const pool = effectiveNamHoc
          ? classes.filter((c) => String(c.namHoc || "").trim() === effectiveNamHoc)
          : activeYearClasses;

        for (const lop of pool) {
          const key = normalizeText(lop.tenLop);
          if (key === normName) return lop;
        }
        const simple = normName.replace(/[^a-z0-9]/g, "");
        for (const lop of pool) {
          const key = normalizeText(lop.tenLop).replace(/[^a-z0-9]/g, "");
          if (key === simple) return lop;
        }
        return null;
      };

      const allCollectedRows = [];
      let processedSheetCount = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Đọc toàn bộ dưới dạng mảng thô để phát hiện header
        const allRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: false  // ✅ FIX: raw: false giúp giá trị Date được format đúng khi dùng với cellDates
        });

        if (!allRows || allRows.length === 0) continue;

        // Tìm dòng header trong 5 dòng đầu
        let headerRowIndex = -1;
        let headerArray = null;

        for (let i = 0; i < Math.min(5, allRows.length); i += 1) {
          const hdr = allRows[i] || [];
          const normalized = new Set(hdr.map((h) => normalizeText(String(h || ""))));
          const hasHoTen = EXCEL_FIELD_ALIASES.hoTen.some((alias) => normalized.has(normalizeText(alias)));
          const hasLop = EXCEL_FIELD_ALIASES.lop.some((alias) => normalized.has(normalizeText(alias)));
          const sheetClassMatch = classMap.get(normalizeText(sheetName)) || fuzzyFindClass(normalizeText(sheetName));
          if (hasHoTen && (hasLop || sheetClassMatch)) {
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
            const hasHoTen = EXCEL_FIELD_ALIASES.hoTen.some((alias) => normalizedCombined.has(normalizeText(alias)));
            const hasLop = EXCEL_FIELD_ALIASES.lop.some((alias) => normalizedCombined.has(normalizeText(alias)));
            const sheetClassMatch = classMap.get(normalizeText(sheetName)) || fuzzyFindClass(normalizeText(sheetName));
            if (hasHoTen && (hasLop || sheetClassMatch)) {
              headerRowIndex = span;
              headerArray = combined;
              break;
            }
          }
        }

        if (headerRowIndex >= 0) {
          const header = headerArray || allRows[headerRowIndex].map((h) => String(h || ""));
          const dataRows = allRows.slice(headerRowIndex + 1);
          const baseRowNumber = headerRowIndex + 2;

          dataRows.forEach((r, idx) => {
            const obj = {};
            for (let c = 0; c < header.length; c += 1) {
              const key = header[c] || `COL_${c}`;
              obj[key] = r[c] === undefined ? "" : r[c];
            }
            const rawClass = findColumnValue(obj, EXCEL_FIELD_ALIASES.lop);
            if (!rawClass || String(rawClass).trim() === "") {
              obj["Lớp"] = sheetName;
            }
            allCollectedRows.push({
              row: obj,
              rowNumber: baseRowNumber + idx,
              sheetName
            });
          });
          processedSheetCount += 1;
        } else {
          // Fallback: sheet_to_json default
          const tmp = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
          if (tmp && tmp.length > 0) {
            const normalizedHeaders = new Set(
              Object.keys(tmp[0] || {}).map((h) => normalizeText(h))
            );
            const hasHoTen = EXCEL_FIELD_ALIASES.hoTen.some((alias) => normalizedHeaders.has(normalizeText(alias)));
            const hasLop = EXCEL_FIELD_ALIASES.lop.some((alias) => normalizedHeaders.has(normalizeText(alias)));
            const sheetClassMatch = classMap.get(normalizeText(sheetName)) || fuzzyFindClass(normalizeText(sheetName));
            if (hasHoTen && (hasLop || sheetClassMatch)) {
              tmp.forEach((rowObj, idx) => {
                const rawClass = findColumnValue(rowObj, EXCEL_FIELD_ALIASES.lop);
                if (!rawClass || String(rawClass).trim() === "") {
                  rowObj["Lớp"] = sheetName;
                }
                allCollectedRows.push({
                  row: rowObj,
                  rowNumber: 2 + idx,
                  sheetName
                });
              });
              processedSheetCount += 1;
            }
          }
        }
      }

      if (allCollectedRows.length === 0) {
        setExcelError("Không tìm thấy dữ liệu học sinh hợp lệ trong các sheet của file Excel.");
        return;
      }

      // ✅ Cache phụ huynh đã tạo trong lần import để tránh tạo trùng
      const dynamicParents = [...(parents || [])];
      const createdParentCache = new Map(); // key: email hoặc sdt hoặc hoTen → parent object / phuHuynhId

      const createdStudents = [];
      const failedRows = [];
      let totalNonEmptyRows = 0;

      const isMultiSheet = workbook.SheetNames.length > 1;

      // PRE-VALIDATION PASS
      const seenInFileMap = new Map(); // key -> rowLabel
      const fileDuplicates = [];
      const missingClasses = new Set();
      const missingHoTenRows = [];
      const ageErrors = new Set();

      for (const item of allCollectedRows) {
        const { row, rowNumber, sheetName } = item;
        const rowLabel = isMultiSheet ? `[${sheetName}] Dòng ${rowNumber}` : `Dòng ${rowNumber}`;
        const isEmptyRow = Object.values(row || {}).every(
          (v) => v === null || v === undefined || String(v || "").trim() === ""
        );
        if (isEmptyRow) continue;
        
        totalNonEmptyRows += 1;

        const className = String(findColumnValue(row, EXCEL_FIELD_ALIASES.lop) || "").trim();
        const rowNamHoc = String(findColumnValue(row, EXCEL_FIELD_ALIASES.namHoc) || "").trim() || targetNamHoc;
        const normClassName = normalizeText(className);
        let classMatch = findClassForStudent(className, rowNamHoc);
        if (!classMatch) classMatch = fuzzyFindClass(normClassName, rowNamHoc);

        const fullName = String(findColumnValue(row, EXCEL_FIELD_ALIASES.hoTen) || "").trim();

        if (!fullName) {
          missingHoTenRows.push(rowLabel);
          continue;
        }

        if (!classMatch) {
          missingClasses.add(className || "(trống)");
          continue;
        }

        const ngaySinhRaw = findColumnValue(row, EXCEL_FIELD_ALIASES.ngaySinh);
        const ngaySinhNormalized = normalizeDateCell(ngaySinhRaw);
        const namNhapHoc = calculateAdmissionYear(classMatch.namHoc || rowNamHoc, classMatch.khoi);

        const ageError = validateStudentAgeAndYear(ngaySinhNormalized, namNhapHoc, classMatch.khoi);
        if (ageError) {
          ageErrors.add(ageError);
        }

        // Kiểm tra trùng lặp nội bộ trong file Excel
        const fileKey = createStudentDuplicateKey(fullName, ngaySinhNormalized, classMatch.id);
        if (seenInFileMap.has(fileKey)) {
          fileDuplicates.push(`${rowLabel} trùng học sinh '${fullName}' (${ngaySinhNormalized || "không có ngày sinh"}) với ${seenInFileMap.get(fileKey)}`);
        } else {
          seenInFileMap.set(fileKey, rowLabel);
        }
      }

      // Xử lý thông báo lỗi ngắn gọn 1 dòng duy nhất
      if (missingClasses.size > 0) {
        const classNames = Array.from(missingClasses).map((c) => `'${c}'`).join(", ");
        setExcelError(
          `Lớp ${classNames} chưa được tạo trong năm học ${targetNamHoc || ""}. Vui lòng tạo lớp học trước khi nhập.`
        );
        setImporting(false);
        event.target.value = "";
        return;
      }

      if (missingHoTenRows.length > 0) {
        setExcelError(
          `Thiếu cột Họ tên tại ${missingHoTenRows.slice(0, 3).join(", ")}${missingHoTenRows.length > 3 ? ` và ${missingHoTenRows.length - 3} dòng khác` : ""}.`
        );
        setImporting(false);
        event.target.value = "";
        return;
      }

      if (fileDuplicates.length > 0) {
        setExcelError(`Tệp Excel có học sinh trùng lặp: ${fileDuplicates[0]}.`);
        setImporting(false);
        event.target.value = "";
        return;
      }

      if (ageErrors.size > 0) {
        setExcelError(`Lỗi độ tuổi: ${Array.from(ageErrors)[0]}.`);
        setImporting(false);
        event.target.value = "";
        return;
      }

      // EXECUTION PASS
      let skippedDuplicatesCount = 0;
      const skippedNames = [];

      for (const item of allCollectedRows) {
        const { row, rowNumber, sheetName } = item;
        const rowLabel = isMultiSheet ? `[${sheetName}] Dòng ${rowNumber}` : `Dòng ${rowNumber}`;

        // Bỏ qua dòng trống hoàn toàn
        const isEmptyRow = Object.values(row || {}).every(
          (v) => v === null || v === undefined || String(v || "").trim() === ""
        );
        if (isEmptyRow) continue;

        const className = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.lop) || ""
        ).trim();
        const rowNamHoc = String(findColumnValue(row, EXCEL_FIELD_ALIASES.namHoc) || "").trim() || targetNamHoc;
        const normClassName = normalizeText(className);
        let classMatch = findClassForStudent(className, rowNamHoc);
        if (!classMatch) classMatch = fuzzyFindClass(normClassName, rowNamHoc);

        if (!classMatch) {
          failedRows.push(`${rowLabel}: Lớp '${className || "(trống)"}' chưa được tạo trong năm học ${rowNamHoc || targetNamHoc || ""}`);
          continue;
        }

        const fullName = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.hoTen) || ""
        ).trim();

        const ngaySinhRaw = findColumnValue(row, EXCEL_FIELD_ALIASES.ngaySinh);
        const ngaySinhNormalized = normalizeDateCell(ngaySinhRaw);
        const maBhyt = String(findColumnValue(row, EXCEL_FIELD_ALIASES.maBhyt) || "").trim() || null;

        // ✅ BỎ QUA HỌC SINH ĐÃ TỒN TẠI TRONG DATABASE
        const candidateStudent = {
          hoTen: fullName,
          ngaySinh: ngaySinhNormalized,
          lopId: classMatch.id,
          maBhyt: maBhyt
        };

        if (isDuplicateStudent(candidateStudent, students)) {
          skippedDuplicatesCount += 1;
          if (skippedNames.length < 5) {
            skippedNames.push(fullName);
          }
          continue; // Bỏ qua học sinh này, không tạo trùng
        }

        const hocBaId =
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.hocBaId)) ?? 1;
        const danTocId =
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.danTocId)) ?? 1;

        // Xử lý phụ huynh: ưu tiên ID có sẵn → tên/SĐT trong Excel → tự động tạo phụ huynh cho học sinh
        let phuHuynhId =
          parseNullableNumber(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhIdOptional)
          ) ??
          parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhId)) ??
          null;

        let resolvedParentObj = null;

        if (phuHuynhId) {
          resolvedParentObj = dynamicParents.find((p) => Number(p.id) === Number(phuHuynhId)) || null;
        }

        if (!phuHuynhId) {
          let phHoTen = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhHoTen) || ""
          ).trim();
          let phSdt = normalizePhone(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhSdt) || ""
          );
          let phEmail = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhEmail) || ""
          ).trim();
          const phNgheNghiep = String(
            findColumnValue(row, EXCEL_FIELD_ALIASES.phuHuynhNgheNghiep) || ""
          ).trim();

          // Nếu dòng Excel không có thông tin phụ huynh, tự động tạo phụ huynh với họ tên chuẩn xác theo họ học sinh
          phHoTen = generateRealisticParentName(fullName, phHoTen);

          if (!phSdt || !/^0[0-9]{9}$/.test(phSdt)) {
            phSdt = `09${String(Date.now() + Math.floor(Math.random() * 1000000)).slice(-8)}`;
          }

          const cacheKey = (phEmail || phSdt || phHoTen).toLowerCase();

          if (cacheKey && createdParentCache.has(cacheKey)) {
            const cached = createdParentCache.get(cacheKey);
            if (typeof cached === "object" && cached?.id) {
              phuHuynhId = Number(cached.id);
              resolvedParentObj = cached;
            } else if (cached) {
              phuHuynhId = Number(cached);
              resolvedParentObj = dynamicParents.find((p) => Number(p.id) === Number(phuHuynhId)) || null;
            }
          }

          if (!phuHuynhId) {
            try {
              // Tìm phụ huynh đã có sẵn trong danh sách
              const existingParent = dynamicParents.find((p) => {
                if (phEmail && String(p.email || "").toLowerCase() === phEmail.toLowerCase()) return true;
                if (phSdt && String(p.soDienThoai || "") === phSdt) return true;
                if (phHoTen && String(p.hoTen || "").toLowerCase() === phHoTen.toLowerCase()) return true;
                return false;
              });

              if (existingParent?.id) {
                phuHuynhId = Number(existingParent.id);
                resolvedParentObj = existingParent;
                if (cacheKey) createdParentCache.set(cacheKey, existingParent);
              } else {
                const candidateEmail = phEmail || buildParentEmailPreview(phHoTen, phSdt);
                const phPayload = {
                  hoTen: phHoTen,
                  soDienThoai: phSdt,
                  email: candidateEmail,
                  diaChi: String(findColumnValue(row, EXCEL_FIELD_ALIASES.diaChi) || "").trim() || null,
                  ngheNghiep: phNgheNghiep || "Kinh doanh",
                  quanHe: isFemaleVietnameseName(phHoTen) ? "ME" : "CHA",
                  isSmSActive: true
                };

                const phRes = await createPhuHuynh(phPayload);
                const createdParent = phRes?.data?.data;
                if (createdParent?.id) {
                  phuHuynhId = Number(createdParent.id);
                  resolvedParentObj = createdParent;
                  dynamicParents.unshift(createdParent);
                  setParents((prev) => [createdParent, ...prev]);
                  if (cacheKey) createdParentCache.set(cacheKey, createdParent);
                }
              }
            } catch (pErr) {
              console.warn("Lỗi khi tạo phụ huynh cho học sinh:", fullName, pErr);
            }
          }
        }

        // Fallback an toàn nếu vẫn chưa có
        if (!phuHuynhId && dynamicParents.length > 0) {
          phuHuynhId = Number(dynamicParents[0].id);
          resolvedParentObj = dynamicParents[0];
        }

        const payload = {
          hoTen: fullName,
          ngaySinh: ngaySinhNormalized,
          gioiTinh: parseBoolean(
            findColumnValue(row, EXCEL_FIELD_ALIASES.gioiTinh),
            true
          ) ? "NAM" : "NU",
          lop: { id: Number(classMatch.id) },
          hocBaId,
          danToc: danTocId ? { id: Number(danTocId) } : { id: 1 },
          phuHuynhId,
          sdt: normalizePhone(findColumnValue(row, EXCEL_FIELD_ALIASES.sdt) || "") || null,
          email:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.email) || "").trim() ||
            buildStudentEmailPreview(fullName) ||
            null,
          diaChi:
            String(findColumnValue(row, EXCEL_FIELD_ALIASES.diaChi) || "").trim() || null,
          namNhapHoc: calculateAdmissionYear(classMatch.namHoc || rowNamHoc, classMatch.khoi),
          maBhyt: maBhyt,
          tonGiao: String(findColumnValue(row, EXCEL_FIELD_ALIASES.tonGiao) || "").trim() || "Không",
          dienChinhSach: parseBoolean(
            findColumnValue(row, EXCEL_FIELD_ALIASES.dienChinhSach),
            false
          ),
          trangThai: parseStatus(findColumnValue(row, EXCEL_FIELD_ALIASES.trangThai))
        };

        try {
          const response = await createHocSinh(payload);
          const created = response?.data?.data;
          if (created) {
            if (!created.phuHuynhId && phuHuynhId) {
              created.phuHuynhId = phuHuynhId;
            }
            if (!created.phuHuynh && resolvedParentObj) {
              created.phuHuynh = resolvedParentObj;
            }
            if (created.id && phuHuynhId) {
              try {
                await linkParentToStudent(created.id, phuHuynhId);
              } catch {
                // Link already created in backend or fallback
              }
            }
            createdStudents.push(created);
          }
        } catch (err) {
          failedRows.push(`${rowLabel}: ${extractBackendError(err)}`);
        }
      }

      if (createdStudents.length) {
        setStudents((prev) => [...createdStudents, ...prev]);
        setRefreshToggle((prev) => !prev);
        await Promise.allSettled(
          createdStudents.map((student) =>
            ensureStudentUserAccount(student, student?.hoTen || "")
          )
        );
        notifyUsersUpdated();
      }

      if (failedRows.length) {
        setExcelError(
          `Nhập thành công ${createdStudents.length}/${totalNonEmptyRows || 0}${skippedDuplicatesCount ? ` (Đã bỏ qua ${skippedDuplicatesCount} học sinh trùng)` : ""}. ${failedRows
            .slice(0, 3)
            .join(" | ")}`
        );
      } else if (skippedDuplicatesCount > 0 && createdStudents.length === 0) {
        setExcelError(
          `Học sinh đã tồn tại trong hệ thống (toàn bộ ${skippedDuplicatesCount} học sinh đều đã có sẵn).`
        );
      } else if (skippedDuplicatesCount > 0) {
        setExcelSuccess(
          `Đã nhập thành công ${createdStudents.length} học sinh mới. Đã bỏ qua ${skippedDuplicatesCount} học sinh đã tồn tại.`
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

  return {
    excelError, setExcelError,
    excelSuccess, setExcelSuccess,
    importing, setImporting,
    form, setForm,
    students, setStudents,
    classes, setClasses,
    filterMenuOpen, setFilterMenuOpen,
    filterMenuRef,
    addMenuOpen, setAddMenuOpen,
    addMenuRef,
    refreshToggle, setRefreshToggle,
    handleRefresh,
    parents, setParents,
    loading, setLoading,
    error, setError,
    successMessage, setSuccessMessage,
    keyword,
    yearFilter, setYearFilter,
    academicYears,
    gradeFilter, setGradeFilter,
    classFilter, setClassFilter,
    page, setPage, pageSize, setPageSize, totalPages,
    modalOpen, setModalOpen,
    excelModalOpen, setExcelModalOpen,
    editingStudent, setEditingStudent,
    formError, setFormError,
    viewModalOpen, setViewModalOpen,
    viewingStudent, setViewingStudent,
    transferClassModalOpen, setTransferClassModalOpen,
    transferSchoolModalOpen, setTransferSchoolModalOpen,
    transferringStudent, setTransferringStudent,
    filteredStudents,
    classesByGrade,
    filteredClasses,
    pagedStudents,
    handleClassSelect,
    openCreate,
    openEdit,
    handleDelete,
    handleSubmit,
    handleDownloadTemplate,
    handleExcelUpload,
    submitTransferClass,
    submitTransferSchool,
    exportModalOpen,
    setExportModalOpen,
    executeExportExcel
  };
}
