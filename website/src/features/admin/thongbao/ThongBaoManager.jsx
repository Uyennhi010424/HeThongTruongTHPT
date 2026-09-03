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
        title="Thông báo nhà trường" 
        actions={
          <button className="btn-primary" onClick={openCreate}>
            Thêm thông báo
          </button>
        }
      />

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách thông báo</div>
          </div>
          <div className="panel-pill">{filteredNotices.length} thông báo</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredNotices.length === 0 && (
          <div className="table-empty">Không tìm thấy thông báo phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Thông báo</div>
            <div>Đối tượng</div>
            <div>Ngày đăng</div>
            <div>Trạng thái</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedNotices.map((notice, index) => (
                <div className="table-row" key={notice.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{notice.tieuDe}</div>
                    <div className="table-meta">{notice.noiDung}</div>
                  </div>
                  <div>
                    <span className="role-pill">{getTargetLabel(notice.doiTuong || notice.loai)}</span>
                  </div>
                  <div className="table-date">
                    {formatDateTime(notice.ngayDang) || "--"}
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        notice.trangThai === 1 ? "status-active" : "status-locked"
                      }`}
                    >
                      {getStatusLabel(notice.trangThai)}
                    </span>
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(notice)}
                    >
                      Sửa
                    </button>
                    <button
                      className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(notice)}
                      title="Xóa"
                    >
                      <MaterialIcon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
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