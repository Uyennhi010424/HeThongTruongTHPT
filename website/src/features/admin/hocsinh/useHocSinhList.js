import { useEffect, useMemo, useState, useRef } from "react";
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
import { createPhuHuynh, getPhuHuynh, updatePhuHuynh } from "../../../api/phuhuynhApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";
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
  validateStudentAgeAndYear
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

// Lấy từ hocSinhUtils để sort nếu thiếu
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
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const handleRefresh = () => setRefreshToggle(prev => !prev);

  const handleExportExcel = () => {
    if (!students || students.length === 0) {
      notifyError("Không có dữ liệu để xuất");
      return;
    }
    const data = students.map((s, index) => ({
      "STT": index + 1,
      "Họ và tên": s.hoTen || "",
      "Lớp": s.lopHoc?.tenLop || s.lop?.tenLop || "",
      "Khối": s.lopHoc?.khoi || s.lop?.khoi || "",
      "Giới tính": (s.gioiTinh === "NU" || s.gioiTinh === "false" || s.gioiTinh === false) ? "Nữ" : "Nam",
      "Ngày sinh": s.ngaySinh || "",
      "Số điện thoại": s.sdt || "",
      "Email": s.email || "",
      "Năm nhập học": s.namNhapHoc || "",
      "Trạng thái": s.trangThai === 1 ? "Đang học" : "Ngừng học",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
    XLSX.writeFile(workbook, "DanhSachHocSinh.xlsx");
    notifySuccess("Xuất Excel thành công");
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
        const [hsRes, lopRes, phRes] = await Promise.allSettled([
          getHocSinh(),
          getLop(),
          getPhuHuynh()
        ]);
        if (!active) return;
        if (hsRes.status === "fulfilled") {
          const hsData = hsRes.value?.data?.data;
          const hsList = Array.isArray(hsData) ? hsData : (hsData?.content || []);
          setStudents(hsList.map(normalizeStudent));
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

  const filteredStudents = useMemo(() => {
    const lower = keyword.toLowerCase();
    const source = students.filter((student) => {
      const matchKeyword = keyword.trim()
        ? [student.hoTen, student.sdt, student.email, student?.lopHoc?.tenLop]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(lower))
        : true;

      const studentGrade = String(student?.lopHoc?.khoi || student?.lop?.khoi || "");
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
          // ignore
        }
      }

      setForm({
        hoTen: student.hoTen || "",
        ngaySinh: formatDateInput(student.ngaySinh),
        gioiTinh: (student.gioiTinh === "NU" || student.gioiTinh === "false" || student.gioiTinh === false) ? "false" : "true",
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
      // Optional: handleRefresh();
    } catch (err) {
      setError("Không thể xóa học sinh.");
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
            quanHe: isFemaleVietnameseName(form.phuHuynhHoTen) ? "ME" : "CHA",
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
      gioiTinh: form.gioiTinh === "true" ? "NAM" : "NU",
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

      // PRE-VALIDATION PASS
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = originalRowNumbers[index];
        const isEmptyRow = Object.values(row || {}).every(
          (v) => v === null || v === undefined || String(v || "").trim() === ""
        );
        if (isEmptyRow) continue;
        
        totalNonEmptyRows += 1;

        const className = String(findColumnValue(row, EXCEL_FIELD_ALIASES.lop) || "").trim();
        const normClassName = normalizeText(className);
        let classMatch = classMap.get(normClassName);
        if (!classMatch) classMatch = fuzzyFindClass(normClassName);

        const fullName = String(findColumnValue(row, EXCEL_FIELD_ALIASES.hoTen) || "").trim();

        if (!fullName) {
          failedRows.push(`Dòng ${rowNumber}: thiếu cột Họ tên`);
          continue;
        }

        if (!classMatch) {
          failedRows.push(`Dòng ${rowNumber}: không tìm thấy lớp '${className || "(trống)"}'`);
          continue;
        }

        const ngaySinhRaw = findColumnValue(row, EXCEL_FIELD_ALIASES.ngaySinh);
        const ngaySinhNormalized = normalizeDateCell(ngaySinhRaw);
        const namNhapHoc = parseNullableNumber(findColumnValue(row, EXCEL_FIELD_ALIASES.namNhapHoc));

        const ageError = validateStudentAgeAndYear(ngaySinhNormalized, namNhapHoc, classMatch.khoi);
        if (ageError) {
          failedRows.push(`Dòng ${rowNumber}: ${ageError}`);
        }
      }

      if (failedRows.length > 0) {
        setExcelError(`Tệp Excel không hợp lệ. Vui lòng sửa lỗi và thử lại: ${failedRows.slice(0, 3).join(" | ")}`);
        setImporting(false);
        event.target.value = "";
        return;
      }

      // EXECUTION PASS
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = originalRowNumbers[index];

        // Bỏ qua dòng trống hoàn toàn
        const isEmptyRow = Object.values(row || {}).every(
          (v) => v === null || v === undefined || String(v || "").trim() === ""
        );
        if (isEmptyRow) continue;

        const className = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.lop) || ""
        ).trim();
        const normClassName = normalizeText(className);
        let classMatch = classMap.get(normClassName);
        if (!classMatch) classMatch = fuzzyFindClass(normClassName);

        const fullName = String(
          findColumnValue(row, EXCEL_FIELD_ALIASES.hoTen) || ""
        ).trim();

        // Không cần kiểm tra fullName và classMatch vì PRE-VALIDATION đã bắt lỗi


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
                        quanHe: isFemaleVietnameseName(phHoTen) ? "ME" : "CHA",
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
          ) ? "NAM" : "NU",
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
    handleExportExcel,
    parents, setParents,
    loading, setLoading,
    error, setError,
    successMessage, setSuccessMessage,
    keyword,
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
    submitTransferSchool
  };
}
