import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { getDiem, updateDiem } from "../../../api/diemApi.js";

const getLoaiDiemLabel = (value) => {
  switch (value) {
    case "MIENG":
      return "Miệng";
    case "MUOI_LAM_PHUT":
      return "15 phút";
    case "MOT_TIET":
      return "1 tiết";
    case "GIUA_KY":
      return "Giữa kỳ";
    case "CUOI_KY":
      return "Cuối kỳ";
    default:
      return "--";
  }
};

export default function DuyetDiem() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    loaiDiem: "MIENG",
    diemSo: ""
  });

  useEffect(() => {
    let active = true;

    const fetchScores = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getDiem();
        if (!active) return;
        setScores(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách điểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchScores();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = scores.length;
    const pending = scores.filter((item) => item.diemSo === null || item.diemSo === undefined).length;
    return { total, pending };
  }, [scores]);

  const filteredScores = useMemo(() => {
    if (!keyword.trim()) return scores;
    const lower = keyword.toLowerCase();
    return scores.filter((item) =>
      [item.loaiDiem, item.diemSo !== null && item.diemSo !== undefined ? String(item.diemSo) : ""]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, scores]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredScores.length / pageSize));
  }, [filteredScores.length, pageSize]);

  const pagedScores = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredScores.slice(start, start + pageSize);
  }, [filteredScores, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openReview = (score) => {
    setEditingScore(score);
    setForm({
      loaiDiem: score.loaiDiem || "MIENG",
      diemSo: score.diemSo !== null && score.diemSo !== undefined ? String(score.diemSo) : ""
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingScore) return;
    setFormError("");
    const diemValue = Number(form.diemSo);
    if (Number.isNaN(diemValue)) {
      setFormError("Vui lòng nhập điểm hợp lệ.");
      return;
    }

    const payload = {
      loaiDiem: form.loaiDiem,
      diemSo: diemValue
    };

    try {
      const response = await updateDiem(editingScore.id, payload);
      const updated = response?.data?.data;
      setScores((prev) =>
        prev.map((item) => (item.id === editingScore.id ? updated : item))
      );
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể duyệt điểm. Vui lòng thử lại.");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Duyệt điểm" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Rà soát và xác nhận điểm</div>
          <div className="users-subtitle">Chọn điểm để duyệt, chỉnh sửa nếu cần</div>
        </div>
        <div className="users-actions">
          <div className="dash-search users-search">
            <span className="dot" />
            <input
              placeholder="Tìm theo loại điểm hoặc điểm số"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng bài điểm</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Chưa có điểm</div>
          <div className="stat-value">{loading ? "..." : stats.pending}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách điểm cần duyệt</div>
            <div className="panel-subtitle">Dữ liệu lấy từ cơ sở dữ liệu</div>
          </div>
          <div className="panel-pill">{filteredScores.length} điểm</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredScores.length === 0 && (
          <div className="table-empty">Không tìm thấy điểm phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
            <div>Loại điểm</div>
            <div>Điểm số</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedScores.map((score) => (
                <div className="table-row" key={score.id}>
                  <div className="table-id">#{score.id}</div>
                  <div className="table-title">{getLoaiDiemLabel(score.loaiDiem)}</div>
                  <div className="table-title">{score.diemSo ?? "--"}</div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openReview(score)}
                    >
                      Duyệt
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
        title="Duyệt điểm"
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Loại điểm</span>
            <select
              value={form.loaiDiem}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, loaiDiem: event.target.value }))
              }
            >
              <option value="MIENG">Miệng</option>
              <option value="MUOI_LAM_PHUT">15 phút</option>
              <option value="MOT_TIET">1 tiết</option>
              <option value="GIUA_KY">Giữa kỳ</option>
              <option value="CUOI_KY">Cuối kỳ</option>
            </select>
          </label>
          <label className="form-field">
            <span>Điểm số</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.diemSo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, diemSo: event.target.value }))
              }
              placeholder="vd: 8.5"
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
              Xác nhận
            </button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}