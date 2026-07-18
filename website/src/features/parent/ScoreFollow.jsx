import { useEffect, useMemo, useState } from "react";
import { formatDate } from "../../utils/helpers.js";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

const getLoaiDiemLabel = (value, soThuTu) => {
  switch (value) {
    case "TX":
      return soThuTu ? `TX ${soThuTu}` : "Thường xuyên";
    case "GK":
      return "Giữa kỳ";
    case "CK":
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

const CLASSIFICATION_MAP = {
  TOT: { label: "Tốt", color: "#10b981", bgColor: "#ecfdf5" },
  KHA: { label: "Khá", color: "#3b82f6", bgColor: "#eff6ff" },
  TRUNG_BINH: { label: "Trung bình", color: "#f59e0b", bgColor: "#fffbeb" },
  YEU: { label: "Yếu", color: "#ef4444", bgColor: "#fef2f2" }
};

const getXepLoaiColor = (value) => CLASSIFICATION_MAP[value]?.color || "#6b7280";
const getXepLoaiBg = (value) => CLASSIFICATION_MAP[value]?.bgColor || "#f3f4f6";

const getTermLabel = (hocKy) => {
  if (hocKy === 1) return "Học kỳ 1";
  if (hocKy === 2) return "Học kỳ 2";
  return "Cả năm";
};

export default function ScoreFollow() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading, error: studentsError } = useParentStudents();
  const [scores, setScores] = useState([]);
  const [conducts, setConducts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("all");

  useEffect(() => {
    if (!currentStudent?.id) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const [scoreRes, conductRes] = await Promise.all([
          getDiem({ hocSinhId: currentStudent.id }),
          getHanhKiem({ hocSinhId: currentStudent.id })
        ]);
        if (!active) return;
        setScores(scoreRes?.data?.data || []);
        setConducts(conductRes?.data?.data || []);
      } catch {
        if (!active) return;
        setDataError("Không thể tải dữ liệu theo dõi.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currentStudent?.id]);

  const loading = studentsLoading || dataLoading;
  const error = studentsError || dataError;

  const stats = useMemo(() => {
    const totalScores = scores.length;
    const totalConducts = conducts.length;
    return { totalScores, totalConducts };
  }, [scores, conducts]);

  const filteredScores = useMemo(() => {
    if (selectedHocKy === "all") return scores;
    return scores.filter((s) => String(s.hocKy) === selectedHocKy);
  }, [scores, selectedHocKy]);

  return (
    <div className="page users-page student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Theo dõi điểm</h2>
          <p className="student-hero-subtitle">Xem kết quả học tập và hạnh kiểm của con em.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : stats.totalScores} bài điểm</div>
          <div className="student-hero-chip">{loading ? "..." : stats.totalConducts} đánh giá</div>
        </div>
      </section>

      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      <div className="users-stats student-stats">
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

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Bảng điểm</div>
            <div className="panel-subtitle">Theo dõi kết quả học tập</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedHocKy}
              onChange={(e) => setSelectedHocKy(e.target.value)}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 13 }}
            >
              <option value="all">Tất cả HK</option>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
            </select>
            <div className="panel-pill">{filteredScores.length} điểm</div>
          </div>
        </div>
        {!error && !loading && scores.length === 0 && (
          <div className="table-empty">Chưa có dữ liệu điểm.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Môn học</div>
            <div>Học kỳ</div>
            <div>Loại điểm</div>
            <div>Điểm số</div>
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : filteredScores.map((score, index) => (
                <div className="table-row" key={score.id}>
                  <div className="table-id">{index + 1}</div>
                  <div className="table-title">{score.monHoc?.tenMon || score.tenMon || `Môn ${score.monHocId || "--"}`}</div>
                  <div className="table-title">HK{score.hocKy || "--"}</div>
                  <div className="table-title">{getLoaiDiemLabel(score.loaiDiem, score.soThuTu)}</div>
                  <div className="table-title" style={{ fontWeight: 700, color: Number(score.giaTriDiem) >= 8 ? "#16a34a" : Number(score.giaTriDiem) >= 5 ? "#2563eb" : "#dc2626" }}>
                    {score.giaTriDiem ?? "--"}
                  </div>
                </div>
              ))}
        </div>
      </div>

      <div className="card users-table student-card">
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
            <div>STT</div>
            <div>Học kì</div>
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
                  <div className="skeleton" />
                </div>
              ))
            : conducts.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{index + 1}</div>
                  <div className="table-title">{getTermLabel(item.hocKy)}</div>
                  <div>
                    <span
                      className="status-pill"
                      style={{
                        backgroundColor: getXepLoaiBg(item.xepLoai),
                        color: getXepLoaiColor(item.xepLoai),
                        border: `1px solid ${getXepLoaiColor(item.xepLoai)}20`
                      }}
                    >
                      {getXepLoaiLabel(item.xepLoai)}
                    </span>
                  </div>
                  <div className="table-title">{item.nhanXet || "--"}</div>
                  <div className="table-date">{formatDate(item.ngayDanhGia) || "--"}</div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
