import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createNamHoc,
  deleteNamHoc,
  getNamHoc,
  updateNamHoc
} from "../../../api/namhocApi.js";

const parseStartYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

export default function NamHocList() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    tenNamHoc: ""
  });

  useEffect(() => {
    let active = true;

    const fetchYears = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getNamHoc();
        if (!active) return;
        setYears(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách năm học.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchYears();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!years.length) {
      return { total: 0, newest: "--", oldest: "--" };
    }
    const sorted = [...years].sort((a, b) => {
      const aYear = parseStartYear(a.tenNamHoc) ?? -Infinity;
      const bYear = parseStartYear(b.tenNamHoc) ?? -Infinity;
      return aYear - bYear;
    });
    return {
      total: years.length,
      newest: sorted[sorted.length - 1]?.tenNamHoc || "--",
      oldest: sorted[0]?.tenNamHoc || "--"
    };
  }, [years]);

  const filteredYears = useMemo(() => {
    if (!keyword.trim()) return years;
    const lower = keyword.toLowerCase();
    return years.filter((item) =>
      [item.tenNamHoc]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, years]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredYears.length / pageSize));
  }, [filteredYears.length, pageSize]);

  const pagedYears = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredYears.slice(start, start + pageSize);
  }, [filteredYears, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openCreate = () => {
    setEditingYear(null);
    setForm({ tenNamHoc: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingYear(item);
    setForm({ tenNamHoc: item.tenNamHoc || "" });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa năm học ${item.tenNamHoc}?`)) return;
    try {
      await deleteNamHoc(item.id);
      setYears((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError("Không thể xóa năm học.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.tenNamHoc.trim()) {
      setFormError("Vui lòng nhập tên năm học.");
      return;
    }

    const payload = {
      tenNamHoc: form.tenNamHoc.trim()
    };

    try {
      if (editingYear) {
        const response = await updateNamHoc(editingYear.id, payload);
        const updated = response?.data?.data;
        setYears((prev) =>
          prev.map((row) => (row.id === editingYear.id ? updated : row))
        );
      } else {
        const response = await createNamHoc(payload);
        const created = response?.data?.data;
        setYears((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu năm học. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Danh mục năm học" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Quản lý năm học</div>
          <div className="users-subtitle">
            Theo dõi, cập nhật thông tin năm học
          </div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên năm học"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            Thêm năm học
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng năm học</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Năm gần nhất</div>
          <div className="stat-value">{loading ? "..." : stats.newest}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Năm sớm nhất</div>
          <div className="stat-value">{loading ? "..." : stats.oldest}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách năm học</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredYears.length} năm học</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredYears.length === 0 && (
          <div className="table-empty">Không tìm thấy năm học phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Tên năm học</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedYears.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{item.tenNamHoc}</div>
                    <div className="table-meta">ID: {item.id}</div>
                  </div>
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
        title={editingYear ? "Cập nhật năm học" : "Thêm năm học"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên năm học</span>
            <input
              value={form.tenNamHoc}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenNamHoc: event.target.value }))
              }
              placeholder="vd: 2024-2025"
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