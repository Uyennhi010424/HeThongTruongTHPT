import { useEffect, useMemo, useState, useRef } from "react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  getPhuHuynh,
  createPhuHuynh,
  updatePhuHuynh,
  getStudentsByPhuHuynhId
} from "../../../api/phuhuynhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { Filter, RefreshCw, Plus, Edit, Eye } from "lucide-react";
import Pagination from "../../../components/common/Pagination.jsx";

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
  for (let i = 1; i < parts.length - 1; i++) {
    if (FEMALE_MIDDLE_NAMES.has(parts[i])) return true;
  }
  if (parts.length >= 2 && FEMALE_MIDDLE_NAMES.has(parts[parts.length - 1])) return true;
  return false;
};



const QUAN_HE_OPTIONS = [
  { value: "CHA", label: "Cha" },
  { value: "ME", label: "Mẹ" },
  { value: "NGUOI_GIAM_HO", label: "Người giám hộ" }
];

const getQuanHeLabel = (value) => {
  const found = QUAN_HE_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value || "--";
};

const emptyForm = {
  hoTen: "",
  soDienThoai: "",
  email: "",
  quanHe: "CHA",
  ngheNghiep: "",
  isSmSActive: false
};

export default function PhuHuynhList() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Class filter
  const [classes, setClasses] = useState([]);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [parentClassMap, setParentClassMap] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailParent, setDetailParent] = useState(null);
  const [detailStudents, setDetailStudents] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ---------- fetch ---------- */
  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm phụ huynh...");
    setIsSearchVisible(true);
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [parentRes, classRes] = await Promise.all([
          getPhuHuynh(),
          getLop()
        ]);
        if (!active) return;
        const parentData = parentRes?.data?.data || [];
        setParents(parentData);
        setClasses(classRes?.data?.data || []);

        // Build parent -> classIds map
        const entries = await Promise.all(
          parentData.map(async (p) => {
            try {
              const res = await getStudentsByPhuHuynhId(p.id);
              const students = res?.data?.data || [];
              const classIds = students
                .map((s) => s.lopId || s.lop?.id)
                .filter(Boolean);
              return [p.id, classIds];
            } catch {
              return [p.id, []];
            }
          })
        );
        if (!active) return;
        setParentClassMap(Object.fromEntries(entries));
      } catch {
        if (!active) return;
        setError("Không thể tải danh sách phụ huynh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = parents.length;
    const smsActive = parents.filter((p) => p.isSmSActive).length;
    return { total, smsActive };
  }, [parents]);

  /* ---------- class filter helpers ---------- */
  const classesByGrade = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      const grade = item?.khoi ? String(item.khoi) : "Khác";
      if (!map.has(grade)) map.set(grade, []);
      map.get(grade).push(item);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([grade, items]) => ({ grade, items }));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (gradeFilter === "all") return classes;
    return classes.filter((item) => String(item?.khoi || "") === gradeFilter);
  }, [classes, gradeFilter]);

  const handleGradeSelect = (khoi) => {
    setGradeFilter(khoi);
    setClassFilter("all");
    setPage(1);
  };

  const handleClassSelect = (classId) => {
    setClassFilter(classId);
    if (classId !== "all") {
      const found = classes.find((c) => String(c.id) === String(classId));
      if (found?.khoi !== undefined && found?.khoi !== null) {
        setGradeFilter(String(found.khoi));
      }
    }
    setPage(1);
  };

  const clearFilters = () => {
    setGradeFilter("all");
    setClassFilter("all");
    setPage(1);
  };

  const hasFilter = gradeFilter !== "all" || classFilter !== "all";

  /* ---------- filter ---------- */
  const filtered = useMemo(() => {
    let result = parents;

    // Filter by class
    if (classFilter !== "all") {
      const selectedClassId = Number(classFilter);
      result = result.filter((p) => {
        const classIds = parentClassMap[p.id] || [];
        return classIds.includes(selectedClassId);
      });
    } else if (gradeFilter !== "all") {
      const gradeClassIds = classes
        .filter((c) => String(c?.khoi || "") === gradeFilter)
        .map((c) => c.id);
      result = result.filter((p) => {
        const classIds = parentClassMap[p.id] || [];
        return classIds.some((id) => gradeClassIds.includes(id));
      });
    }

    // Filter by keyword
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter((p) =>
        [p.hoTen, p.soDienThoai, p.email]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(lower))
      );
    }

    return result;
  }, [keyword, parents, classFilter, gradeFilter, parentClassMap, classes]);

  /* ---------- pagination ---------- */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  /* ---------- open create ---------- */
  const openCreate = () => {
    setEditingParent(null);
    setForm({ ...emptyForm });
    
    setModalOpen(true);
  };

  /* ---------- open edit ---------- */
  const openEdit = (parent) => {
    setEditingParent(parent);
    setForm({
      hoTen: parent.hoTen || "",
      soDienThoai: parent.soDienThoai || "",
      email: parent.email || "",
      quanHe: parent.quanHe || (isFemaleVietnameseName(parent.hoTen) ? "ME" : "CHA"),
      ngheNghiep: parent.ngheNghiep || "",
      isSmSActive: !!parent.isSmSActive
    });
    
    setModalOpen(true);
  };

  /* ---------- open detail ---------- */
  const openDetail = async (parent) => {
    setDetailParent(parent);
    setDetailStudents([]);
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await getStudentsByPhuHuynhId(parent.id);
      setDetailStudents(res?.data?.data || []);
    } catch {
      setDetailStudents([]);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (!form.hoTen.trim()) {
      notifyError("Vui lòng nhập họ tên.");
      return;
    }
    if (!form.soDienThoai.trim()) {
      notifyError("Vui lòng nhập số điện thoại.");
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      soDienThoai: form.soDienThoai.trim(),
      email: form.email.trim(),
      quanHe: form.quanHe,
      ngheNghiep: form.ngheNghiep.trim(),
      isSmSActive: form.isSmSActive
    };

    try {
      setSaving(true);
      if (editingParent) {
        const res = await updatePhuHuynh(editingParent.id, payload);
        const updated = res?.data?.data;
        setParents((prev) =>
          prev.map((p) => (p.id === editingParent.id ? updated : p))
        );
        notifySuccess("Cập nhật phụ huynh thành công!");
      } else {
        const res = await createPhuHuynh(payload);
        const created = res?.data?.data;
        setParents((prev) => [created, ...prev]);
        notifySuccess("Thêm phụ huynh thành công!");
      }
      setModalOpen(false);
    } catch {
      notifyError("Không thể lưu phụ huynh. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSMS = async (parent) => {
    try {
      const payload = {
        hoTen: parent.hoTen,
        soDienThoai: parent.soDienThoai,
        email: parent.email || "",
        quanHe: parent.quanHe,
        ngheNghiep: parent.ngheNghiep || "",
        isSmSActive: !parent.isSmSActive
      };
      const res = await updatePhuHuynh(parent.id, payload);
      const updated = res?.data?.data;
      setParents((prev) => prev.map((p) => (p.id === parent.id ? updated : p)));
      notifySuccess(updated.isSmSActive ? "Đã bật SMS" : "Đã tắt SMS");
    } catch (err) {
      notifyError("Không thể thay đổi trạng thái SMS. Vui lòng thử lại.");
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Quản lý phụ huynh</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Danh sách và thông tin liên hệ của phụ huynh học sinh.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ lọc Khối/Lớp */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                filterOpen || hasFilter
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Bộ lọc</span>
              {hasFilter && (
                <span className="flex items-center justify-center w-5 h-5 ml-1 text-[11px] font-bold text-white bg-blue-600 rounded-full">
                  {(gradeFilter !== "all" ? 1 : 0) + (classFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-blue-900">Lọc phụ huynh</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối học</label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => handleGradeSelect(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                    >
                      <option value="all">Tất cả khối</option>
                      {classesByGrade.map((group) => (
                        <option key={group.grade} value={group.grade}>
                          Khối {group.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp học</label>
                    <select
                      value={classFilter}
                      onChange={(e) => handleClassSelect(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors"
                    >
                      <option value="all">Tất cả lớp</option>
                      {filteredClasses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.tenLop}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 transition-colors"
                  >
                    Xóa lọc
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Làm mới */}
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Thêm mới */}
          <button 
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phụ huynh</span>
          </button>
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {error && <div className="p-4 m-6 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Họ tên</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/5">SĐT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">Quan hệ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-8 animate-pulse"></div></td>
                    <td className="px-6 py-5">
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-slate-100 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-slate-50 rounded w-24 animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-32 animate-pulse"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-100 rounded w-16 mx-auto animate-pulse"></div></td>
                    <td className="px-6 py-5"><div className="h-8 bg-slate-100 rounded w-16 ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy phụ huynh phù hợp.
                  </td>
                </tr>
              ) : (
                paged.map((parent, index) => (
                  <tr key={parent.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 cursor-pointer"
                          onClick={() => openDetail(parent)}
                        >
                          {parent.hoTen ? parent.hoTen.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <div 
                            className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                            onClick={() => openDetail(parent)}
                          >
                            {parent.hoTen}
                          </div>
                          {parent.ngheNghiep && (
                            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate max-w-[150px]" title={parent.ngheNghiep}>
                              {parent.ngheNghiep}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">
                        {parent.soDienThoai ? String(parent.soDienThoai).replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3") : "--"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-[200px]" title={parent.email}>
                        {parent.email || "--"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        {getQuanHeLabel(parent.quanHe)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 transition-opacity">

                        <button
                          onClick={() => openEdit(parent)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-auto">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            pageSizeOptions={[10, 15, 20, 50]}
          />
        </div>
      </div>

      {/* Add / Edit modal */}
      <SimpleModal
        open={modalOpen}
        title={editingParent ? "Cập nhật phụ huynh" : "Thêm phụ huynh"}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-5 p-1" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                value={form.hoTen}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, hoTen: e.target.value }))
                }
                placeholder="vd: Nguyễn Văn A"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                value={form.soDienThoai}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, soDienThoai: e.target.value }))
                }
                placeholder="vd: 0901234567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="vd: email@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nghề nghiệp</label>
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                value={form.ngheNghiep}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ngheNghiep: e.target.value }))
                }
                placeholder="vd: Kinh doanh"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Quan hệ</label>
              <div className="relative">
                <select
                  value={form.quanHe}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, quanHe: e.target.value }))
                  }
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 pr-10 outline-none transition-all"
                >
                  {QUAN_HE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Kích hoạt SMS (Nút gạt)</label>
              <div 
                className="flex items-center h-[46px] cursor-pointer"
                onClick={() => setForm((prev) => ({ ...prev, isSmSActive: !prev.isSmSActive }))}
              >
                <div className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 ease-in-out ${form.isSmSActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${form.isSmSActive ? 'translate-x-7' : 'translate-x-1'}`}/>
                </div>
                <span className={`ml-3 text-sm font-bold ${form.isSmSActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {form.isSmSActive ? 'Đang bật SMS' : 'Đang tắt'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => setModalOpen(false)}
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thông tin"
              )}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Detail modal */}
      <SimpleModal
        open={detailOpen}
        title="Chi tiết phụ huynh"
        onClose={() => setDetailOpen(false)}
        width={720}
      >
        {detailParent && (
          <div className="p-1">
            <div className="flex items-start gap-5 mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold shadow-sm shrink-0">
                {detailParent.hoTen ? detailParent.hoTen.charAt(0).toUpperCase() : "P"}
              </div>
              <div className="pt-1 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-blue-900 tracking-tight">{detailParent.hoTen}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                    detailParent.isSmSActive 
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${detailParent.isSmSActive ? "bg-blue-500" : "bg-slate-400"}`}></span>
                    {detailParent.isSmSActive ? "SMS Hoạt động" : "Tắt SMS"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-indigo-600 mt-1 mb-3">
                  {getQuanHeLabel(detailParent.quanHe)}
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <span className="material-symbols-outlined !text-[18px] text-slate-400">call</span>
                    <span className="font-medium text-slate-900">{detailParent.soDienThoai ? String(detailParent.soDienThoai).replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3") : "--"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <span className="material-symbols-outlined !text-[18px] text-slate-400">mail</span>
                    <span className="font-medium text-slate-900 truncate max-w-[200px]" title={detailParent.email}>{detailParent.email || "Không có email"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600 text-sm">
                    <span className="material-symbols-outlined !text-[18px] text-slate-400">work</span>
                    <span className="font-medium text-slate-900">{detailParent.ngheNghiep || "Không xác định"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">Học sinh liên quan</h4>
              
              {detailLoading ? (
                <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="ml-3 text-sm font-medium text-slate-600">Đang tải danh sách học sinh...</span>
                </div>
              ) : detailStudents.length > 0 ? (
                <div className="space-y-3">
                  {detailStudents.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                          {s.hoTen ? s.hoTen.charAt(0).toUpperCase() : "H"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{s.hoTen}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">MHS: {s.id}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800 text-sm">{s.lopHoc?.tenLop || s.lop?.tenLop || "--"}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">Lớp học</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-slate-400">group_off</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">Chưa có học sinh nào</div>
                  <div className="text-xs font-medium text-slate-500 mt-1">Phụ huynh này chưa được liên kết với học sinh nào trong hệ thống</div>
                </div>
              )}
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}
