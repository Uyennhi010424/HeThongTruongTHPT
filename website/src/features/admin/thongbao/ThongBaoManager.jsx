import { useEffect, useMemo, useState } from "react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createThongBao,
  deleteThongBao,
  getThongBao,
  updateThongBao
} from "../../../api/thongbaoApi.js";
import Pagination from "../../../components/common/Pagination.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Edit, Trash2, Calendar, Users } from "lucide-react";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getTargetLabel = (value) => {
  switch (value) {
    case "HOC_SINH":
      return "Học sinh";
    case "GIAO_VIEN":
      return "Giáo viên";
    case "PHU_HUYNH":
      return "Phụ huynh";
    case "ALL":
      return "Toàn trường";
    default:
      return "--";
  }
};

const getStatusLabel = (value) => (value === 1 ? "Đang hiển thị" : "Đã ẩn");

export default function ThongBaoManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { searchQuery: keyword, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [viewingNotice, setViewingNotice] = useState(null);
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    tieuDe: "",
    noiDung: "",
    doiTuong: "ALL",
    trangThai: 1
  });

  useEffect(() => {
    let active = true;

    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getThongBao();
        if (!active) return;
        setNotices(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách thông báo.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotices();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm thông báo...");
    setIsSearchVisible(true);
    return () => {
      setSearchPlaceholder("Tìm kiếm...");
      setIsSearchVisible(true);
    };
  }, [setSearchPlaceholder, setIsSearchVisible]);

  const stats = useMemo(() => {
    const total = notices.length;
    const activeCount = notices.filter((item) => item.trangThai === 1).length;
    const archivedCount = total - activeCount;
    return { total, activeCount, archivedCount };
  }, [notices]);

  const filteredNotices = useMemo(() => {
    if (!keyword.trim()) return notices;
    const lower = keyword.toLowerCase();
    return notices.filter((item) =>
      [item.tieuDe, item.noiDung, item.doiTuong || item.loai]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, notices]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredNotices.length / pageSize));
  }, [filteredNotices.length, pageSize]);

  const pagedNotices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotices.slice(start, start + pageSize);
  }, [filteredNotices, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  useEffect(() => {
    if (!location.state?.openCreate) return;

    setEditingNotice(null);
    setForm({
      tieuDe: "",
      noiDung: "",
      doiTuong: "ALL",
      trangThai: 1
    });
    setFormError("");
    setModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const openCreate = () => {
    setEditingNotice(null);
    setForm({
      tieuDe: "",
      noiDung: "",
      doiTuong: "ALL",
      trangThai: 1
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (notice) => {
    setEditingNotice(notice);
    setForm({
      tieuDe: notice.tieuDe || "",
      noiDung: notice.noiDung || "",
      doiTuong: notice.doiTuong || notice.loai || "ALL",
      trangThai: notice.trangThai ?? 1
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (notice) => {
    if (!(await confirm(`Xóa thông báo: ${notice.tieuDe}?`))) return;
    try {
      await deleteThongBao(notice.id);
      setNotices((prev) => prev.filter((item) => item.id !== notice.id));
    } catch (err) {
      setError("Không thể xóa thông báo.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.tieuDe.trim()) {
      setFormError("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!form.noiDung.trim()) {
      setFormError("Vui lòng nhập nội dung.");
      return;
    }

    const payload = {
      tieuDe: form.tieuDe.trim(),
      noiDung: form.noiDung.trim(),
      doiTuong: form.doiTuong,
      trangThai: Number(form.trangThai),
    };

    try {
      if (editingNotice) {
        const response = await updateThongBao(editingNotice.id, payload);
        const updated = response?.data?.data;
        setNotices((prev) =>
          prev.map((item) => (item.id === editingNotice.id ? updated : item))
        );
      } else {
        const response = await createThongBao(payload);
        const created = response?.data?.data;
        setNotices((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu thông báo. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Quản lý thông báo"
        description="Đăng và quản lý thông báo toàn trường hoặc theo đối tượng."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            Thêm thông báo
          </button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="text-base font-bold text-blue-900">Danh sách thông báo</div>
          </div>
          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{filteredNotices.length} thông báo</div>
        </div>
        {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}
        {!error && !loading && filteredNotices.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-medium">Không tìm thấy thông báo phù hợp.</div>
        )}

        {/* ── Desktop Full Table View (>= 1024px) ── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">STT</th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px]">Thông báo</th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Đối tượng</th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Ngày đăng</th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-6 mx-auto animate-pulse" /></td>
                    <td className="px-4 py-4 space-y-1.5">
                      <div className="h-4 bg-slate-100 rounded w-48 animate-pulse" />
                      <div className="h-3 bg-slate-50 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-4 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 animate-pulse" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-28 animate-pulse" /></td>
                    <td className="px-4 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-24 mx-auto animate-pulse" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : (
                pagedNotices.map((notice, index) => (
                  <tr key={notice.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-400">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td
                      className="px-4 py-4 cursor-pointer"
                      onClick={() => setViewingNotice(notice)}
                      title="Nhấp để xem chi tiết thông báo"
                    >
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {notice.tieuDe}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[320px]">
                        {notice.noiDung}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold whitespace-nowrap">
                        {getTargetLabel(notice.doiTuong || notice.loai)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {formatDateTime(notice.ngayDang) || "--"}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        notice.trangThai === 1
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {getStatusLabel(notice.trangThai)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(notice)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notice)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
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

        {/* ── Mobile / Tablet Accordion Card View (< 1024px) ── */}
        <div className="block lg:hidden space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`m-skeleton-${idx}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 rounded w-40" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            ))
          ) : (
            pagedNotices.map((notice, index) => {
              const isExpanded = expandedNoticeId === notice.id;
              return (
                <div
                  key={notice.id}
                  className={`rounded-xl border transition-all duration-200 bg-white overflow-hidden ${
                    isExpanded ? "border-blue-300 shadow-sm" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Collapsed Header */}
                  <div
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">#{(page - 1) * pageSize + index + 1}</span>
                        <span className="text-sm font-bold text-slate-900 truncate">{notice.tieuDe}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                          {getTargetLabel(notice.doiTuong || notice.loai)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
                        <span>{formatDateTime(notice.ngayDang) || "--"}</span>
                        <span>•</span>
                        <span className={notice.trangThai === 1 ? "text-emerald-600 font-semibold" : "text-slate-500"}>
                          {getStatusLabel(notice.trangThai)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(notice)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
                        aria-label="Xem chi tiết"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details ("Show xuống") */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {notice.noiDung || "Không có nội dung chi tiết."}
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500" /> Đối tượng: {getTargetLabel(notice.doiTuong || notice.loai)}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-500" /> Đăng lúc: {formatDateTime(notice.ngayDang)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredNotices.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      {/* Modal Xem chi tiết thông báo */}
      <SimpleModal
        open={Boolean(viewingNotice)}
        title="Chi tiết thông báo"
        width={580}
        onClose={() => setViewingNotice(null)}
      >
        {viewingNotice && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                  Đối tượng: {getTargetLabel(viewingNotice.doiTuong || viewingNotice.loai)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  viewingNotice.trangThai === 1
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {getStatusLabel(viewingNotice.trangThai)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {viewingNotice.tieuDe}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Ngày đăng: {formatDateTime(viewingNotice.ngayDang) || "--"}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
              {viewingNotice.noiDung || "Không có nội dung chi tiết."}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setViewingNotice(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-primary flex items-center gap-1.5"
                onClick={() => {
                  const target = viewingNotice;
                  setViewingNotice(null);
                  openEdit(target);
                }}
              >
                <Edit className="w-4 h-4" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
          </div>
        )}
      </SimpleModal>

      {/* Modal Thêm / Cập nhật thông báo */}
      <SimpleModal
        open={modalOpen}
        title={editingNotice ? "Cập nhật thông báo" : "Thêm thông báo"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tiêu đề</span>
            <input
              value={form.tieuDe}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tieuDe: event.target.value }))
              }
              placeholder="vd: Lịch thi học kỳ"
            />
          </label>
          <label className="form-field">
            <span>Nội dung</span>
            <textarea
              rows={4}
              value={form.noiDung}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, noiDung: event.target.value }))
              }
              placeholder="Nội dung thông báo"
            />
          </label>
          <label className="form-field">
            <span>Đối tượng</span>
            <select
              value={form.doiTuong}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, doiTuong: event.target.value }))
              }
            >
              <option value="ALL">Toàn trường</option>
              <option value="HOC_SINH">Học sinh</option>
              <option value="GIAO_VIEN">Giáo viên</option>
              <option value="PHU_HUYNH">Phụ huynh</option>
            </select>
          </label>
          <label className="form-field">
            <span>Trạng thái</span>
            <select
              value={form.trangThai}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trangThai: Number(event.target.value) }))
              }
            >
              <option value={1}>Đang hiển thị</option>
              <option value={0}>Đã ẩn</option>
            </select>
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