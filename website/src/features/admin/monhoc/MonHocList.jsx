import { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw, Plus, X, Edit, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import Pagination from "../../../components/common/Pagination.jsx";
import {
  createMonHoc,
  deleteMonHoc,
  getMonHoc,
  updateMonHoc
} from "../../../api/monhocApi.js";
import { normalizeStrict } from "../../../utils/normalizeText.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";

const REMARK_ONLY_SUBJECTS = [
  { tenMon: "Giáo dục thể chất (GDTC)", heSo: 0 },
  { tenMon: "Âm nhạc", heSo: 0 },
  { tenMon: "Nội dung giáo dục địa phương (GDĐP)", heSo: 0 },
  { tenMon: "Hoạt động trải nghiệm, hướng nghiệp (HĐTN, HN)", heSo: 0 }
];

const SCORE_AND_REMARK_SUBJECTS = [
  { tenMon: "Toán", heSo: 2 },
  { tenMon: "Ngữ văn", heSo: 2 },
  { tenMon: "Tiếng Anh", heSo: 1 },
  { tenMon: "Vật lí", heSo: 1 },
  { tenMon: "Hóa học", heSo: 1 },
  { tenMon: "Sinh học", heSo: 1 },
  { tenMon: "Lịch sử", heSo: 1 },
  { tenMon: "Địa lí", heSo: 1 },
  { tenMon: "Giáo dục kinh tế và pháp luật (GDKT&PL)", heSo: 1 },
  { tenMon: "Tin học", heSo: 1 },
  { tenMon: "Công nghệ", heSo: 1 },
  { tenMon: "GDQP-AN", heSo: 1 }
];

const STANDARD_SUBJECTS = [...REMARK_ONLY_SUBJECTS, ...SCORE_AND_REMARK_SUBJECTS];
const REMARK_ONLY_KEYWORDS = new Set(REMARK_ONLY_SUBJECTS.map((item) => normalizeStrict(item.tenMon)));

const getEvaluationLabel = (subject) => {
  const key = normalizeStrict(subject?.tenMon);
  if (REMARK_ONLY_KEYWORDS.has(key) || Number(subject?.heSo) === 0 || subject?.nhomDanhGia === "NHAN_XET") {
    return "Nhận xét (Đạt/Chưa đạt)";
  }
  return "Nhận xét + điểm số";
};

const getEvaluationColor = (label) => {
  if (label === "Nhận xét + điểm số") {
    return "bg-blue-50 text-blue-700 ring-blue-600/20";
  }
  return "bg-orange-50 text-orange-700 ring-orange-600/20";
};

// --- AdvancedPagination removed ---
export default function MonHocList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const [filterEvaluation, setFilterEvaluation] = useState("");
  
  const { searchQuery, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const keyword = searchQuery;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [form, setForm] = useState({
    tenMon: "",
    nhomDanhGia: "DIEM_SO",
    soDtxHocKy: 3,
    khoiApDung: ["10", "11", "12"],
    moTa: ""
  });

  const { confirm } = useConfirm();

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMonHoc();
      const data = response?.data?.data || [];
      const sorted = [...data].sort((a, b) => {
        return String(a?.tenMon || "").localeCompare(String(b?.tenMon || ""), "vi", {
          sensitivity: "base"
        });
      });
      setSubjects(sorted);
    } catch (err) {
      setError("Không thể tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm môn học...");
    setIsSearchVisible(true);
    fetchSubjects();
    return () => setIsSearchVisible(false);
  }, [setSearchPlaceholder, setIsSearchVisible]);

  const filteredSubjects = useMemo(() => {
    let result = [...subjects];
    if (filterEvaluation) {
      result = result.filter(s => getEvaluationLabel(s) === filterEvaluation);
    }
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter(s => s.tenMon?.toLowerCase().includes(lower));
    }
    return result;
  }, [subjects, filterEvaluation, keyword]);

  const pagedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, page, pageSize]);

  const totalPages = Math.ceil(filteredSubjects.length / pageSize) || 1;

  useEffect(() => {
    setPage(1);
  }, [keyword, filterEvaluation]);

  const handleRefresh = () => {
    fetchSubjects();
  };

  const openCreate = () => {
    setEditingSubject(null);
    setForm({
      tenMon: "",
      nhomDanhGia: "DIEM_SO",
      soDtxHocKy: 3,
      khoiApDung: ["10", "11", "12"],
      moTa: ""
    });
    setModalOpen(true);
  };

  const openEdit = (subject) => {
    setEditingSubject(subject);
    setForm({
      tenMon: subject.tenMon || "",
      nhomDanhGia: subject.nhomDanhGia || "DIEM_SO",
      soDtxHocKy: subject.soDtxHocKy ?? 3,
      khoiApDung: subject.khoiApDung ? subject.khoiApDung.split(",") : ["10", "11", "12"],
      moTa: subject.moTa || ""
    });
    setModalOpen(true);
  };

  const handleDelete = async (subject) => {
    if (!(await confirm(`Xác nhận xóa môn học ${subject.tenMon}? Dữ liệu không thể khôi phục.`))) return;
    try {
      await deleteMonHoc(subject.id);
      notifySuccess("Xóa môn học thành công");
      fetchSubjects();
    } catch(e) {
      notifyError("Lỗi khi xóa môn học");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const tenMon = form.tenMon.trim();
    if (!tenMon) { notifyError("Vui lòng nhập tên môn."); return; }

    const validNamePattern = /^[A-ZÀ-Ỹa-zà-ỹ0-9\s&().,]+$/;
    if (!validNamePattern.test(tenMon)) {
      notifyError("Tên môn chỉ được chứa chữ cái, số và ký tự &().,");
      return;
    }

    const words = tenMon.split(/\s+/).filter(Boolean);
    if (words.length < 1) {
      notifyError("Vui lòng nhập tên môn.");
      return;
    }

    const vietnameseDiacritics = /[àáảãạăắằẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    if (!vietnameseDiacritics.test(tenMon)) {
      notifyError("Tên môn phải có dấu tiếng Việt (vd: Toán, Ngữ văn, Địa lí).");
      return;
    }

    if (words.length === 1) {
      if (words[0].length < 4) { notifyError("Tên môn phải có ít nhất 4 chữ cái (vd: Toán, Sinh)."); return; }
      if (!/^[A-ZÀ-Ỹ]/.test(words[0])) { notifyError("Tên môn phải bắt đầu bằng chữ hoa (vd: Toán)."); return; }
    } else {
      for (const w of words) {
        if (w.length < 2) { notifyError("Mỗi từ phải có ít nhất 2 chữ cái."); return; }
        if (!/^[A-ZÀ-Ỹ]/.test(w)) { notifyError("Mỗi từ phải bắt đầu bằng chữ hoa (vd: Ngữ văn, Tiếng Anh)."); return; }
      }
    }

    const normalizedName = normalizeStrict(tenMon);
    const isDuplicate = subjects.some(
      (s) => normalizeStrict(s.tenMon) === normalizedName && s.id !== editingSubject?.id
    );
    if (isDuplicate) { notifyError(`Môn học "${tenMon}" đã tồn tại.`); return; }

    if (!form.nhomDanhGia) { notifyError("Vui lòng chọn nhóm đánh giá."); return; }

    const soDtx = Number(form.soDtxHocKy);
    if (form.nhomDanhGia === "DIEM_SO" && (isNaN(soDtx) || soDtx < 1 || soDtx > 10)) {
      notifyError("Số ĐTX phải từ 1 đến 10."); return;
    }

    if (!form.khoiApDung.length) { notifyError("Vui lòng chọn ít nhất 1 khối áp dụng."); return; }

    const payload = {
      tenMon: tenMon,
      nhomDanhGia: form.nhomDanhGia,
      soDtxHocKy: form.nhomDanhGia === "NHAN_XET" ? 0 : soDtx,
      khoiApDung: form.khoiApDung.join(","),
      moTa: form.moTa.trim() || null
    };

    try {
      if (editingSubject) {
        await updateMonHoc(editingSubject.id, payload);
        notifySuccess("Cập nhật môn học thành công.");
      } else {
        await createMonHoc(payload);
        notifySuccess("Thêm môn học thành công.");
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err) {
      notifyError("Không thể lưu môn học. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-900 flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh mục môn học</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Quản trị viên theo dõi và cập nhật thông tin môn học.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterEvaluation} 
            onChange={e => { setFilterEvaluation(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Tất cả hình thức</option>
            <option value="Nhận xét + điểm số">Nhận xét + điểm số</option>
            <option value="Nhận xét (Đạt/Chưa đạt)">Nhận xét (Đạt/Chưa đạt)</option>
          </select>
          
          <button onClick={handleRefresh} className="inline-flex items-center justify-center w-[42px] h-[42px] bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 shadow-sm transition-colors duration-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors duration-200">
            <Plus className="w-4 h-4" /> Thêm môn học
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[700px] shrink-0 overflow-hidden">
        {error && <div className="p-4 m-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold shrink-0">{error}</div>}

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 backdrop-blur z-10">
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">STT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px]">Tên môn</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hình thức đánh giá</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : pagedSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                       <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Không tìm thấy môn học</h3>
                    <p className="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                  </td>
                </tr>
              ) : (
                pagedSubjects.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{item.tenMon}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${getEvaluationColor(getEvaluationLabel(item))}`}>
                        {getEvaluationLabel(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa môn học">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0">
           <Pagination
             currentPage={page} 
             totalPages={totalPages} 
             totalItems={filteredSubjects.length}
             pageSize={pageSize}
             onPageChange={setPage}
             onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
             pageSizeOptions={[10, 15, 20, 50]}
           />
        </div>
      </div>

      <SimpleModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSubject ? "Cập nhật môn học" : "Thêm môn học"} width={450}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tên môn <span className="text-red-500">*</span></label>
            <input type="text" value={form.tenMon} onChange={e => setForm({...form, tenMon: e.target.value})} placeholder="vd: Toán, Ngữ văn..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nhóm đánh giá <span className="text-red-500">*</span></label>
            <select value={form.nhomDanhGia} onChange={e => {
              const val = e.target.value;
              setForm({...form, nhomDanhGia: val, soDtxHocKy: val === "NHAN_XET" ? 0 : 3});
            }} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="DIEM_SO">Nhận xét + Điểm số</option>
              <option value="NHAN_XET">Nhận xét (Đạt/Chưa đạt)</option>
            </select>
          </div>
          {form.nhomDanhGia === "DIEM_SO" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Số ĐTX mỗi học kỳ <span className="text-red-500">*</span></label>
              <input type="number" min="1" max="10" value={form.soDtxHocKy} onChange={e => setForm({...form, soDtxHocKy: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Khối áp dụng <span className="text-red-500">*</span></label>
            <div className="flex gap-4">
              {["10", "11", "12"].map(khoi => (
                <label key={khoi} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex-1 justify-center">
                  <input type="checkbox" checked={form.khoiApDung.includes(khoi)} onChange={e => {
                    setForm(prev => ({
                      ...prev,
                      khoiApDung: e.target.checked ? [...prev.khoiApDung, khoi] : prev.khoiApDung.filter(k => k !== khoi)
                    }));
                  }} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">Khối {khoi}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
            <input type="text" value={form.moTa} onChange={e => setForm({...form, moTa: e.target.value})} placeholder="Mô tả môn học (tùy chọn)" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Lưu lại</button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
