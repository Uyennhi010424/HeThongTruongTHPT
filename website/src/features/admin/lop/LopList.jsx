import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Users, UserPlus, BookOpen, Search, MoreVertical, 
  Trash2, Edit, Save, X, Settings, RefreshCw, 
  Plus, Check, Building2, Calendar, FileText,
  UserCheck, AlertCircle, TrendingUp, Filter, GraduationCap, ArrowUpCircle, Eye, Shield,
  ChevronDown, ChevronUp
} from "lucide-react";
import { createLop, createLopBulk, deleteLop, getLop, syncSiSo, updateLop, assignGvcn, promoteStudents } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { getToHopMon } from "../../../api/toHopMonApi.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { getVisibleAcademicYears, getActiveAcademicYear } from "../../../utils/helpers.js";
import Pagination from "../../../components/common/Pagination.jsx";

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatGender = (value) => {
  if (value === false || value === "false" || value === "NU" || value === "Nu" || value === "nu" || value === "Nữ" || value === "nữ") return "Nữ";
  if (value === true || value === "true" || value === "NAM" || value === "Nam" || value === "nam") return "Nam";
  return "--";
};

const extractGradeFromClassName = (tenLop) => {
  const match = String(tenLop || "").trim().match(/^(10|11|12)/);
  return match ? match[1] : null;
};

const getNextAcademicYear = (currentYear) => {
  const parts = String(currentYear || "").split("-");
  if (parts.length === 2) {
    const y1 = parseInt(parts[0], 10);
    const y2 = parseInt(parts[1], 10);
    if (!isNaN(y1) && !isNaN(y2)) return `${y1 + 1}-${y2 + 1}`;
  }
  return "2026-2027";
};

// --- Dropdown Thao tác ---
// --- Dropdown Thao tác ---
const ActionDropdown = ({ item, onEdit, onDelete, onAssignTeacher }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { setIsOpen(false); onEdit(item); }} 
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <Edit className="w-4 h-4 text-slate-400" /> Chỉnh sửa
          </button>
          <button 
            onClick={() => { setIsOpen(false); onAssignTeacher(item); }} 
            className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-slate-400" /> Phân công GVCN
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button 
            onClick={() => { setIsOpen(false); onDelete(item); }} 
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4 text-red-500" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

// --- Modal Chi tiết (Centered Enterprise Style) ---
const ClassDetailModal = ({ item, toHopList, onClose, onViewStudents }) => {
  const toHop = toHopList.find(th => th.id === item.toHopId);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
        <div 
          className="w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <h2 className="text-lg font-bold text-blue-900">Chi tiết lớp học</h2>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Thông tin chung */}
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Tên lớp</span>
                <span className="text-sm font-semibold text-slate-900">{item.tenLop}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Năm học</span>
                <span className="text-sm font-semibold text-slate-900">{item.namHoc}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Khối</span>
                <span className="text-sm font-medium text-slate-900">{item.khoi}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Tổ hợp môn</span>
                <span className="text-sm font-medium text-slate-900">{toHop ? `${toHop.maToHop} - ${toHop.tenToHop}` : "Chưa gán"}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">GV chủ nhiệm</span>
                <span className="text-sm font-medium text-slate-900">{item.gvcn?.hoTen || item.gvcnTen || "Chưa phân công"}</span>
              </div>
            </div>

            <hr className="my-5 border-slate-200" />

            {/* Thông tin sĩ số */}
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Sĩ số hiện tại</span>
                <span className="text-sm font-semibold text-slate-900">{item.siSo || 0} học sinh</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Danh sách</span>
                <button
                  onClick={onViewStudents}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Xem danh sách chi tiết
                </button>
              </div>
            </div>
            
            {item.ghiChu && (
              <>
                <hr className="my-5 border-slate-200" />
                <div className="flex items-start">
                  <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Ghi chú</span>
                  <span className="text-sm text-slate-700">{item.ghiChu}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Modal Phân công GVCN ---
const AssignTeacherModal = ({ item, classes, onClose, onAssignSuccess }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const res = await getGiaoVien();
        let data = res?.data?.data || [];
        
        // Lọc ra danh sách giáo viên đã chủ nhiệm lớp khác trong CÙNG năm học
        const assignedTeacherIds = new Set();
        if (classes) {
          classes.forEach(c => {
            if (c.namHoc === item.namHoc && c.gvcn && c.id !== item.id) {
              assignedTeacherIds.add(c.gvcn.id);
            }
          });
        }
        
        // Loại bỏ những giáo viên đã có lớp chủ nhiệm
        data = data.filter(t => !assignedTeacherIds.has(t.id));

        setTeachers(data);
        const currentName = item?.gvcn?.hoTen || item?.gvcnTen;
        if (currentName) {
          const current = data.find((t) => t.hoTen === currentName);
          if (current) setSelectedTeacherId(String(current.id));
        }
      } catch (err) {
        notifyError("Không thể tải danh sách giáo viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await assignGvcn(item.id, { gvcnId: selectedTeacherId ? Number(selectedTeacherId) : null });
      notifySuccess("Phân công GVCN thành công!");
      onAssignSuccess();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể phân công GVCN."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
        <div 
          className="w-full max-w-md bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-blue-900">Phân công GVCN</h2>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="text-sm text-slate-600">
              Lớp: <span className="font-semibold text-slate-900">{item?.tenLop}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Giáo viên chủ nhiệm</label>
              {loading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <select 
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow outline-none"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  <option value="">-- Chọn giáo viên (hoặc Bỏ phân công) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.hoTen} - {t.boMon || 'Chưa cập nhật'}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit" 
                disabled={loading || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

// --- Modal Xem danh sách học sinh ---
const StudentListModal = ({ item, onClose }) => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await getHocSinh({ lopId: item.id });
        // `getHocSinh` returns a list directly or a paginated object
        // Depending on backend, handle both
        let data = res?.data?.data;
        if (data && data.content) {
          data = data.content; // If paginated
        }
        
        const studentList = data || [];
        
        // Sort alphabetically by last name (Tên) then full name (Họ Đệm)
        studentList.sort((a, b) => {
          const getNameTokens = (name) => {
            if (!name) return "";
            return name.trim().split(" ");
          };
          
          const tokensA = getNameTokens(a.hoTen);
          const tokensB = getNameTokens(b.hoTen);
          
          const tenA = tokensA.length > 0 ? tokensA[tokensA.length - 1] : "";
          const tenB = tokensB.length > 0 ? tokensB[tokensB.length - 1] : "";
          
          const compareTen = tenA.localeCompare(tenB, 'vi');
          if (compareTen !== 0) return compareTen;
          
          return (a.hoTen || "").localeCompare(b.hoTen || "", 'vi');
        });
        
        setStudents(studentList);
      } catch (err) {
        notifyError("Không thể tải danh sách học sinh.");
      } finally {
        setLoading(false);
      }
    };
    if (item?.id) fetchStudents();
  }, [item]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        (s.hoTen || "").toLowerCase().includes(term) ||
        (s.maHocSinh || "").toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
        <div 
          className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200 max-h-[85vh]" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-blue-900">Danh sách học sinh</h2>
              <p className="text-sm text-slate-500 mt-0.5">Lớp: {item?.tenLop} - Sĩ số: {loading ? (item?.siSo || 0) : students.length} học sinh</p>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar inside modal */}
          <div className="px-5 pt-3 pb-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm nhanh học sinh theo họ tên hoặc mã HS..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Lớp này chưa có học sinh nào.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Không tìm thấy học sinh nào phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold">STT</th>
                      <th className="px-4 py-3 font-semibold">Mã HS</th>
                      <th className="px-4 py-3 font-semibold">Họ tên</th>
                      <th className="px-4 py-3 font-semibold">Ngày sinh</th>
                      <th className="px-4 py-3 font-semibold">Giới tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((hs, index) => (
                      <tr key={hs.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{hs.maHocSinh}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{hs.hoTen}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(hs.ngaySinh)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatGender(hs.gioiTinh)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function LopList() {
  const notifyClassesUpdated = () => {
    try {
      window.dispatchEvent(new Event("classes-updated"));
      window.localStorage.setItem("classesUpdatedAt", String(Date.now()));
    } catch (e) {}
  };
  
  const [classes, setClasses] = useState([]);
  const [toHopList, setToHopList] = useState([]);
  const [allNamHoc, setAllNamHoc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);
  const [studentListModalOpen, setStudentListModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const { confirm } = useConfirm();

  const [selectedNamHoc, setSelectedNamHoc] = useState("");

  const visibleNamHoc = useMemo(() => {
    return getVisibleAcademicYears(allNamHoc);
  }, [allNamHoc]);

  const activeNamHoc = useMemo(() => {
    return getActiveAcademicYear(allNamHoc);
  }, [allNamHoc]);

  const currentAcademicYear = activeNamHoc?.tenNamHoc || visibleNamHoc[0]?.tenNamHoc || "2025-2026";

  useEffect(() => {
    if (activeNamHoc?.tenNamHoc && !selectedNamHoc) {
      setSelectedNamHoc(activeNamHoc.tenNamHoc);
    }
  }, [activeNamHoc, selectedNamHoc]);
  
  const [form, setForm] = useState({
    tenLop: "",
    khoi: "10",
    namHoc: "2025-2026",
    toHopId: ""
  });
  
  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm lớp học...");
    setIsSearchVisible(true);
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [lopRes, toHopRes, namHocRes] = await Promise.all([
        getLop(),
        getToHopMon(),
        getNamHoc().catch(() => ({ data: { data: [] } }))
      ]);
      setClasses(lopRes?.data?.data || []);
      setToHopList(toHopRes?.data?.data || []);
      const rawYears = namHocRes?.data?.data || [];
      setAllNamHoc(rawYears);
      const visible = getVisibleAcademicYears(rawYears);
      const active = getActiveAcademicYear(rawYears);
      if (active?.tenNamHoc) {
        setSelectedNamHoc((prev) => prev || active.tenNamHoc);
      } else if (visible.length > 0) {
        setSelectedNamHoc((prev) => prev || visible[0].tenNamHoc);
      }
    } catch (err) {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteYear = async () => {
    const currentYear = currentAcademicYear;
    const parts = currentYear.split("-");
    if (parts.length !== 2) {
      notifyError("Định dạng năm học không hợp lệ.");
      return;
    }
    const nextYear = getNextAcademicYear(currentYear);
    const nextYearExists = allNamHoc.some((y) => y.tenNamHoc === nextYear);

    const confirmMessage = (
      <div className="text-left space-y-3 w-full mt-2">
        <p className="text-slate-800 text-[15px]">
          Bạn có chắc chắn muốn kết thúc năm học hiện hành <strong>{currentYear}</strong> và đưa toàn bộ học sinh lên lớp cho năm học <strong>{nextYear}</strong> không?
        </p>
        <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl text-sm border border-amber-200">
          <p className="font-bold mb-2 flex items-center gap-2 text-amber-950">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lưu ý quan trọng:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium text-xs sm:text-sm">
            <li>Năm học hiện hành: <strong>{currentYear}</strong> (Đang mở trong hệ thống).</li>
            <li>Khối 12 sẽ được xét <strong>Tốt nghiệp</strong>.</li>
            <li>Khối 10, 11 sẽ tự động <strong>lên lớp tiếp theo</strong> ({nextYear}).</li>
            <li>Giáo viên chủ nhiệm sẽ được luân chuyển theo lớp mới (nếu có).</li>
            <li>
              Cần thiết lập danh sách năm học <strong>{nextYear}</strong> trong hệ thống trước.
              {nextYearExists ? (
                <span className="text-green-700 font-semibold ml-1">(&#10003; Đã có sẵn trên hệ thống)</span>
              ) : (
                <span className="text-amber-700 font-semibold ml-1">(&#9888; Chưa tạo trong Năm học & Học kỳ)</span>
              )}
            </li>
          </ul>
        </div>
      </div>
    );
    
    if (await confirm(confirmMessage, "Xác nhận kết thúc năm học")) {
      try {
        setLoading(true);
        const res = await promoteStudents({ currentNamHoc: currentYear, nextNamHoc: nextYear });
        notifySuccess("Lên lớp thành công!");
        loadData();
      } catch (err) {
        notifyError("Lỗi lên lớp: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = useMemo(() => {
    const lower = keyword.toLowerCase();
    const allowedYears = new Set(visibleNamHoc.map((y) => y.tenNamHoc));

    const result = classes.filter((item) => {
      // 1. Filter by school year
      if (selectedNamHoc && selectedNamHoc !== "ALL") {
        if (item.namHoc !== selectedNamHoc) return false;
      } else {
        // "ALL" or empty -> only show years <= current active year
        if (allowedYears.size > 0 && item.namHoc && !allowedYears.has(item.namHoc)) return false;
      }

      // 2. Filter by search keyword
      if (!keyword.trim()) return true;
      return [item.tenLop, item.khoi]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lower));
    });
    
    return result.sort((a, b) => {
      // 1. Năm học mới nhất lên trên
      const yearCompare = String(b.namHoc || "").localeCompare(String(a.namHoc || ""));
      if (yearCompare !== 0) return yearCompare;
      
      // 2. Khối 10 -> 11 -> 12
      const khoiA = Number(a.khoi || 0);
      const khoiB = Number(b.khoi || 0);
      if (khoiA !== khoiB) return khoiA - khoiB;
      
      // 3. Tên lớp theo A-Z (10A1 -> 10A2)
      return String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { numeric: true, sensitivity: "base" });
    });
  }, [keyword, classes, selectedNamHoc, visibleNamHoc]);

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClasses.slice(start, start + itemsPerPage);
  }, [filteredClasses, currentPage, itemsPerPage]);

  const openCreate = () => {
    setEditingClass(null);
    setForm({ tenLop: "", khoi: "10", namHoc: selectedNamHoc && selectedNamHoc !== "ALL" ? selectedNamHoc : currentAcademicYear, toHopId: "" });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingClass(item);
    setForm({
      tenLop: item.tenLop || "",
      khoi: String(item.khoi || "10"),
      namHoc: item.namHoc || currentAcademicYear,
      toHopId: item.toHopId ? String(item.toHopId) : ""
    });
    setModalOpen(true);
  };

  const handleDelete = async (target) => {
    const item = typeof target === "object" && target !== null 
      ? target 
      : classes.find(c => c.id === target) || { id: target, tenLop: "lớp này" };

    const classId = item.id;
    if (!classId) {
      notifyError("Không tìm thấy ID lớp học để xóa.");
      return;
    }

    if (!(await confirm(`Bạn có chắc chắn muốn xóa lớp ${item.tenLop}? Dữ liệu lớp học sẽ bị xóa khỏi hệ thống.`, "Xác nhận xóa lớp học"))) return;
    try {
      await deleteLop(classId);
      setClasses((prev) => prev.filter((row) => row.id !== classId));
      notifySuccess("Xóa lớp học thành công.");
      notifyClassesUpdated();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể xóa lớp học."));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTenLop = form.tenLop.trim();
    if (!trimmedTenLop) { notifyError("Vui lòng nhập tên lớp."); return; }
    if (!form.khoi) { notifyError("Vui lòng chọn khối."); return; }
    if (!form.namHoc.trim()) { notifyError("Vui lòng nhập năm học."); return; }

    const CLASS_NAME_REGEX = /^(10|11|12)[A-Za-z0-9]+$/;
    if (!CLASS_NAME_REGEX.test(trimmedTenLop)) {
      notifyError("Tên lớp không hợp lệ (VD: 10A1, 11B2, 12C3).");
      return;
    }

    const gradeInName = extractGradeFromClassName(trimmedTenLop);
    if (!gradeInName || gradeInName !== String(form.khoi)) {
      notifyError(`Tên lớp phải thuộc khối ${form.khoi} (VD: ${form.khoi}A1).`);
      return;
    }

    if (!form.toHopId) {
      notifyError("Vui lòng chọn tổ hợp môn.");
      return;
    }

    const payload = {
      tenLop: trimmedTenLop,
      khoi: form.khoi,
      namHoc: form.namHoc.trim(),
      toHopId: Number(form.toHopId)
    };

    try {
      if (editingClass) {
        const response = await updateLop(editingClass.id, payload);
        const updated = response?.data?.data || {};
        const merged = {
          ...editingClass,
          ...updated,
          tenLop: payload.tenLop,
          khoi: Number(payload.khoi),
          namHoc: payload.namHoc,
          toHopId: payload.toHopId
        };
        setClasses((prev) => prev.map((row) => (row.id === editingClass.id ? merged : row)));
        notifySuccess("Cập nhật lớp học thành công.");
      } else {
        const response = await createLop(payload);
        const created = response?.data?.data;
        if (created) {
          setClasses((prev) => [created, ...prev]);
        }
        notifySuccess("Thêm lớp học thành công.");
      }
      notifyClassesUpdated();
      setModalOpen(false);

      // Đồng bộ ngầm toàn bộ dữ liệu lớp học mới nhất từ server mà không cần reload trang
      getLop().then(res => {
        if (res?.data?.data) {
          setClasses(res.data.data);
        }
      }).catch(() => {});
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể lưu lớp học."));
    }
  };

  const getToHopStyle = (toHop) => {
    if (!toHop) return { label: "Chưa gán", bg: "bg-slate-100", text: "text-slate-600" };
    if (toHop.ban === "Tự nhiên") return { label: `${toHop.tenToHop}`, bg: "bg-blue-50", text: "text-blue-700", full: toHop.tenToHop };
    if (toHop.ban === "Xã hội") return { label: `${toHop.tenToHop}`, bg: "bg-purple-50", text: "text-purple-700", full: toHop.tenToHop };
    return { label: `${toHop.tenToHop}`, bg: "bg-indigo-50", text: "text-indigo-700", full: toHop.tenToHop };
  };

  const availableNamHoc = useMemo(() => {
    const years = [...new Set(classes.map((item) => item.namHoc).filter(Boolean))];
    return years.sort().reverse();
  }, [classes]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Danh mục lớp học</h1>
          <p className="text-slate-500 mt-1">Quản lý danh sách lớp học, phân công giáo viên và sĩ số.</p>
        </div>
        
        <div className="px-6 py-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={loadData} className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-white border border-slate-200 shadow-sm" title="Làm mới">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
            
            {/* Year Selector Dropdown */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-600 text-xs sm:text-sm">Năm học:</span>
              <select
                value={selectedNamHoc}
                onChange={(e) => {
                  setSelectedNamHoc(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-blue-900 font-extrabold text-xs sm:text-sm focus:outline-none cursor-pointer"
              >
                {visibleNamHoc.map((nh) => (
                  <option key={nh.id || nh.tenNamHoc} value={nh.tenNamHoc}>
                    {nh.tenNamHoc}
                  </option>
                ))}
                <option value="ALL">-- Tất cả các năm --</option>
              </select>
            </div>

            <div className="text-sm font-medium text-slate-500">
              Tổng số: <span className="text-slate-900 font-bold">{filteredClasses.length}</span> lớp
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handlePromoteYear} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 font-semibold rounded-xl transition-all">
              <ArrowUpCircle className="w-5 h-5" /> Lên lớp năm học
            </button>
            <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/20 font-semibold rounded-xl transition-all">
              <Plus className="w-5 h-5" /> Thêm lớp
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
        {error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto min-w-[750px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">STT</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên lớp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khối</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tổ hợp môn</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sĩ số</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GVCN</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedClasses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                        Không tìm thấy dữ liệu lớp học phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedClasses.map((item, index) => {
                      const toHop = toHopList.find((th) => th.id === item.toHopId);
                      const toHopStyle = getToHopStyle(toHop);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setSelectedClass(item); setDetailModalOpen(true); }}>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium text-center">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{item.tenLop}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{item.namHoc}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                              Khối {item.khoi}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${toHopStyle.bg} ${toHopStyle.text}`} title={toHopStyle.full}>
                              {toHopStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {item.siSo || 0}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-700">{item.gvcn?.hoTen || item.gvcnTen || <span className="text-slate-400 italic">Chưa phân công</span>}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200/60">
                              Hoạt động
                            </span>
                          </td>
                          <td className="px-6 py-4 border-l border-slate-100 bg-slate-50/30">
                            <div className="transition-opacity flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              <ActionDropdown 
                                item={item} 
                                onEdit={openEdit} 
                                onDelete={handleDelete}
                                onAssignTeacher={(it) => { setSelectedClass(it); setAssignTeacherModalOpen(true); }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Collapsible Accordion Card View */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="h-5 bg-slate-100 rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                  </div>
                ))
              ) : paginatedClasses.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  Không tìm thấy dữ liệu lớp học phù hợp.
                </div>
              ) : (
                paginatedClasses.map((item, index) => {
                  const isExpanded = expandedClassId === item.id;
                  const toHop = toHopList.find((th) => th.id === item.toHopId);
                  const toHopStyle = getToHopStyle(toHop);
                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                      {/* Compact Header Summary */}
                      <div
                        className="flex items-center justify-between cursor-pointer gap-2"
                        onClick={() => setExpandedClassId(isExpanded ? null : item.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                            {item.tenLop?.substring(0, 3) || "Lớp"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{item.tenLop}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">Khối {item.khoi}</span>
                              <span>•</span>
                              <span>{item.siSo || 0} HS</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${toHopStyle.bg} ${toHopStyle.text}`}>
                            {toHopStyle.label}
                          </span>
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Section */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2.5 animate-in fade-in-50 duration-200">
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Năm học:</span>
                              <span className="font-semibold text-slate-800">{item.namHoc}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Sĩ số:</span>
                              <span className="font-semibold text-slate-800">{item.siSo || 0} học sinh</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Tổ hợp môn:</span>
                              <span className="font-semibold text-slate-800">{toHop ? `${toHop.maToHop} - ${toHop.tenToHop}` : "Chưa gán"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">GVCN:</span>
                              <span className="font-semibold text-slate-800">{item.gvcn?.hoTen || item.gvcnTen || "Chưa phân công"}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => { setSelectedClass(item); setDetailModalOpen(true); }}
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Chi tiết
                            </button>
                            <button
                              onClick={() => { setSelectedClass(item); setAssignTeacherModalOpen(true); }}
                              className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Phân GVCN
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="mt-auto">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredClasses.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setItemsPerPage(sz); setCurrentPage(1); }}
            pageSizeOptions={[10, 15, 20, 50]}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-blue-900">{editingClass ? "Chỉnh sửa lớp học" : "Thêm lớp học mới"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tên lớp <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.tenLop}
                  onChange={e => setForm(p => ({ ...p, tenLop: e.target.value }))}
                  placeholder="VD: 10A1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Khối <span className="text-red-500">*</span></label>
                  <select
                    value={form.khoi}
                    onChange={e => setForm(p => ({ ...p, khoi: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Năm học <span className="text-red-500">*</span></label>
                  {visibleNamHoc.length > 0 ? (
                    <select
                      value={form.namHoc}
                      onChange={e => setForm(p => ({ ...p, namHoc: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    >
                      {visibleNamHoc.map(nh => (
                        <option key={nh.id || nh.tenNamHoc} value={nh.tenNamHoc}>
                          {nh.tenNamHoc}
                        </option>
                      ))}
                      {form.namHoc && !visibleNamHoc.some(nh => nh.tenNamHoc === form.namHoc) && (
                        <option value={form.namHoc}>{form.namHoc}</option>
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.namHoc}
                      onChange={e => setForm(p => ({ ...p, namHoc: e.target.value }))}
                      placeholder="VD: 2025-2026"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tổ hợp môn <span className="text-red-500">*</span></label>
                <select
                  value={form.toHopId}
                  onChange={e => setForm(p => ({ ...p, toHopId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                >
                  <option value="">-- Chọn tổ hợp môn --</option>
                  {toHopList.map(th => (
                    <option key={th.id} value={th.id}>{th.maToHop} - {th.tenToHop} ({th.ban})</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {/* Detail Modal */}
      {detailModalOpen && selectedClass && (
        <ClassDetailModal 
          item={selectedClass} 
          toHopList={toHopList} 
          onClose={() => setDetailModalOpen(false)}
          onViewStudents={() => {
            setDetailModalOpen(false);
            setStudentListModalOpen(true);
          }}
        />
      )}

      {/* Assign Teacher Modal */}
      {assignTeacherModalOpen && selectedClass && (
        <AssignTeacherModal
          item={selectedClass}
          classes={classes}
          onClose={() => setAssignTeacherModalOpen(false)}
          onAssignSuccess={() => {
            setAssignTeacherModalOpen(false);
            loadData();
          }}
        />
      )}

      {/* Student List Modal */}
      {studentListModalOpen && selectedClass && (
        <StudentListModal
          item={selectedClass}
          onClose={() => setStudentListModalOpen(false)}
        />
      )}
    </div>
  );
}
