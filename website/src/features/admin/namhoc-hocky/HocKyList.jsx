import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createHocKy,
  deleteHocKy,
  getHocKy,
  updateHocKy
} from "../../../api/hockyApi.js";

export default function HocKyList() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    tenHocKy: ""
  });

  useEffect(() => {
    let active = true;

    const fetchSemesters = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getHocKy();
        if (!active) return;
        setSemesters(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách học kỳ.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSemesters();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: semesters.length
    };
  }, [semesters]);

  const filteredSemesters = useMemo(() => {
    if (!keyword.trim()) return semesters;
    const lower = keyword.toLowerCase();
    return semesters.filter((item) =>
      [item.tenHocKy]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, semesters]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSemesters.length / pageSize));
  }, [filteredSemesters.length, pageSize]);

  const pagedSemesters = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSemesters.slice(start, start + pageSize);
  }, [filteredSemesters, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openCreate = () => {
    setEditingSemester(null);
    setForm({ tenHocKy: "" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingSemester(item);
    setForm({ tenHocKy: item.tenHocKy || "" });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa học kỳ ${item.tenHocKy}?`)) return;
    try {
      await deleteHocKy(item.id);
      setSemesters((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError("Không thể xóa học kỳ.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.tenHocKy.trim()) {
      setFormError("Vui lòng nhập tên học kỳ.");
      return;
    }

    const payload = {
      tenHocKy: form.tenHocKy.trim()
    };

    try {
      if (editingSemester) {
        const response = await updateHocKy(editingSemester.id, payload);
        const updated = response?.data?.data;
        setSemesters((prev) =>
          prev.map((row) => (row.id === editingSemester.id ? updated : row))
        );
      } else {
        const response = await createHocKy(payload);
        const created = response?.data?.data;
        setSemesters((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu học kỳ. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Danh mục học kỳ" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Quản lý học kỳ</div>
          <div className="users-subtitle">Theo dõi, cập nhật thông tin học kỳ</div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo tên học kỳ"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openCreate}>
            Thêm học kỳ
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng học kỳ</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách học kỳ</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredSemesters.length} học kỳ</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredSemesters.length === 0 && (
          <div className="table-empty">Không tìm thấy học kỳ phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Tên học kỳ</div>
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
            : pagedSemesters.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{item.tenHocKy}</div>
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
        title={editingSemester ? "Cập nhật học kỳ" : "Thêm học kỳ"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên học kỳ</span>
            <input
              value={form.tenHocKy}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenHocKy: event.target.value }))
              }
              placeholder="vd: Học kỳ 1"
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