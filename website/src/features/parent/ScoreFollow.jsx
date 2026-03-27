import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";

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

export default function ScoreFollow() {
  const [scores, setScores] = useState([]);
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [scoreRes, conductRes] = await Promise.all([
          getDiem(),
          getHanhKiem()
        ]);
        if (!active) return;
        setScores(scoreRes?.data?.data || []);
        setConducts(conductRes?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu theo dõi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalScores = scores.length;
    const totalConducts = conducts.length;
    return { totalScores, totalConducts };
  }, [scores, conducts]);

  return (
    <div className="page users-page">
      <Header title="Theo dõi điểm" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Bài điểm</div>
          <div className="stat-value">{loading ? "..." : stats.totalScores}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Đánh giá hạnh kiểm</div>
          <div className="stat-value">{loading ? "..." : stats.totalConducts}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Bảng điểm</div>
            <div className="panel-subtitle">Theo dõi kết quả học tập</div>
          </div>
          <div className="panel-pill">{scores.length} điểm</div>
        </div>
        {!error && !loading && scores.length === 0 && (
          <div className="table-empty">Chưa có dữ liệu điểm.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
            <div>Loại điểm</div>
            <div>Điểm số</div>
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : scores.map((score) => (
                <div className="table-row" key={score.id}>
                  <div className="table-id">#{score.id}</div>
                  <div className="table-title">{getLoaiDiemLabel(score.loaiDiem)}</div>
                  <div className="table-title">{score.diemSo ?? "--"}</div>
                </div>
              ))}
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Hạnh kiểm</div>
            <div className="panel-subtitle">Nhận xét từ giáo viên chủ nhiệm</div>
          </div>
          <div className="panel-pill">{conducts.length} đánh giá</div>
        </div>
        {!error && !loading && conducts.length === 0 && (
          <div className="table-empty">Chưa có dữ liệu hạnh kiểm.</div>
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