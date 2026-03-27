import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createHanhKiem,
  deleteHanhKiem,
  getHanhKiem,
  updateHanhKiem
} from "../../../api/hanhkiemApi.js";

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

const getXepLoaiLabel = (value) => {
  switch (value) {
    case "TOT":
      return "Tốt";
    case "KHA":
      return "Khá";
    case "TRUNG_BINH":
      return "Trung bình";
    case "YEU":
      return "Yếu";
    default:
      return "--";
  }
};

export default function HanhKiemPage() {
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConduct, setEditingConduct] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    xepLoai: "TOT",
    nhanXet: "",
    ngayDanhGia: ""
  });

  useEffect(() => {
    let active = true;

    const fetchConducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getHanhKiem();
        if (!active) return;
        setConducts(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách hạnh kiểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchConducts();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = conducts.length;
    const good = conducts.filter((item) => item.xepLoai === "TOT").length;
    const average = conducts.filter((item) => item.xepLoai === "TRUNG_BINH").length;
    return { total, good, average };
  }, [conducts]);

  const filteredConducts = useMemo(() => {
    if (!keyword.trim()) return conducts;
    const lower = keyword.toLowerCase();
    return conducts.filter((item) =>
      [item.xepLoai, item.nhanXet]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, conducts]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredConducts.length / pageSize));
  }, [filteredConducts.length, pageSize]);

  const pagedConducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredConducts.slice(start, start + pageSize);
  }, [filteredConducts, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openCreate = () => {
    setEditingConduct(null);
    setForm({ xepLoai: "TOT", nhanXet: "", ngayDanhGia: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingConduct(item);
    setForm({
      xepLoai: item.xepLoai || "TOT",
      nhanXet: item.nhanXet || "",
      ngayDanhGia: formatDateInput(item.ngayDanhGia)
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa đánh giá #${item.id}?`)) return;
    try {
      await deleteHanhKiem(item.id);
      setConducts((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError("Không thể xóa đánh giá.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.nhanXet.trim()) {
      setFormError("Vui lòng nhập nhận xét.");
      return;
    }

    const payload = {
      xepLoai: form.xepLoai,
      nhanXet: form.nhanXet.trim(),
      ngayDanhGia: form.ngayDanhGia || null
    };

    try {
      if (editingConduct) {
        const response = await updateHanhKiem(editingConduct.id, payload);
        const updated = response?.data?.data;
        setConducts((prev) =>
          prev.map((row) => (row.id === editingConduct.id ? updated : row))
        );
      } else {
        const response = await createHanhKiem(payload);
        const created = response?.data?.data;
        setConducts((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu đánh giá. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Hạnh kiểm" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Đánh giá hạnh kiểm</div>
          <div className="users-subtitle">Lưu nhận xét và xếp loại học sinh</div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo xếp loại hoặc nhận xét"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            Thêm đánh giá
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng đánh giá</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Tốt</div>
          <div className="stat-value">{loading ? "..." : stats.good}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Trung bình</div>
          <div className="stat-value">{loading ? "..." : stats.average}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách đánh giá</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredConducts.length} đánh giá</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredConducts.length === 0 && (
          <div className="table-empty">Không tìm thấy đánh giá phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
            <div>Xếp loại</div>
            <div>Nhận xét</div>
            <div>Ngày đánh giá</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedConducts.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">#{item.id}</div>
                  <div>
                    <span className="role-pill">{getXepLoaiLabel(item.xepLoai)}</span>
                  </div>
                  <div className="table-title">{item.nhanXet}</div>
                  <div className="table-date">{formatDate(item.ngayDanhGia) || "--"}</div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(item)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(item)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
        </div>
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingConduct ? "Cập nhật hạnh kiểm" : "Thêm hạnh kiểm"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Xếp loại</span>
            <select
              value={form.xepLoai}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, xepLoai: event.target.value }))
              }
            >
              <option value="TOT">Tốt</option>
              <option value="KHA">Khá</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="YEU">Yếu</option>
            </select>
          </label>
          <label className="form-field">
            <span>Nhận xét</span>
            <textarea
              rows={3}
              value={form.nhanXet}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nhanXet: event.target.value }))
              }
              placeholder="Nhận xét hạnh kiểm"
            />
          </label>
          <label className="form-field">
            <span>Ngày đánh giá</span>
            <input
              type="date"
              value={form.ngayDanhGia}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ngayDanhGia: event.target.value }))
              }
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