import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical, Eye, Edit2, Trash2, X, RefreshCw, Plus, Settings2, ChevronDown } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getMonHoc, createMonHoc } from "../../../api/monhocApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { autoAssignAll, createPhanCongDay, deletePhanCongDay, deletePhanCongDayById, getPhanCongDay } from "../../../api/phancongDayApi.js";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { normalizeText } from "../../../utils/normalizeText.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import { getVisibleAcademicYears, getActiveAcademicYear } from "../../../utils/helpers.js";

const formatHocKy = (value) => (Number(value) === 2 ? "Học kỳ 2" : "Học kỳ 1");

const sortByAssignment = (a, b) => {
  const c1 = String(a?.lop || "").localeCompare(String(b?.lop || ""), "vi", { sensitivity: "base", numeric: true });
  if (c1 !== 0) return c1;
  const c2 = String(a?.mon || "").localeCompare(String(b?.mon || ""), "vi", { sensitivity: "base", numeric: true });
  if (c2 !== 0) return c2;
  return String(a?.gv || "").localeCompare(String(b?.gv || ""), "vi", { sensitivity: "base", numeric: true });
};

// Component Dropdown Action
const ActionDropdown = ({ item, onView, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.action-menu-${item.id}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [item.id]);

  return (
    <div className={`relative action-menu-${item.id}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={() => { setIsOpen(false); onView(item); }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" /> Xem chi tiết
          </button>
          <button
            onClick={() => { setIsOpen(false); onEdit(item); }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Chỉnh sửa
          </button>
          <button
            onClick={() => { setIsOpen(false); onDelete(item); }}
            className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

// Component Dropdown Thêm Phân Công
const AddDropdown = ({ onManual, onAuto }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.add-menu-wrapper')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative add-menu-wrapper">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200"
      >
        <Plus className="w-4 h-4" />
        <span>Thêm phân công</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
          <button
            onClick={() => { setIsOpen(false); onManual(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm thủ công
          </button>
          <button
            onClick={() => { setIsOpen(false); onAuto(); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Tự động phân công
          </button>
        </div>
      )}
    </div>
  );
};

export default function PhanCongPage() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formNamHoc, setFormNamHoc] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto assign state
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoNamHoc, setAutoNamHoc] = useState("");

  // Filter state
  const [filter, setFilter] = useState({
    namHoc: "",
    hocKy: 0,
    khoi: "",
    lop: "",
    monThi: ""
  });
  
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [academicYears, setAcademicYears] = useState([]);

  const namHocList = useMemo(() => {
    const set = new Set([
      ...academicYears,
      ...assignments.map((a) => a.namHoc),
      ...classes.map((c) => c.namHoc)
    ].filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [academicYears, assignments, classes]);

  // Lọc danh sách lớp trong Form thêm/sửa phân công theo đúng Năm học hiện hành
  const formClassList = useMemo(() => {
    const targetYear = formNamHoc || filter.namHoc || autoNamHoc;
    let list = classes;
    if (targetYear) {
      const filtered = classes.filter((c) => String(c.namHoc || "").trim() === String(targetYear).trim());
      if (filtered.length > 0) {
        list = filtered;
      }
    }
    return list.slice().sort((a, b) => {
      const cmp = String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { numeric: true });
      if (cmp !== 0) return cmp;
      return String(b.namHoc || "").localeCompare(String(a.namHoc || ""));
    });
  }, [classes, formNamHoc, filter.namHoc, autoNamHoc]);
  
  const khoiList = ["Khối 10", "Khối 11", "Khối 12"];

  const filteredAssignments = useMemo(() => {
    let result = assignments;
    if (filter.namHoc) result = result.filter((a) => a.namHoc === filter.namHoc);
    if (filter.hocKy > 0) result = result.filter((a) => Number(a.hocKy) === filter.hocKy);
    if (filter.khoi) result = result.filter((a) => a.lop.startsWith(filter.khoi.replace("Khối ", "")));
    if (filter.lop) result = result.filter((a) => a.lop === filter.lop);
    if (filter.monThi) result = result.filter((a) => a.mon === filter.monThi);
    
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter((a) =>
        [a.gv, a.ma, a.mon, a.lop]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(lower))
      );
    }
    return result;
  }, [assignments, filter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAssignments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, currentPage, pageSize]);

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm phân công...");
    setIsSearchVisible(true);
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [gv, mh, lop, phanCong, nhRes] = await Promise.all([
        getGiaoVien(),
        getMonHoc(),
        getLop(),
        getPhanCongDay(),
        getNamHoc().catch(() => ({ data: { data: [] } }))
      ]);

      setTeachers((gv?.data?.data || []).sort((a, b) => String(a?.hoTen || "").localeCompare(String(b?.hoTen || ""), "vi", { sensitivity: "base", numeric: true })));
      setSubjects(mh?.data?.data || []);
      const classList = lop?.data?.data || [];
      setClasses(classList);

      const rawNamHoc = nhRes?.data?.data || [];
      const visibleNamHoc = getVisibleAcademicYears(rawNamHoc);
      const activeNamHoc = getActiveAcademicYear(visibleNamHoc);
      
      const yearsFromNh = visibleNamHoc.map(nh => nh.tenNamHoc).filter(Boolean);
      const visibleSet = new Set(yearsFromNh);
      const allYears = Array.from(new Set([
        ...yearsFromNh,
        ...classList.map(l => l.namHoc).filter(y => visibleSet.has(y)),
        ...(phanCong?.data?.data || []).map(p => p.namHoc).filter(y => visibleSet.has(y))
      ])).sort().reverse();
      
      setAcademicYears(allYears);

      const defaultNam = activeNamHoc?.tenNamHoc || allYears[0] || "2025-2026";
      setAutoNamHoc(defaultNam);
      setFilter(p => ({ ...p, namHoc: p.namHoc || defaultNam }));

      const rows = (phanCong?.data?.data || []).map((item) => ({
        id: item.id,
        gv: item.giaoVienHoTen || "--",
        ma: item.maGiaoVien || "",
        mon: item.monHocTen || "--",
        lop: item.tenLop || "--",
        hk: formatHocKy(item.hocKy),
        hocKy: item.hocKy,
        namHoc: item.namHoc || "",
        khoi: (item.tenLop || "").substring(0, 2)
      }));
      setAssignments(rows.sort(sortByAssignment));
      setPage(1);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssign = async () => {
    const teacher = teachers.find((t) => String(t.id) === String(selectedTeacherId));
    if (!teacher) { notifyError("Vui lòng chọn giáo viên."); return; }
    if (!selectedSubject) { notifyError("Vui lòng chọn môn học."); return; }
    if (!selectedClassId) { notifyError("Vui lòng chọn lớp học."); return; }

    let mon = subjects.find((m) => normalizeText(m.tenMon) === normalizeText(selectedSubject));
    if (!mon) mon = subjects.find((m) => normalizeText(m.tenMon).includes(normalizeText(selectedSubject)));
    if (!mon) {
      try { mon = (await createMonHoc({ tenMon: selectedSubject, heSo: 1 }))?.data?.data; } catch {}
    }
    if (!mon) { notifyError("Môn học chưa có trong hệ thống."); return; }

    const lopObj = classes.find((c) => String(c.id) === String(selectedClassId));
    const namHocVal = formNamHoc || lopObj?.namHoc || filter.namHoc || autoNamHoc || "";

    try {
      setSaving(true);
      // Mặc định phân công cho cả năm học (tạo HK1 và tự động đồng bộ sang HK2)
      await createPhanCongDay({
        giaoVienId: Number(selectedTeacherId), monHocId: mon.id,
        lopId: Number(selectedClassId), hocKy: 1, namHoc: namHocVal
      });

      axiosClient.invalidateCache("/phancong-day");
      await fetchData();

      notifySuccess(`Đã phân công ${teacher.hoTen} dạy ${selectedSubject} lớp ${lopObj?.tenLop || ""} cả năm học.`);
      setFormOpen(false);
      setSelectedSubject("");
      setSelectedClassId("");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    const defaultYear = filter.namHoc || autoNamHoc || academicYears[0] || "2025-2026";
    setFormNamHoc(defaultYear);
    setSelectedTeacherId("");
    setSelectedSubject("");
    setSelectedClassId("");
    setFormOpen(true);
  };

  const handleAutoAssign = async () => {
    if (!autoNamHoc) { notifyError("Vui lòng chọn năm học."); return; }
    try {
      const res = await autoAssignAll(autoNamHoc, 1);
      const createdCount = (res?.data?.data || []).length;
      notifySuccess(`Tự động phân công cả năm học ${autoNamHoc} thành công!`);
      axiosClient.invalidateCache("/phancong-day");
      fetchData();
      setAutoOpen(false);
    } catch (err) { notifyError(err?.response?.data?.message || "Thất bại."); }
  };

  const handleDeleteAll = async () => {
    if (!filter.namHoc) { notifyError("Vui lòng chọn năm học trước khi xóa."); return; }
    try {
      const res = await deletePhanCongDay(filter.namHoc, filter.hocKy > 0 ? filter.hocKy : 0);
      const count = Number(res?.data?.data || 0);
      notifySuccess(`Đã xóa ${count} phân công.`);
      axiosClient.invalidateCache("/phancong-day");
      fetchData();
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể xóa.");
    } finally {
      setDeleteAllModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const item = deleteModal.item;
    if (!item) return;
    try {
      if (item.id) await deletePhanCongDayById(item.id);
      setAssignments((prev) => prev.filter((a) => a.id !== item.id));
      notifySuccess("Đã xóa phân công.");
    } catch {
      notifyError("Không thể xóa phân công.");
    } finally {
      setDeleteModal({ open: false, item: null });
    }
  };

  const handleEdit = (item) => {
    const matchedClass = classes.find(c => c.tenLop === item.lop && (!item.namHoc || c.namHoc === item.namHoc));
    const targetYear = item.namHoc || matchedClass?.namHoc || filter.namHoc || autoNamHoc;
    setFormNamHoc(targetYear);
    setSelectedTeacherId(teachers.find(t => t.maGiaoVien === item.ma)?.id || "");
    setSelectedSubject(item.mon !== "--" ? item.mon : "");
    setSelectedClassId(matchedClass?.id || classes.find(c => c.tenLop === item.lop)?.id || "");
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900">
      <div className="p-6 space-y-6">
        {/* Header & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Phân công giảng dạy</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Quản lý và phân bổ giáo viên giảng dạy theo môn học, khối lớp và học kỳ.</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
            <button
              onClick={() => {
                fetchData();
                setFilter(p => ({ ...p, khoi: "", lop: "", monThi: "", hocKy: 0 }));
              }}
              className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200 shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <AddDropdown onManual={handleOpenAddModal} onAuto={() => setAutoOpen(true)} />
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Năm học</label>
              <select
                value={filter.namHoc}
                onChange={(e) => { setFilter(p => ({ ...p, namHoc: e.target.value })); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Tất cả</option>
                {namHocList.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Học kỳ</label>
              <select
                value={filter.hocKy}
                onChange={(e) => { setFilter(p => ({ ...p, hocKy: Number(e.target.value) })); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value={0}>Tất cả học kỳ</option>
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Khối</label>
              <select
                value={filter.khoi}
                onChange={(e) => { setFilter(p => ({ ...p, khoi: e.target.value, lop: "" })); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Tất cả</option>
                {khoiList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Lớp</label>
              <select
                value={filter.lop}
                onChange={(e) => { setFilter(p => ({ ...p, lop: e.target.value })); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Tất cả</option>
                {classes
                  .filter((c) => !filter.namHoc || c.namHoc === filter.namHoc)
                  .filter((c) => !filter.khoi || String(c.khoi) === filter.khoi.replace("Khối ", ""))
                  .map((c) => <option key={c.id} value={c.tenLop}>{c.tenLop}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Môn học</label>
              <select
                value={filter.monThi}
                onChange={(e) => { setFilter(p => ({ ...p, monThi: e.target.value })); setPage(1); }}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="">Tất cả</option>
                {subjects.map((m) => <option key={m.id} value={m.tenMon}>{m.tenMon}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">STT</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Giáo viên</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Mã GV</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Môn học</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Lớp</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-28">Học kỳ</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-28">Năm học</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">Trạng thái</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-8 mx-auto" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-32" /></td>
                      <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-16 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-16 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : pagedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                        <Settings2 className="w-7 h-7 text-blue-500" />
                      </div>
                      <div className="text-base font-bold text-slate-800 mb-1">Chưa có phân công giảng dạy nào</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
                        Bạn có thể chọn phân công tự động cho toàn bộ lớp học hoặc thêm thủ công theo từng giáo viên.
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setAutoOpen(true)}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Tự động phân công ngay</span>
                        </button>
                        <button
                          onClick={handleOpenAddModal}
                          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm thủ công</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedAssignments.map((row, idx) => {
                    const isAssigned = row.gv && row.gv !== "--";
                    return (
                      <tr key={`${row.id}-${row.lop}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3.5 text-center text-slate-400 font-bold">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {row.gv}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-xs font-semibold">
                          {row.ma}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {row.mon}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {row.lop}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                          {row.hk}
                        </td>
                        <td className="px-4 py-3.5 text-center text-slate-600 font-semibold">
                          {row.namHoc || "--"}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            isAssigned 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {isAssigned ? "Đã phân công" : "Chưa phân công"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <ActionDropdown
                            item={row}
                            onView={(item) => { setSelectedItem(item); setDrawerOpen(true); }}
                            onEdit={handleEdit}
                            onDelete={(item) => setDeleteModal({ open: true, item })}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredAssignments.length > 0 && (
            <div className="mt-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAssignments.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Drawer Chi tiết */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <h2 className="text-lg font-bold text-blue-900">Chi tiết phân công</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {selectedItem && (
                <div className="space-y-6">
                  {/* Teacher Info */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="text-sm font-semibold text-blue-800 mb-1">Giáo viên phụ trách</div>
                    <div className="text-lg font-bold text-slate-900">{selectedItem.gv}</div>
                    <div className="text-sm text-slate-500 font-mono mt-1">Mã GV: {selectedItem.ma}</div>
                  </div>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Môn học</div>
                      <div className="font-semibold text-slate-900">{selectedItem.mon}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lớp</div>
                      <div className="font-semibold text-slate-900">{selectedItem.lop}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Khối</div>
                      <div className="font-semibold text-slate-900">Khối {selectedItem.khoi}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Năm học</div>
                      <div className="font-semibold text-slate-900">{selectedItem.namHoc}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Học kỳ</div>
                      <div className="font-semibold text-slate-900">{selectedItem.hk}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          selectedItem.gv && selectedItem.gv !== "--"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {selectedItem.gv && selectedItem.gv !== "--" ? "Đã phân công" : "Chưa phân công"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      <SimpleModal open={formOpen} title="Thêm phân công" onClose={() => setFormOpen(false)} width={640}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAssign(); }}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Năm học <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <select
              value={formNamHoc}
              onChange={(e) => {
                setFormNamHoc(e.target.value);
                setSelectedClassId("");
              }}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {namHocList.map((n) => (
                <option key={n} value={n}>
                  Năm học {n}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Giáo viên <span className="text-red-500 font-bold ml-0.5">*</span></label>
              <select
                value={selectedTeacherId}
                onChange={(e) => { setSelectedTeacherId(e.target.value); setSelectedSubject(""); setSelectedClassId(""); }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn GV --</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.hoTen} - {t.maGiaoVien}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Môn học <span className="text-red-500 font-bold ml-0.5">*</span></label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn môn --</option>
                {(() => {
                  const t = teachers.find((x) => String(x.id) === String(selectedTeacherId));
                  if (t?.boMon) {
                    const parts = String(t.boMon).split(/[,;\/|]+/).map((s) => s.trim()).filter(Boolean);
                    if (parts.length) return parts.map((p) => <option key={p} value={p}>{p}</option>);
                  }
                  return subjects.map((m) => <option key={m.id} value={m.tenMon}>{m.tenMon}</option>);
                })()}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Lớp <span className="text-red-500 font-bold ml-0.5">*</span></label>
              <select 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn lớp --</option>
                {formClassList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.tenLop} {l.khoi ? `(Khối ${l.khoi})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setFormOpen(false)}>Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" disabled={saving}>
              {saving ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Auto Assign Modal */}
      <SimpleModal open={autoOpen} title="Tự động phân công giảng dạy" onClose={() => setAutoOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Hệ thống sẽ tự động phân bổ và phân công giáo viên giảng dạy cho tất cả các lớp trong năm học theo đúng chuyên môn bộ môn (áp dụng cho cả <strong>Học kỳ 1</strong> và <strong>Học kỳ 2</strong>).
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Năm học áp dụng <span className="text-red-500 font-bold ml-0.5">*</span></label>
            <select 
              value={autoNamHoc} 
              onChange={(e) => setAutoNamHoc(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {namHocList.map((n) => (
                <option key={n} value={n}>
                  Năm học {n}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex items-center justify-end gap-2">
            <button type="button" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setAutoOpen(false)}>Hủy</button>
            <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" onClick={handleAutoAssign}>
              Chạy tự động
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Delete Single Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, item: null })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-blue-900 text-center mb-2">Xóa phân công</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa phân công của <strong>{deleteModal.item?.gv}</strong> dạy môn <strong>{deleteModal.item?.mon}</strong> lớp <strong>{deleteModal.item?.lop}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                type="button" 
                className="flex-1 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" 
                onClick={() => setDeleteModal({ open: false, item: null })}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="flex-1 py-2.5 bg-red-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-red-700 transition-colors" 
                onClick={handleDeleteConfirm}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteAllModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-blue-900 text-center mb-2">Xóa tất cả phân công</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa <strong>tất cả {filteredAssignments.length} phân công</strong>
              {filter.namHoc ? ` năm ${filter.namHoc}` : ""}
              {filter.hocKy > 0 ? ` học kỳ ${filter.hocKy}` : ""}? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                type="button" 
                className="flex-1 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors" 
                onClick={() => setDeleteAllModal(false)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="flex-1 py-2.5 bg-red-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-red-700 transition-colors" 
                onClick={handleDeleteAll}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
