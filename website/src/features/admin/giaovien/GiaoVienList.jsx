import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Edit, Trash2, ChevronDown, ChevronUp, Phone, Mail, GraduationCap, 
  Calendar, User, BookOpen, ExternalLink, ShieldCheck, AlertTriangle, Layers 
} from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createGiaoVien,
  deleteGiaoVien,
  getGiaoVien,
  updateGiaoVien
} from "../../../api/giaovienApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { createUser, getUsers } from "../../../api/userApi.js";
import { getVisibleAcademicYears, getActiveAcademicYear } from "../../../utils/helpers.js";
import Pagination from "../../../components/common/Pagination.jsx";
import CachedAvatar from "../../../components/common/CachedAvatar.jsx";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

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

const normalizeTeacher = (teacher) => {
  if (!teacher) return teacher;
  return {
    ...teacher,
    sdt: teacher.sdt || teacher.soDienThoai || ""
  };
};

const getGenderLabel = (value) => {
  if (value === true) return "Nam";
  if (value === false) return "Nữ";
  return "--";
};

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
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

const buildTeacherEmailPreview = (fullName) => {
  const normalized = normalizeEmailPart(fullName);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstLetters = parts.slice(0, -1).map((part) => part[0]).join("");
  const lastName = parts[parts.length - 1];
  const localPart = `${firstLetters}${lastName}` || "giaovien";
  return `${localPart}c3@tdu.edu.vn`;
};

const notifyUsersUpdated = () => {
  window.dispatchEvent(new Event("users-updated"));
  window.localStorage.setItem("usersUpdatedAt", String(Date.now()));
};

export default function GiaoVienList() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allNamHoc, setAllNamHoc] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { confirm } = useConfirm();
  const { searchQuery: keyword, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    boMon: "",
    trinhDo: "",
    sdt: "",
    email: ""
  });

  const visibleNamHoc = useMemo(() => {
    return getVisibleAcademicYears(allNamHoc);
  }, [allNamHoc]);

  const activeNamHoc = useMemo(() => {
    return getActiveAcademicYear(allNamHoc);
  }, [allNamHoc]);

  const ensureTeacherUserAccount = async (teacher, fallbackFullName = "") => {
    const candidate =
      String(teacher?.email || "").trim() || buildTeacherEmailPreview(fallbackFullName);

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
        status: 1,
        role: "GIAOVIEN"
      });
    } catch {
      // Keep teacher creation successful even if fallback account creation fails.
    }
  };

  const getTeacherHomeroomInfo = (teacher, year) => {
    if (!teacher) return { isHomeroom: false, className: "" };
    const foundClass = classes.find((c) => {
      const isTeacherMatch = c.gvcnId === teacher.id || c.gvcn?.id === teacher.id;
      if (!isTeacherMatch) return false;
      if (!year || year === "ALL") return true;
      return c.namHoc === year;
    });
    if (foundClass) {
      return { isHomeroom: true, className: foundClass.tenLop };
    }
    if ((!year || year === "ALL" || (activeNamHoc?.tenNamHoc && year === activeNamHoc.tenNamHoc)) && teacher.isGvcn) {
      return { isHomeroom: true, className: teacher.tenLopChuNhiem || "" };
    }
    return { isHomeroom: false, className: "" };
  };

  const isHomeroomTeacher = (teacher) => getTeacherHomeroomInfo(teacher, selectedNamHoc).isHomeroom;

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm giáo viên...");
    setIsSearchVisible(true);
    return () => {
      setSearchPlaceholder("Tìm kiếm...");
      setIsSearchVisible(true);
    };
  }, [setSearchPlaceholder, setIsSearchVisible]);

  useEffect(() => {
    let active = true;

    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError("");
        const [teacherResult, classResult, assignmentResult, namHocResult] = await Promise.allSettled([
          getGiaoVien(),
          getLop(),
          getPhanCongDay(),
          getNamHoc()
        ]);
        if (!active) return;

        if (teacherResult.status !== "fulfilled") {
          setError("Không thể tải danh sách giáo viên.");
          setTeachers([]);
          return;
        }

        setTeachers((teacherResult.value?.data?.data || []).map(normalizeTeacher));
        setClasses(
          classResult.status === "fulfilled" ? classResult.value?.data?.data || [] : []
        );
        setAssignments(
          assignmentResult.status === "fulfilled" ? assignmentResult.value?.data?.data || [] : []
        );
        const rawYears = namHocResult.status === "fulfilled" ? namHocResult.value?.data?.data || [] : [];
        setAllNamHoc(rawYears);
        const visible = getVisibleAcademicYears(rawYears);
        const activeYear = getActiveAcademicYear(rawYears);
        if (activeYear?.tenNamHoc) {
          setSelectedNamHoc((prev) => prev || activeYear.tenNamHoc);
        } else if (visible.length > 0) {
          setSelectedNamHoc((prev) => prev || visible[0].tenNamHoc);
        }
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách giáo viên.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTeachers();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = teachers.length;
    const maleCount = teachers.filter((item) => item.gioiTinh === true).length;
    const femaleCount = teachers.filter((item) => item.gioiTinh === false).length;
    const homeroomCount = teachers.filter((item) => getTeacherHomeroomInfo(item, selectedNamHoc).isHomeroom).length;
    return { total, maleCount, femaleCount, homeroomCount };
  }, [teachers, classes, selectedNamHoc, activeNamHoc]);

  const allAssignmentsByTeacherId = useMemo(() => {
    const map = {};
    for (const item of assignments) {
      const gvId = item.giaoVienId;
      if (!gvId) continue;
      if (!map[gvId]) map[gvId] = [];
      map[gvId].push(item);
    }
    return map;
  }, [assignments]);

  const getTeacherAssignmentSummary = (teacherId) => {
    const teacherAll = allAssignmentsByTeacherId[teacherId] || [];
    const currentYearAssigned = assignmentsByTeacherId[teacherId] || [];
    
    const yearCounts = {};
    for (const a of teacherAll) {
      const y = a.namHoc || "Chưa rõ";
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }

    const otherYearsWithAssignments = Object.entries(yearCounts)
      .filter(([year]) => selectedNamHoc !== "ALL" && year !== selectedNamHoc);

    return {
      totalAllYears: teacherAll.length,
      currentYearCount: currentYearAssigned.length,
      yearCounts,
      otherYearsWithAssignments,
      hasOtherYearAssignments: otherYearsWithAssignments.length > 0
    };
  };

  const assignmentsByTeacherId = useMemo(() => {
    const map = {};
    for (const item of assignments) {
      if (selectedNamHoc && selectedNamHoc !== "ALL" && item.namHoc !== selectedNamHoc) {
        continue;
      }
      const gvId = item.giaoVienId;
      if (!gvId) continue;
      if (!map[gvId]) map[gvId] = [];
      map[gvId].push(item);
    }
    return map;
  }, [assignments, selectedNamHoc]);

  const filteredTeachers = useMemo(() => {
    if (!keyword.trim()) return teachers;
    const lower = keyword.toLowerCase();
    return teachers.filter((teacher) =>
      [teacher.hoTen, teacher.boMon, teacher.trinhDo, teacher.sdt, teacher.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, teachers]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  }, [filteredTeachers.length, pageSize]);

  const pagedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingTeacher(null);
    setForm({
      hoTen: "",
      ngaySinh: "",
      gioiTinh: "true",
      boMon: "",
      trinhDo: "",
      sdt: "",
      email: ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      hoTen: teacher.hoTen || "",
      ngaySinh: formatDateInput(teacher.ngaySinh),
      gioiTinh: String(teacher.gioiTinh ?? true),
      boMon: teacher.boMon || "",
      trinhDo: teacher.trinhDo || "",
      sdt: teacher.sdt || "",
      email: teacher.email || ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleDelete = async (teacher) => {
    const summary = getTeacherAssignmentSummary(teacher.id);
    const homeroomInfo = getTeacherHomeroomInfo(teacher, "ALL");

    if (summary.totalAllYears > 0) {
      const yearDetails = Object.entries(summary.yearCounts)
        .map(([y, count]) => `Năm ${y}: ${count} phân công`)
        .join(", ");
      const msg = `Không thể xóa giáo viên ${teacher.hoTen} vì đang có dữ liệu phân công giảng dạy (${yearDetails}). Vui lòng chuyển sang năm học tương ứng để gỡ toàn bộ phân công trước khi xóa.`;
      setError(msg);
      notifyError(msg);
      return;
    }

    if (homeroomInfo.isHomeroom) {
      const msg = `Không thể xóa giáo viên ${teacher.hoTen} vì đang làm GVCN lớp ${homeroomInfo.className}. Vui lòng bỏ phân công chủ nhiệm trước khi xóa.`;
      setError(msg);
      notifyError(msg);
      return;
    }

    if (!(await confirm(`Bạn có chắc chắn muốn xóa giáo viên ${teacher.hoTen}? Dữ liệu giáo viên sẽ bị xóa khỏi hệ thống.`, "Xác nhận xóa giáo viên"))) return;
    try {
      await deleteGiaoVien(teacher.id);
      setTeachers((prev) => prev.filter((item) => item.id !== teacher.id));
      setError("");
      setSuccessMessage("Xóa giáo viên thành công.");
      notifySuccess("Xóa giáo viên thành công.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể xóa giáo viên.");
      setError(msg);
      setSuccessMessage("");
      notifyError(msg);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const trimmedName = form.hoTen.trim();
    if (!trimmedName) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }
    const words = trimmedName.split(/\s+/);
    if (words.length < 2) {
      setFormError("Họ tên phải có ít nhất 2 từ (vd: Trần Minh, Nguyễn Thị Lan).");
      return;
    }
    const TEACHER_NAME_PATTERN = /^[A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)+$/;
    if (!TEACHER_NAME_PATTERN.test(trimmedName)) {
      setFormError("Mỗi từ trong họ tên phải bắt đầu bằng chữ hoa, chỉ chứa chữ cái tiếng Việt (vd: Nguyễn Vy).");
      return;
    }

    const trimmedPhone = form.sdt.trim();
    if (trimmedPhone && !/^0\d{9}$/.test(trimmedPhone)) {
      setFormError("Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0.");
      return;
    }

    const trimmedEmail = form.email.trim();
    if (trimmedEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmedEmail)) {
      setFormError("Email không đúng định dạng.");
      return;
    }

    const trimmedBoMon = form.boMon.trim();
    if (trimmedBoMon && !/^[A-Za-zÀ-ỹĐđ0-9\s,\/\.\-]+$/.test(trimmedBoMon)) {
      setFormError("Tổ bộ môn không được chứa ký tự đặc biệt không hợp lệ.");
      return;
    }

    const payload = {
      hoTen: trimmedName,
      ngaySinh: form.ngaySinh || null,
      gioiTinh: form.gioiTinh === "true",
      boMon: trimmedBoMon || null,
      trinhDo: form.trinhDo.trim() || null,
      soDienThoai: trimmedPhone || null,
      email: editingTeacher
        ? trimmedEmail || null
        : buildTeacherEmailPreview(trimmedName) || null
    };

    try {
      let savedTeacher = null;
      if (editingTeacher) {
        const response = await updateGiaoVien(editingTeacher.id, payload);
        const updated = normalizeTeacher(response?.data?.data);
        if (!updated.username && editingTeacher.username) {
          updated.username = editingTeacher.username;
        }
        savedTeacher = updated;
        setTeachers((prev) =>
          prev.map((item) => (item.id === editingTeacher.id ? updated : item))
        );
      } else {
        const response = await createGiaoVien(payload);
        const created = normalizeTeacher(response?.data?.data);
        const normalizedCreated = {
          ...created,
          email: created?.email || buildTeacherEmailPreview(form.hoTen)
        };
        savedTeacher = normalizedCreated;
        setTeachers((prev) => [normalizedCreated, ...prev]);
        await ensureTeacherUserAccount(normalizedCreated, form.hoTen);
        notifyUsersUpdated();
      }

      setError("");
      setSuccessMessage(
        editingTeacher ? "Cập nhật giáo viên thành công." : "Thêm giáo viên thành công."
      );
      setModalOpen(false);
    } catch (err) {
      setFormError(
        getApiErrorMessage(err, "Không thể lưu hồ sơ giáo viên. Vui lòng thử lại.")
      );
      setSuccessMessage("");
    }
  };

  const [expandedTeacherId, setExpandedTeacherId] = useState(null);

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục giáo viên"
        description={
          loading
            ? "Đang tải dữ liệu..."
            : `Năm học: ${selectedNamHoc === "ALL" ? "Tất cả các năm" : selectedNamHoc} • Tổng cộng: ${stats.total} giáo viên (${stats.maleCount} nam, ${stats.femaleCount} nữ) - ${stats.homeroomCount} GVCN`
        }
        actions={
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 ml-auto">
            <button className="btn-primary" onClick={openCreate}>
              Thêm giáo viên
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-4 sm:p-6">
        {/* ── Toolbar: Filter theo Năm học ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600">Năm học:</span>
            <select
              value={selectedNamHoc}
              onChange={(e) => {
                setSelectedNamHoc(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none text-blue-900 font-extrabold text-xs sm:text-sm focus:outline-none cursor-pointer"
            >
              {visibleNamHoc.map((nh) => (
                <option key={nh.id || nh.tenNamHoc} value={nh.tenNamHoc}>
                  {nh.tenNamHoc} {nh.trangThai === "DANG_MO" ? "(Đang mở)" : "(Đã đóng)"}
                </option>
              ))}
              <option value="ALL">-- Tất cả các năm --</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 hidden sm:block">
            Dữ liệu phân công & chủ nhiệm: <span className="text-blue-700 font-bold">{selectedNamHoc === "ALL" ? "Tất cả các năm" : selectedNamHoc}</span>
          </div>
        </div>

        {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}
        {!error && successMessage && <div className="p-4 mb-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold">{successMessage}</div>}
        {!error && !loading && filteredTeachers.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-medium">Không tìm thấy giáo viên phù hợp.</div>
        )}

        {/* ── Desktop Full Table View (>= 1024px) ── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">STT</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[220px]">Giáo viên</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Bộ môn</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Trình độ</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[180px]">Liên hệ</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 text-center">Chủ nhiệm</th>
                <th className="py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-6 mx-auto animate-pulse" /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0 aspect-square" />
                        <div className="space-y-1.5 w-full">
                          <div className="h-4 bg-slate-100 rounded w-32 animate-pulse" />
                          <div className="h-3 bg-slate-50 rounded w-20 animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-20 animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-24 animate-pulse" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-slate-100 rounded w-32 animate-pulse" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-14 mx-auto animate-pulse" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : (
                pagedTeachers.map((teacher, index) => {
                  const isExpanded = expandedTeacherId === teacher.id;
                  const teacherAssignments = assignmentsByTeacherId[teacher.id] || [];
                  const homeroomInfo = getTeacherHomeroomInfo(teacher, selectedNamHoc);
                  const summary = getTeacherAssignmentSummary(teacher.id);
                  return (
                    <React.Fragment key={teacher.id}>
                      <tr 
                        className={`transition-colors group cursor-pointer ${
                          isExpanded ? "bg-blue-50/40" : "hover:bg-slate-50/80"
                        }`}
                        onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                      >
                        <td className="py-4 px-4 text-center text-sm font-bold text-slate-400">
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{(page - 1) * pageSize + index + 1}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-600 font-bold" : "group-hover:text-slate-600"}`} />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <CachedAvatar
                              username={teacher.username || teacher.email}
                              role="teacher"
                              src={teacher.anhDaiDien}
                              fallback={(() => {
                                const parts = (teacher.hoTen || "G").trim().split(" ");
                                return parts[parts.length - 1].charAt(0).toUpperCase();
                              })()}
                              className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-indigo-100"
                              fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 aspect-square"
                            />
                            <div>
                              <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{teacher.hoTen}</div>
                              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                                {formatDate(teacher.ngaySinh) || "--"} • {getGenderLabel(teacher.gioiTinh)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                            {teacher.boMon || "--"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-slate-700">
                          {teacher.trinhDo || "--"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-bold text-slate-800">{teacher.sdt || "--"}</div>
                          <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{teacher.email || ""}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            homeroomInfo.isHomeroom
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {homeroomInfo.isHomeroom ? "Có" : "Không"}
                          </span>
                          {homeroomInfo.isHomeroom && homeroomInfo.className && (
                            <div className="text-[11px] font-bold text-emerald-700 mt-1">
                              Lớp {homeroomInfo.className}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(teacher)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(teacher)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable Details Row (Desktop) ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-3 sm:p-4">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cột 1: Thông tin cá nhân & Liên hệ */}
                                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                                    <User className="w-4 h-4 text-blue-600" /> Thông tin hồ sơ & Liên hệ
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span>Trình độ: <strong className="text-slate-800">{teacher.trinhDo || "--"}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span>Ngày sinh: <strong className="text-slate-800">{formatDate(teacher.ngaySinh) || "--"}</strong> ({getGenderLabel(teacher.gioiTinh)})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>SĐT: {teacher.sdt ? <a href={`tel:${teacher.sdt}`} className="font-bold text-blue-600 hover:underline">{teacher.sdt}</a> : <strong className="text-slate-800">--</strong>}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span>Email: {teacher.email ? <a href={`mailto:${teacher.email}`} className="font-bold text-blue-600 hover:underline">{teacher.email}</a> : <strong className="text-slate-800">--</strong>}</span>
                                  </div>
                                </div>

                                {/* Cột 2: Lớp Chủ nhiệm & Phân công giảng dạy */}
                                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3 text-xs">
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
                                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Lớp Chủ nhiệm & Giảng dạy
                                        <span className="text-[11px] font-semibold text-blue-600 normal-case">
                                          ({selectedNamHoc === "ALL" ? "Tất cả các năm" : `Năm học ${selectedNamHoc}`})
                                        </span>
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate("/admin/phancong");
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        <span>Quản lý phân công</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Lớp Chủ nhiệm */}
                                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                                      <span className="text-slate-500 font-medium">Chủ nhiệm:</span>
                                      {homeroomInfo.isHomeroom ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          Lớp {homeroomInfo.className || "Chưa xác định"}
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 italic bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                                          Không làm chủ nhiệm ({selectedNamHoc === "ALL" ? "Tất cả" : selectedNamHoc})
                                        </span>
                                      )}
                                    </div>

                                    {/* Lớp Giảng dạy */}
                                    <div>
                                      <div className="text-slate-500 font-medium mb-1.5 flex items-center gap-1.5">
                                        <span>Lớp giảng dạy:</span>
                                        <span className="font-bold text-slate-800">
                                          {teacherAssignments.length > 0 ? `(${teacherAssignments.length} phân công)` : ""}
                                        </span>
                                      </div>

                                      {teacherAssignments.length > 0 ? (
                                        <div className="space-y-2">
                                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                            {teacherAssignments.map((a, idx) => (
                                              <span
                                                key={a.id || idx}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                                                title={`${a.monHocTen || "Môn"} - Lớp ${a.tenLop} (Học kỳ ${a.hocKy} - Năm ${a.namHoc})`}
                                              >
                                                <Layers className="w-3 h-3 text-blue-500" />
                                                {a.monHocTen} - Lớp {a.tenLop} <span className="text-blue-500 font-normal">(HK{a.hocKy}{selectedNamHoc === "ALL" ? ` • ${a.namHoc}` : ""})</span>
                                              </span>
                                            ))}
                                          </div>
                                          {summary.hasOtherYearAssignments && selectedNamHoc !== "ALL" && (
                                            <div className="text-[11px] text-slate-500 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
                                              * Phân công năm khác: {summary.otherYearsWithAssignments.map(([y, c]) => `Năm ${y} (${c} phân công)`).join(", ")}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        summary.hasOtherYearAssignments && selectedNamHoc !== "ALL" ? (
                                          <div className="space-y-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                              <span>✓ Chưa có phân công dạy trong năm học {selectedNamHoc}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11.5px] space-y-1.5">
                                              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                Phát hiện dữ liệu giảng dạy ở các năm học khác:
                                              </p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {summary.otherYearsWithAssignments.map(([year, count]) => (
                                                  <span key={year} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                                    Năm {year}: {count} phân công
                                                  </span>
                                                ))}
                                              </div>
                                              <p className="text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/80">
                                                ⚠️ <strong>Lưu ý xóa:</strong> Không thể xóa giáo viên nếu còn phân công ở bất kỳ năm học nào (kể cả năm cũ). Vui lòng chuyển sang năm học trên để gỡ phân công trước.
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span>✓ Không có phân công dạy ở tất cả các năm học (Đủ điều kiện xóa an toàn)</span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  {(teacherAssignments.length > 0 || summary.hasOtherYearAssignments) && (
                                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>Cần gỡ hết các phân công dạy (cả các năm học cũ) trước khi có thể xóa giáo viên này.</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile / Tablet Accordion Card View (< 1024px) ── */}
        <div className="block lg:hidden space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`m-skeleton-${idx}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 aspect-square" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-32" />
                    <div className="h-3 bg-slate-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            pagedTeachers.map((teacher, index) => {
              const isExpanded = expandedTeacherId === teacher.id;
              const teacherAssignments = assignmentsByTeacherId[teacher.id] || [];
              const homeroomInfo = getTeacherHomeroomInfo(teacher, selectedNamHoc);
              const summary = getTeacherAssignmentSummary(teacher.id);
              return (
                <div
                  key={teacher.id}
                  className={`rounded-xl border transition-all duration-200 bg-white overflow-hidden ${
                    isExpanded ? "border-blue-300 shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Collapsed Card Header */}
                  <div
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                        {(page - 1) * pageSize + index + 1}
                      </div>
                      <CachedAvatar
                        username={teacher.username || teacher.email}
                        role="teacher"
                        src={teacher.anhDaiDien}
                        fallback={(() => {
                          const parts = (teacher.hoTen || "G").trim().split(" ");
                          return parts[parts.length - 1].charAt(0).toUpperCase();
                        })()}
                        className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-indigo-100"
                        fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 aspect-square"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">{teacher.hoTen}</span>
                          {teacher.boMon && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                              {teacher.boMon}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {teacher.sdt || teacher.email || (homeroomInfo.isHomeroom ? `GVCN Lớp ${homeroomInfo.className || ""}` : "Giáo viên")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(teacher)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
                        aria-label="Xem chi tiết"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Card Details ("Show xuống") */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Trình độ: <strong className="text-slate-800">{teacher.trinhDo || "--"}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Ngày sinh: <strong className="text-slate-800">{formatDate(teacher.ngaySinh) || "--"}</strong> ({getGenderLabel(teacher.gioiTinh)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>SĐT: {teacher.sdt ? <a href={`tel:${teacher.sdt}`} className="font-bold text-blue-600 hover:underline">{teacher.sdt}</a> : <strong className="text-slate-800">--</strong>}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="truncate">Email: {teacher.email ? <a href={`mailto:${teacher.email}`} className="font-bold text-blue-600 hover:underline">{teacher.email}</a> : <strong className="text-slate-800">--</strong>}</span>
                        </div>
                      </div>

                      {/* Lớp Chủ nhiệm & Giảng dạy (Mobile) */}
                      <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-blue-900 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Phân công & Lớp học
                            <span className="text-[11px] font-semibold text-blue-600 normal-case">
                              ({selectedNamHoc === "ALL" ? "Tất cả" : selectedNamHoc})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/admin/phancong");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            <span>Quản lý phân công</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-500">Chủ nhiệm:</span>
                          {homeroomInfo.isHomeroom ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Lớp {homeroomInfo.className || "--"}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Không ({selectedNamHoc === "ALL" ? "Tất cả" : selectedNamHoc})</span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500 block mb-1">
                            Lớp dạy: <strong className="text-slate-800">{teacherAssignments.length > 0 ? `(${teacherAssignments.length} phân công)` : ""}</strong>
                          </span>
                          {teacherAssignments.length > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                {teacherAssignments.map((a, idx) => (
                                  <span
                                    key={a.id || idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    <Layers className="w-2.5 h-2.5 text-blue-500" />
                                    {a.monHocTen} - {a.tenLop} (HK{a.hocKy}{selectedNamHoc === "ALL" ? ` • ${a.namHoc}` : ""})
                                  </span>
                                ))}
                              </div>
                              {summary.hasOtherYearAssignments && selectedNamHoc !== "ALL" && (
                                <div className="text-[10.5px] text-slate-500 font-medium bg-slate-100/80 px-2 py-0.5 rounded-md">
                                  * Năm khác: {summary.otherYearsWithAssignments.map(([y, c]) => `${y} (${c} lớp)`).join(", ")}
                                </div>
                              )}
                            </div>
                          ) : (
                            summary.hasOtherYearAssignments && selectedNamHoc !== "ALL" ? (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-slate-600 font-medium text-[11px] block">✓ Chưa có phân công dạy ở năm {selectedNamHoc}</span>
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                                  <p className="font-bold flex items-center gap-1 text-amber-950">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    Có dạy ở năm học khác:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {summary.otherYearsWithAssignments.map(([year, count]) => (
                                      <span key={year} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                        Năm {year}: {count} phân công
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-[10px] text-amber-800 italic pt-0.5">
                                    * Cần chuyển sang năm học trên để gỡ phân công trước khi xóa giáo viên.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-700 font-semibold text-[11px]">✓ Không có phân công dạy ở tất cả các năm (Có thể xóa)</span>
                            )
                          )}
                        </div>

                        {(teacherAssignments.length > 0 || summary.hasOtherYearAssignments) && (
                          <p className="text-[10.5px] text-amber-700 font-medium pt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Cần gỡ hết phân công (kể cả năm cũ) trước khi xóa.</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ── */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredTeachers.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingTeacher ? "Cập nhật giáo viên" : "Thêm giáo viên"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid form-grid-teacher" onSubmit={handleSubmit}>
          <div className="form-section-title">Thông tin cá nhân</div>
          <label className="form-field">
            <span>Họ và tên</span>
            <input
              value={form.hoTen}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hoTen: event.target.value,
                  email: editingTeacher ? prev.email : buildTeacherEmailPreview(event.target.value)
                }))
              }
              placeholder="vd: Nguyễn Văn A"
              required
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

          <div className="form-section-title">Thông tin chuyên môn</div>
          <label className="form-field">
            <span>Bộ môn</span>
            <input
              value={form.boMon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, boMon: event.target.value }))
              }
              placeholder="vd: Toán"
            />
          </label>
          <label className="form-field">
            <span>Trình độ</span>
            <input
              value={form.trinhDo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trinhDo: event.target.value }))
              }
              placeholder="vd: Cử nhân"
            />
          </label>

          <div className="form-section-title">Thông tin liên hệ</div>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              type="tel"
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
              type="email"
              value={editingTeacher ? form.email : buildTeacherEmailPreview(form.hoTen)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="vd: nvanc3@tdu.edu.vn"
              readOnly={!editingTeacher}
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
              Lưu
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}