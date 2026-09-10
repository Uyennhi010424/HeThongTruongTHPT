import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDate, getActiveAcademicYear, getVisibleAcademicYears } from "../../utils/helpers.js";
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
  const [expandedConductId, setExpandedConductId] = useState(null);

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

        const rawYears = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawYears);
        const years = visibleYears
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean);
        setNamHocList(years);
        const activeYr = getActiveAcademicYear(visibleYears) || visibleYears[0];
        if (activeYr?.tenNamHoc) {
          setSelectedNamHoc(activeYr.tenNamHoc);
        }
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
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-w-[600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-14 text-center">STT</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Học kỳ</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Xếp loại</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhận xét</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {Array.from({ length: 5 }).map((_, col) => (
                      <td key={col} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                filteredConducts.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 text-center font-medium">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{getTermLabel(item.hocKy)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold"
                        style={{
                          backgroundColor: getXepLoaiBg(item.xepLoai),
                          color: getXepLoaiColor(item.xepLoai),
                          border: `1px solid ${getXepLoaiColor(item.xepLoai)}20`
                        }}
                      >
                        {getXepLoaiLabel(item.xepLoai)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.nhanXet || "--"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(item.ngayDanhGia) || "--"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Collapsible Accordion View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>
          ) : (
            filteredConducts.map((item, index) => {
              const isExpanded = expandedConductId === item.id;
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div
                    className="flex items-center justify-between cursor-pointer gap-2"
                    onClick={() => setExpandedConductId(isExpanded ? null : item.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {getTermLabel(item.hocKy)}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(item.ngayDanhGia) || "--"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="inline-flex px-2.5 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor: getXepLoaiBg(item.xepLoai),
                          color: getXepLoaiColor(item.xepLoai),
                          border: `1px solid ${getXepLoaiColor(item.xepLoai)}20`
                        }}
                      >
                        {getXepLoaiLabel(item.xepLoai)}
                      </span>
                      <button
                        type="button"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2 animate-in fade-in-50 duration-200">
                      <div className="bg-slate-50 p-3 rounded-xl space-y-1.5">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nhận xét đánh giá:</span>
                          <span className="font-medium text-slate-800">{item.nhanXet || "Không có nhận xét."}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-400">Ngày đánh giá:</span>
                          <span className="font-semibold text-slate-800">{formatDate(item.ngayDanhGia) || "--"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
