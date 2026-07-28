import React, { useEffect, useMemo, useState } from "react";
import { MoreVertical, Eye, Edit2, Trash2, X, RefreshCw, Plus, Settings2 } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getMonHoc, createMonHoc } from "../../../api/monhocApi.js";
import { getLop } from "../../../api/lopApi.js";
import { autoAssignAll, createPhanCongDay, deletePhanCongDay, deletePhanCongDayById, getPhanCongDay } from "../../../api/phancongDayApi.js";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { normalizeText } from "../../../utils/normalizeText.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import Pagination from "../../../components/common/Pagination.jsx";

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
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={() => { setIsOpen(false); onView(item); }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Xem chi tiết
          </button>
          <button
            onClick={() => { setIsOpen(false); onEdit(item); }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" /> Chỉnh sửa
          </button>
          <div className="h-px bg-slate-100 my-1"></div>
          <button
            onClick={() => { setIsOpen(false); onDelete(item); }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa phân công
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
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" /> Thêm phân công
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          <button
            onClick={() => { setIsOpen(false); onManual(); }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm thủ công
          </button>
          <button
            onClick={() => { setIsOpen(false); onAuto(); }}
            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
          >
            <Settings2 className="w-4 h-4" /> Tự động phân công
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
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("Học kỳ 1");
  const [saving, setSaving] = useState(false);

  // Auto assign state
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoNamHoc, setAutoNamHoc] = useState("");
  const [autoHocKy, setAutoHocKy] = useState(1);

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

  const namHocList = useMemo(() => {
    const set = new Set(assignments.map((a) => a.namHoc).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [assignments]);
  
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
      const [gv, mh, lop, phanCong] = await Promise.all([getGiaoVien(), getMonHoc(), getLop(), getPhanCongDay()]);
      setTeachers((gv?.data?.data || []).sort((a, b) => String(a?.hoTen || "").localeCompare(String(b?.hoTen || ""), "vi", { sensitivity: "base", numeric: true })));
      setSubjects(mh?.data?.data || []);
      setClasses(lop?.data?.data || []);
      const defaultNam = lop?.data?.data?.[0]?.namHoc || "";
      setAutoNamHoc(defaultNam);
      if (!filter.namHoc) {
        setFilter(p => ({ ...p, namHoc: defaultNam }));
      }

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
    const namHocVal = lopObj?.namHoc || "";
    const hkInt = selectedHocKy === "Học kỳ 2" ? 2 : 1;

    try {
      setSaving(true);
      const res = await createPhanCongDay({
        giaoVienId: Number(selectedTeacherId), monHocId: mon.id,
        lopId: Number(selectedClassId), hocKy: hkInt, namHoc: namHocVal
      });
      const saved = res?.data?.data;
      if (!saved) throw new Error("Lỗi server");

      setAssignments((prev) => [{
        id: saved.id, gv: saved.giaoVienHoTen || teacher.hoTen,
        ma: saved.maGiaoVien || "", mon: saved.monHocTen || selectedSubject,
        lop: saved.tenLop || lopObj?.tenLop || "",
        hk: formatHocKy(saved.hocKy), hocKy: saved.hocKy,
        namHoc: saved.namHoc || namHocVal,
        khoi: (lopObj?.tenLop || "").substring(0, 2)
      }, ...prev].sort(sortByAssignment));

      notifySuccess("Đã thêm phân công thành công.");
      setFormOpen(false);
      setSelectedSubject("");
      setSelectedClassId("");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!autoNamHoc) { notifyError("Nhập năm học."); return; }
    try {
      const res = await autoAssignAll(autoNamHoc, Number(autoHocKy));
      const createdCount = (res?.data?.data || []).length;
      notifySuccess(`Tạo ${createdCount} phân công thành công.`);
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
    // Basic edit setup - will just open add form with preset for now
    setSelectedTeacherId(teachers.find(t => t.maGiaoVien === item.ma)?.id || "");
    setSelectedSubject(item.mon !== "--" ? item.mon : "");
    setSelectedClassId(classes.find(c => c.tenLop === item.lop)?.id || "");
    setSelectedHocKy(item.hk);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <PageHeader title="Phân công giảng dạy" />

      <div className="p-6 space-y-6 flex-1">
        {/* Filter Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Năm học</label>
              <select
                value={filter.namHoc}
                onChange={(e) => { setFilter(p => ({ ...p, namHoc: e.target.value })); setPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {namHocList.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Học kỳ</label>
              <select
                value={filter.hocKy}
                onChange={(e) => { setFilter(p => ({ ...p, hocKy: Number(e.target.value) })); setPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value={0}>Tất cả</option>
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Khối</label>
              <select
                value={filter.khoi}
                onChange={(e) => { setFilter(p => ({ ...p, khoi: e.target.value, lop: "" })); setPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {khoiList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Lớp</label>
              <select
                value={filter.lop}
                onChange={(e) => { setFilter(p => ({ ...p, lop: e.target.value })); setPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {classes
                  .filter(c => !filter.khoi || String(c.tenLop).startsWith(filter.khoi.replace("Khối ", "")))
                  .sort((a,b) => String(a.tenLop).localeCompare(String(b.tenLop), "vi", {numeric: true}))
                  .map((l) => <option key={l.id} value={l.tenLop}>{l.tenLop}</option>)
                }
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Môn học</label>
              <select
                value={filter.monThi}
                onChange={(e) => { setFilter(p => ({ ...p, monThi: e.target.value })); setPage(1); }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Tất cả</option>
                {subjects.map((m) => <option key={m.id} value={m.tenMon}>{m.tenMon}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchData();
                setFilter(p => ({ ...p, khoi: "", lop: "", monThi: "", hocKy: 0 }));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
            <AddDropdown onManual={() => setFormOpen(true)} onAuto={() => setAutoOpen(true)} />
          </div>
        </div>

        {/* Table Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-4 py-3 text-center w-16">STT</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Mã GV</th>
                  <th className="px-4 py-3 text-center">Môn học</th>
                  <th className="px-4 py-3 text-center">Lớp</th>
                  <th className="px-4 py-3 text-center">Học kỳ</th>
                  <th className="px-4 py-3 text-center">Năm học</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-4 py-3 text-center"><div className="h-4 bg-slate-100 rounded animate-pulse w-8 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-32" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-20" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-16 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-24 mx-auto" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : pagedAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy phân công giảng dạy nào.
                    </td>
                  </tr>
                ) : (
                  pagedAssignments.map((row, idx) => {
                    const isAssigned = row.gv && row.gv !== "--";
                    return (
                      <tr key={`${row.id}-${row.lop}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-2.5 text-center text-slate-500 font-medium">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {row.gv}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                          {row.ma}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {row.mon}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {row.lop}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-600">
                          {row.hk}
                        </td>
                        <td className="px-4 py-2.5 text-center text-slate-600">
                          {row.namHoc || "--"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            isAssigned 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {isAssigned ? "Đã phân công" : "Chưa phân công"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
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
              <h2 className="text-lg font-bold text-slate-800">Chi tiết phân công</h2>
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
      <SimpleModal open={formOpen} title="Thêm phân công" onClose={() => setFormOpen(false)}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAssign(); }}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Giáo viên *</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => { setSelectedTeacherId(e.target.value); setSelectedSubject(""); setSelectedClassId(""); }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.hoTen} - {t.maGiaoVien}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Môn học *</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="text-sm font-medium text-slate-700">Lớp *</label>
            <select 
              value={selectedClassId} 
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn lớp --</option>
              {classes.slice().sort((a, b) => String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { numeric: true })).map((l) => (
                <option key={l.id} value={l.id}>{l.tenLop}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Học kỳ *</label>
            <select 
              value={selectedHocKy} 
              onChange={(e) => setSelectedHocKy(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ 2">Học kỳ 2</option>
            </select>
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-2">
            <button type="button" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setFormOpen(false)}>Hủy</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" disabled={saving}>
              {saving ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Auto Assign Modal */}
      <SimpleModal open={autoOpen} title="Tự động phân công" onClose={() => setAutoOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Hệ thống sẽ tự động phân công giáo viên dạy các lớp theo bộ môn chuyên môn.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Năm học *</label>
            <input 
              value={autoNamHoc} 
              onChange={(e) => setAutoNamHoc(e.target.value)} 
              placeholder="2025-2026"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Học kỳ *</label>
            <select 
              value={autoHocKy} 
              onChange={(e) => setAutoHocKy(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Học kỳ 1</option>
              <option value={2}>Học kỳ 2</option>
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
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xóa phân công</h3>
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
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Xóa tất cả phân công</h3>
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
