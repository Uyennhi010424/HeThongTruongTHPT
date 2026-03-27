import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getHanhKiem } from "../../api/hanhkiemApi.js";

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

export default function ConductPage() {
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError("Không thể tải hạnh kiểm.");
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
    return { total, good };
  }, [conducts]);

  return (
    <div className="page users-page">
      <Header title="Hạnh kiểm" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng đánh giá</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Tốt</div>
          <div className="stat-value">{loading ? "..." : stats.good}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Nhận xét hạnh kiểm</div>
            <div className="panel-subtitle">Các lần đánh giá gần đây</div>
          </div>
          <div className="panel-pill">{conducts.length} đánh giá</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && conducts.length === 0 && (
          <div className="table-empty">Chưa có đánh giá hạnh kiểm.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
            <div>Xếp loại</div>
            <div>Nhận xét</div>
            <div>Ngày đánh giá</div>
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : conducts.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">#{item.id}</div>
                  <div>
                    <span className="role-pill">{getXepLoaiLabel(item.xepLoai)}</span>
                  </div>
                  <div className="table-title">{item.nhanXet}</div>
                  <div className="table-date">{formatDate(item.ngayDanhGia) || "--"}</div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}