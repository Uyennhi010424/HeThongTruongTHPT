import { useEffect, useMemo, useState } from "react";
import { formatDate } from "../../utils/helpers.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";

const CLASSIFICATION_MAP = {
  TOT: { label: "Tốt", color: "#10b981", bgColor: "#ecfdf5" },
  KHA: { label: "Khá", color: "#3b82f6", bgColor: "#eff6ff" },
  TRUNG_BINH: { label: "Trung bình", color: "#f59e0b", bgColor: "#fffbeb" },
  YEU: { label: "Yếu", color: "#ef4444", bgColor: "#fef2f2" }
};

const getXepLoaiLabel = (value) => CLASSIFICATION_MAP[value]?.label || "--";
const getXepLoaiColor = (value) => CLASSIFICATION_MAP[value]?.color || "#6b7280";
const getXepLoaiBg = (value) => CLASSIFICATION_MAP[value]?.bgColor || "#f3f4f6";

const getTermLabel = (hocKy) => {
  if (hocKy === 1) return "Học kỳ 1";
  if (hocKy === 2) return "Học kỳ 2";
  return "Cả năm";
};

export default function ConductPage() {
  const [conducts, setConducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("all");
  const [selectedNamHoc, setSelectedNamHoc] = useState("all");
  const [namHocList, setNamHocList] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchConducts = async () => {
      try {
        setLoading(true);
        setError("");

        const studentRes = await getCurrentHocSinh();
        if (!active) return;
        const currentStudent = studentRes?.data?.data || null;

        if (!currentStudent) {
          setConducts([]);
          return;
        }

        const [conductRes, namHocRes] = await Promise.all([
          getHanhKiem({ hocSinhId: currentStudent.id }),
          getNamHoc()
        ]);
        if (!active) return;
        setConducts(conductRes?.data?.data || []);

        const years = (namHocRes?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);
      } catch {
        if (!active) return;
        setError("Không thể tải hạnh kiểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchConducts();
    return () => { active = false; };
  }, []);

  const filteredConducts = useMemo(() => {
    let result = conducts;
    if (selectedNamHoc !== "all") {
      result = result.filter((item) => item?.namHoc?.tenNamHoc === selectedNamHoc);
    }
    if (selectedHocKy !== "all") {
      result = result.filter((item) => {
        if (selectedHocKy === "HK1") return item.hocKy === 1;
        if (selectedHocKy === "HK2") return item.hocKy === 2;
        return true;
      });
    }
    return result;
  }, [conducts, selectedNamHoc, selectedHocKy]);

  const stats = useMemo(() => {
    const total = filteredConducts.length;
    const byClass = {};
    Object.keys(CLASSIFICATION_MAP).forEach((key) => { byClass[key] = 0; });
    filteredConducts.forEach((item) => {
      if (byClass[item.xepLoai] !== undefined) {
        byClass[item.xepLoai] += 1;
      }
    });
    const latest = filteredConducts.length
      ? filteredConducts.reduce((a, b) =>
          new Date(a.ngayDanhGia || 0) > new Date(b.ngayDanhGia || 0) ? a : b
        )
      : null;
    return { total, byClass, latest };
  }, [filteredConducts]);

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Hạnh kiểm</h2>
          <p className="student-hero-subtitle">Tra cứu các lần đánh giá và kết quả rèn luyện gần đây.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : stats.total} đánh giá</div>
          <div className="student-hero-chip">
            {loading ? "..." : stats.latest ? getXepLoaiLabel(stats.latest.xepLoai) : "--"} mới nhất
          </div>
        </div>
      </section>

      <div className="users-stats student-stats">
        {Object.entries(CLASSIFICATION_MAP).map(([key, { label, color }]) => (
          <div className="stat-card" key={key} style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{loading ? "..." : stats.byClass[key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Nhận xét hạnh kiểm</div>
            <div className="panel-subtitle">Các lần đánh giá gần đây</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {namHocList.length > 1 && (
              <select
                value={selectedNamHoc}
                onChange={(e) => setSelectedNamHoc(e.target.value)}
                className="rounded-lg border-outline-variant bg-surface-container-lowest p-2 text-body-sm"
              >
                <option value="all">Tất cả năm</option>
                {namHocList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            <div className="semester-switch">
              {[
                { value: "all", label: "Tất cả" },
                { value: "HK1", label: "Học kỳ 1" },
                { value: "HK2", label: "Học kỳ 2" }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`semester-pill ${selectedHocKy === item.value ? "active" : ""}`}
                  onClick={() => setSelectedHocKy(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="panel-pill">{filteredConducts.length} đánh giá</div>
          </div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredConducts.length === 0 && (
          <div className="table-empty">Chưa có đánh giá hạnh kiểm.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Học kỳ</div>
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
            : filteredConducts.map((item, index) => (
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
