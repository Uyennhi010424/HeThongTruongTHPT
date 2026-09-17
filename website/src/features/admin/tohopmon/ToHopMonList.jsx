import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, X, MoreVertical, Edit, Trash2, Shield, RefreshCw, Users } from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  getToHopMon,
  createToHopMon,
  updateToHopMon,
  deleteToHopMon
} from "../../../api/toHopMonApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { normalizeText } from "../../../utils/normalizeText.js";

const BAN_OPTIONS = ["Tự nhiên", "Xã hội", "Kết hợp"];

const DEFAULT_COMBINATIONS = [
  // Nhóm Tự nhiên (định hướng khối A, B)
  { maToHop: "TN1", tenToHop: "Tự nhiên 1", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Sinh học", "Tin học"] },
  { maToHop: "TN2", tenToHop: "Tự nhiên 2", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Sinh học", "Công nghệ - Định hướng công nghiệp"] },
  { maToHop: "TN3", tenToHop: "Tự nhiên 3", ban: "Tự nhiên", monHoc: ["Vật lí", "Hóa học", "Tin học", "Công nghệ - Định hướng công nghiệp"] },
  { maToHop: "TN4", tenToHop: "Tự nhiên 4", ban: "Tự nhiên", monHoc: ["Vật lí", "Sinh học", "Tin học", "Địa lí"] },
  // Nhóm Xã hội (định hướng khối C, D)
  { maToHop: "XH1", tenToHop: "Xã hội 1", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Âm nhạc", "Tin học"] },
  { maToHop: "XH2", tenToHop: "Xã hội 2", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Âm nhạc", "Mỹ thuật"] },
  { maToHop: "XH3", tenToHop: "Xã hội 3", ban: "Xã hội", monHoc: ["Địa lí", "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ - Định hướng công nghiệp"] },
  // Nhóm Kết hợp (định hướng khối D, thi năng khiếu)
  { maToHop: "KH1", tenToHop: "Kết hợp 1", ban: "Kết hợp", monHoc: ["Vật lí", "Hóa học", "Địa lí", "Giáo dục kinh tế và pháp luật"] },
  { maToHop: "KH2", tenToHop: "Kết hợp 2", ban: "Kết hợp", monHoc: ["Vật lí", "Tin học", "Địa lí", "Giáo dục kinh tế và pháp luật"] }
];

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

// --- Dropdown Menu Component ---
const ActionDropdown = ({ item, onAction }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (action) => {
    setOpen(false);
    onAction(action, item);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1 font-sans">
          <button onClick={() => handleSelect("DETAILS")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" /> Chi tiết
          </button>
          <button onClick={() => handleSelect("EDIT")} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <Edit className="w-4 h-4 text-slate-400" /> Chỉnh sửa
          </button>
          <div className="h-px bg-slate-100 my-1 mx-2"></div>
          <button onClick={() => handleSelect("DELETE")} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" /> Xóa
          </button>
        </div>
      )}
    </div>
  );
};

// --- Modal Chi tiết (Centered) ---
const SubjectDetailDrawer = ({ item, onClose }) => {
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
            <h2 className="text-lg font-bold text-blue-900">Chi tiết tổ hợp môn</h2>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Thông tin chung */}
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Mã tổ hợp</span>
                <span className="text-sm font-semibold text-slate-900">{item.maToHop}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Tên tổ hợp</span>
                <span className="text-sm font-semibold text-slate-900">{item.tenToHop}</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Loại tổ hợp</span>
                <span className="text-sm font-medium text-slate-900">{item.ban}</span>
              </div>
              {item.moTa && (
                <div className="flex items-start">
                  <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Mô tả</span>
                  <span className="text-sm text-slate-700">{item.moTa}</span>
                </div>
              )}
            </div>

            <hr className="my-5 border-slate-200" />

            {/* Danh sách môn học */}
            <div>
              <div className="text-sm font-bold text-slate-700 mb-3">Danh sách môn tự chọn</div>
              <div className="flex flex-wrap gap-2">
                 {(item.tenMonHocs || []).map((ten, index) => (
                   <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-[13px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                     {ten} {item.soTiets?.[index] ? `(${item.soTiets[index]}t)` : ""}
                   </span>
                 ))}
                 {!(item.tenMonHocs || []).length && (
                   <span className="text-sm text-slate-400 italic">Chưa có môn học</span>
                 )}
              </div>
            </div>
            
            <hr className="my-5 border-slate-200" />

            {/* Sử dụng */}
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Số lớp sử dụng</span>
                <span className="text-sm font-semibold text-slate-900">{item.soLopSuDung || 0} lớp</span>
              </div>
              <div className="flex items-start">
                <span className="w-32 text-sm font-medium text-slate-500 shrink-0">Danh sách lớp</span>
                <span className="text-sm font-medium text-slate-900">
                  {item.danhSachLop && item.danhSachLop.length > 0 
                    ? item.danhSachLop.join(", ") 
                    : <span className="text-slate-400 italic">Chưa có lớp</span>}
                </span>
              </div>
            </div>
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

const sortToHop = (a, b) => {
  return String(a?.maToHop || a?.tenToHop || "").localeCompare(
    String(b?.maToHop || b?.tenToHop || ""),
    "vi",
    { numeric: true, sensitivity: "base" }
  );
};

export default function ToHopMonList() {
  const [toHopList, setToHopList] = useState([]);
  const [allMonHoc, setAllMonHoc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  
  const [form, setForm] = useState({
    maToHop: "",
    tenToHop: "",
    ban: "Tự nhiên",
    moTa: "",
    monHocIds: [],
    soTiets: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [toHopRes, monHocRes] = await Promise.all([
        getToHopMon(),
        getMonHoc()
      ]);
      const rawData = toHopRes?.data?.data || [];
      setToHopList([...rawData].sort(sortToHop));
      setAllMonHoc(monHocRes?.data?.data || []);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm tổ hợp môn...");
    setIsSearchVisible(true);
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await fetchData();
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredList = useMemo(() => {
    if (!keyword.trim()) return toHopList;
    const lower = keyword.toLowerCase();
    return toHopList.filter((item) =>
      [item.maToHop, item.tenToHop, item.ban, ...(item.tenMonHocs || [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lower))
    );
  }, [keyword, toHopList]);

  const groupedByBan = useMemo(() => {
    const map = new Map();
    filteredList.forEach((item) => {
      const ban = item.ban || "Khác";
      if (!map.has(ban)) map.set(ban, []);
      map.get(ban).push(item);
    });
    map.forEach((items) => {
      items.sort(sortToHop);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredList]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({ maToHop: "", tenToHop: "", ban: "Tự nhiên", moTa: "", monHocIds: [], soTiets: [] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      maToHop: item.maToHop || "",
      tenToHop: item.tenToHop || "",
      ban: item.ban || "Tự nhiên",
      moTa: item.moTa || "",
      monHocIds: item.monHocIds || [],
      soTiets: item.soTiets || []
    });
    setModalOpen(true);
  };

  const { confirm } = useConfirm();

  const handleAction = async (action, item) => {
    if (action === "DETAILS") {
      setDrawerItem(item);
      setDrawerOpen(true);
    } else if (action === "EDIT") {
      openEdit(item);
    } else if (action === "DELETE") {
      if (!(await confirm(`Xóa tổ hợp ${item.maToHop} - ${item.tenToHop}? Dữ liệu không thể khôi phục.`))) return;
      try {
        await deleteToHopMon(item.id);
        setToHopList((prev) => prev.filter((row) => row.id !== item.id));
        notifySuccess("Xóa tổ hợp môn thành công.");
      } catch (err) {
        notifyError(getApiErrorMessage(err, "Không thể xóa tổ hợp môn."));
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const trimmedMa = form.maToHop.trim().toUpperCase();
    const trimmedTen = form.tenToHop.trim();

    if (!trimmedMa) {
      notifyError("Vui lòng nhập mã tổ hợp.");
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(trimmedMa)) {
      notifyError("Mã tổ hợp không hợp lệ (VD: TN1, XH01).");
      return;
    }
    if (!trimmedTen) {
      notifyError("Vui lòng nhập tên tổ hợp.");
      return;
    }
    if (!/^[A-ZÀ-Ỹa-zà-ỹ0-9\s(),\.-]+$/.test(trimmedTen)) {
      notifyError("Tên tổ hợp chứa ký tự không hợp lệ.");
      return;
    }
    if (!form.ban) {
      notifyError("Vui lòng chọn ban.");
      return;
    }
    if (form.monHocIds.length !== 4) {
      notifyError("Tổ hợp môn phải có đúng 4 môn tự chọn.");
      return;
    }

    // Kiểm tra trùng mã tổ hợp (khi tạo mới)
    if (!editingItem && toHopList.some((t) => t.maToHop?.trim().toUpperCase() === trimmedMa)) {
      notifyError("Mã tổ hợp đã tồn tại.");
      return;
    }

    // Kiểm tra trùng tên tổ hợp
    const duplicateName = toHopList.find(
      (t) => (!editingItem || t.id !== editingItem.id) && t.tenToHop?.trim().toLowerCase() === trimmedTen.toLowerCase()
    );
    if (duplicateName) {
      notifyError(`Tên tổ hợp '${trimmedTen}' đã tồn tại.`);
      return;
    }

    // Kiểm tra trùng 4 môn tự chọn
    const formMonSet = new Set(form.monHocIds);
    const duplicateSubjects = toHopList.find((t) => {
      if (editingItem && t.id === editingItem.id) return false;
      const tMonIds = t.monHocIds || [];
      if (tMonIds.length !== formMonSet.size) return false;
      return tMonIds.every((id) => formMonSet.has(id));
    });
    if (duplicateSubjects) {
      notifyError(`Tổ hợp 4 môn này đã tồn tại (trùng với ${duplicateSubjects.maToHop} - ${duplicateSubjects.tenToHop}).`);
      return;
    }

    const finalSoTiets = form.monHocIds.map((_, index) => form.soTiets?.[index] ?? 2);

    const payload = {
      maToHop: trimmedMa,
      tenToHop: trimmedTen,
      ban: form.ban,
      moTa: form.moTa.trim(),
      monHocIds: form.monHocIds,
      soTiets: finalSoTiets
    };

    try {
      if (editingItem) {
        const response = await updateToHopMon(editingItem.id, payload);
        const updated = response?.data?.data;
        setToHopList((prev) =>
          prev.map((row) => (row.id === editingItem.id ? updated : row)).sort(sortToHop)
        );
        notifySuccess("Cập nhật tổ hợp môn thành công.");
      } else {
        const response = await createToHopMon(payload);
        const created = response?.data?.data;
        setToHopList((prev) => [...prev, created].sort(sortToHop));
        notifySuccess("Thêm tổ hợp môn thành công.");
      }
      setModalOpen(false);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể lưu tổ hợp môn."));
    }
  };

  const handleMonHocToggle = (monHocId) => {
    setForm((prev) => {
      const ids = prev.monHocIds.includes(monHocId)
        ? prev.monHocIds.filter((id) => id !== monHocId)
        : [...prev.monHocIds, monHocId];
      return { ...prev, monHocIds: ids };
    });
  };

  const handleSeedDefaults = async () => {
    try {
      const existingMaSet = new Set(toHopList.map((item) => item.maToHop?.toUpperCase()));
      const existingTenSet = new Set(toHopList.map((item) => item.tenToHop?.trim().toLowerCase()));
      const existingSubjectSets = toHopList.map((item) => new Set(item.monHocIds || []));

      const monHocMap = new Map();
      allMonHoc.forEach((m) => {
        monHocMap.set(m.tenMon?.trim().toLowerCase(), m.id);
      });

      let createdCount = 0;
      for (const combo of DEFAULT_COMBINATIONS) {
        if (existingMaSet.has(combo.maToHop.toUpperCase())) continue;
        if (existingTenSet.has(combo.tenToHop.trim().toLowerCase())) continue;

        const monHocIds = combo.monHoc
          .map((ten) => monHocMap.get(ten.trim().toLowerCase()))
          .filter(Boolean);

        if (monHocIds.length !== 4) {
          continue;
        }

        const comboSet = new Set(monHocIds);
        const isDuplicateSubjects = existingSubjectSets.some(
          (set) => set.size === comboSet.size && [...set].every((id) => comboSet.has(id))
        );
        if (isDuplicateSubjects) continue;

        await createToHopMon({
          maToHop: combo.maToHop,
          tenToHop: combo.tenToHop,
          ban: combo.ban,
          monHocIds
        });
        createdCount++;
        existingMaSet.add(combo.maToHop.toUpperCase());
        existingTenSet.add(combo.tenToHop.trim().toLowerCase());
        existingSubjectSets.push(comboSet);
      }

      await fetchData();
      if (createdCount > 0) {
        notifySuccess(`Đã tạo ${createdCount} tổ hợp môn theo quy định.`);
      } else {
        notifySuccess("Danh mục tổ hợp đã đủ hoặc không có tổ hợp mới cần tạo.");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Không thể tạo tổ hợp môn."));
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Nhóm môn học theo loại (bắt buộc vs tự chọn) để hiển thị trong form
  const monHocByType = useMemo(() => {
    const batBuocKeywords = [
      "toan",
      "ngu van",
      "tieng anh",
      "ngoai ngu",
      "lich su",
      "giao duc the chat",
      "the duc",
      "gdtc",
      "giao duc quoc phong",
      "quoc phong",
      "an ninh",
      "gdqp",
      "hoat dong trai nghiem",
      "trai nghiem",
      "huong nghiep",
      "hdtn",
      "giao duc dia phuong",
      "dia phuong",
      "gddp"
    ];
    const excludedKeywords = ["shdc", "shl", "sinh hoat lop", "chao co", "sinh hoat duoi co"];

    const batBuocList = [];
    const tuChonList = [];

    allMonHoc.forEach((m) => {
      const tenMon = String(m.tenMon || "").trim();
      const maMon = String(m.maMon || "").trim().toUpperCase();
      const norm = normalizeText(tenMon);
      const lowerMa = maMon.toLowerCase();

      // Ẩn các môn/tiết SHDC, Sinh hoạt lớp, Chào cờ
      if (
        excludedKeywords.some((ex) => norm.includes(ex) || lowerMa.includes(ex))
      ) {
        return;
      }

      if (
        batBuocKeywords.some((bb) => norm.includes(bb) || lowerMa.includes(bb))
      ) {
        batBuocList.push(m);
      } else {
        tuChonList.push(m);
      }
    });
    return { batBuocList, tuChonList };
  }, [allMonHoc]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900 flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">Tổ hợp môn tự chọn</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Quản lý cấu hình các tổ hợp môn sử dụng trong nhà trường.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
          <button onClick={handleSeedDefaults} className="inline-flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors shadow-sm gap-2 whitespace-nowrap">
             Tạo tổ hợp mẫu
          </button>
          
          <button onClick={handleRefresh} className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200 shrink-0" title="Làm mới">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200 whitespace-nowrap shrink-0">
            <Plus className="w-4 h-4" /> Thêm tổ hợp
          </button>
        </div>
      </div>

      {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold shrink-0">{error}</div>}

      {/* Main Content */}
      <div className="flex-1 overflow-auto rounded-2xl">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-sm font-bold text-blue-900">Không tìm thấy tổ hợp</h3>
            <p className="text-sm text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByBan.map(([ban, items]) => (
              <div key={ban}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider px-1">{ban}</h2>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col group relative">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[11px] rounded border border-blue-100">{item.maToHop}</span>
                        <h3 className="text-sm font-bold text-blue-900 truncate flex-1">{item.tenToHop}</h3>
                        <ActionDropdown item={item} onAction={handleAction} />
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                           {(item.tenMonHocs || []).map((ten, index) => (
                             <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60">
                               {ten} {item.soTiets?.[index] ? `(${item.soTiets[index]}t)` : ""}
                             </span>
                           ))}
                           {!(item.tenMonHocs || []).length && (
                             <span className="text-xs text-slate-400 italic">Chưa có môn học</span>
                           )}
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-semibold">{item.soLopSuDung || 0} lớp sử dụng</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Cập nhật tổ hợp môn" : "Thêm tổ hợp môn"} width={620}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mã tổ hợp <span className="text-red-500">*</span></label>
              <input type="text" value={form.maToHop} onChange={e => setForm({...form, maToHop: e.target.value.toUpperCase()})} placeholder="vd: A1" maxLength={10} disabled={!!editingItem} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tên tổ hợp <span className="text-red-500">*</span></label>
              <input type="text" value={form.tenToHop} onChange={e => setForm({...form, tenToHop: e.target.value})} placeholder="vd: KHTN 1" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ban <span className="text-red-500">*</span></label>
              <select value={form.ban} onChange={e => setForm({...form, ban: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {BAN_OPTIONS.map((ban) => <option key={ban} value={ban}>{ban}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Môn tự chọn (chọn đúng 4 môn) <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {monHocByType.tuChonList.map((mon) => {
                const selected = form.monHocIds.includes(mon.id);
                return (
                  <button
                    key={mon.id}
                    type="button"
                    onClick={() => handleMonHocToggle(mon.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${selected ? 'bg-blue-100 text-blue-700 border border-blue-200 font-bold' : 'bg-white text-slate-600 border border-slate-200 font-semibold hover:bg-slate-50'}`}
                  >
                    {mon.tenMon}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">
              Đã chọn: <span className={form.monHocIds.length === 4 ? "text-blue-600" : "text-red-500"}>{form.monHocIds.length}/4</span> môn
            </div>
          </div>

          {form.monHocIds.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">Số tiết học mỗi tuần</label>
              <div className="space-y-2">
                {form.monHocIds.map((id, index) => {
                  const mon = allMonHoc.find((m) => m.id === id);
                  if (!mon) return null;
                  const currentPeriod = form.soTiets?.[index] ?? 2;
                  return (
                    <div key={id} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
                      <span className="text-sm font-semibold text-slate-700">{mon.tenMon}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Tiết/tuần:</span>
                        <input
                          type="number" min={1} max={5}
                          value={currentPeriod}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 2;
                            setForm((prev) => {
                              const newSoTiets = [...(prev.soTiets || [])];
                              while (newSoTiets.length < prev.monHocIds.length) newSoTiets.push(2);
                              newSoTiets[index] = val;
                              return { ...prev, soTiets: newSoTiets };
                            });
                          }}
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả (Ghi chú)</label>
            <input type="text" value={form.moTa} onChange={e => setForm({...form, moTa: e.target.value})} placeholder="Tùy chọn" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Lưu lại</button>
          </div>
        </form>
      </SimpleModal>

      {drawerOpen && drawerItem && (
        <SubjectDetailDrawer 
          item={drawerItem} 
          onClose={() => setDrawerOpen(false)} 
        />
      )}
    </div>
  );
}
