import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getHocSinh, getHocSinhStats } from "../../../api/hocsinhApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getLop, syncSiSo } from "../../../api/lopApi.js";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getDiemAvgByGrade, getDiemDistribution } from "../../../api/diemApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const formatScore = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "--";

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const GRADE_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626"];
const GRADE_LABELS = { "TỐT": "Tốt", "KHÁ": "Khá", "ĐẠT": "Đạt", "CHƯA ĐẠT": "Chưa đạt" };

const sortClasses = (a, b) => {
  const ga = Number(a?.khoi || 0);
  const gb = Number(b?.khoi || 0);
  if (ga !== gb) return ga - gb;
  return String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
    sensitivity: "base",
    numeric: true,
  });
};

export default function AdminDashboard() {
  const [schoolYears, setSchoolYears] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    grade10: 0,
    grade11: 0,
    grade12: 0,
    avgScore: null,
  });
  const [dashboardData, setDashboardData] = useState({
    classes: [],
    teachers: [],
    students: [],
    homeroomByClassId: {},
    teacherNameById: {},
    blockAvg: [],
    distributionCounts: { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 },
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
 
        // Đồng bộ sĩ số tự động trên server trước khi load dữ liệu lớp
        try {
          await withTimeout(syncSiSo(), 5000);
        } catch { /* ignore */ }

        // Load lại danh sách lớp sau khi đã sync sĩ số trên DB
        const [gv, lop, namHocRes, chuNhiemRes] = await Promise.all([
          getGiaoVien().catch(() => ({ data: { data: [] } })),
          getLop().catch(() => ({ data: { data: [] } })),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          getChuNhiem().catch(() => ({ data: { data: [] } })),
        ]);
        if (!active) return;

        const teachersArr = gv?.data?.data || [];
        const classesArr = lop?.data?.data || [];
        const homeroomArr = chuNhiemRes?.data?.data || [];

        const namHocArr = (namHocRes?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        if (namHocArr.length > 0) setSchoolYears(namHocArr);

        const teacherNameById = teachersArr.reduce((acc, item) => {
          if (item?.id != null) acc[String(item.id)] = item?.hoTen || "--";
          return acc;
        }, {});

        const homeroomByClassId = homeroomArr.reduce((acc, item) => {
          if (item?.lopId != null) acc[String(item.lopId)] = item?.giaoVienId ?? null;
          return acc;
        }, {});

        const totalStudentCount = classesArr.reduce((acc, c) => acc + (c.siSo || 0), 0);

        setStats({
          students: totalStudentCount,
          teachers: teachersArr.length,
          classes: classesArr.length,
          grade10: classesArr.filter((c) => String(c.khoi) === "10").length,
          grade11: classesArr.filter((c) => String(c.khoi) === "11").length,
          grade12: classesArr.filter((c) => String(c.khoi) === "12").length,
          avgScore: null,
        });

        setDashboardData({
          classes: classesArr,
          teachers: teachersArr,
          students: [], // Không load mảng students lớn nữa
          homeroomByClassId,
          teacherNameById,
          siSoByLopId: {}, // Dùng siSo trực tiếp của DB
          blockAvg: [],
          distributionCounts: { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 },
          totalStudents: 0,
        });

        setLoading(false); // ← Hiện UI cực nhanh
        if (!active) return;
 
        // ─── Đợt 2: Data chậm (aggregate) → load sau, update chart ───
        setChartLoading(true);
        const [avgRes, distRes] = await Promise.all([
          withTimeout(getDiemAvgByGrade()).catch(() => ({ data: { data: [] } })),
          withTimeout(getDiemDistribution()).catch(() => ({ data: { data: { counts: {}, total: 0, avgScore: null } } })),
        ]);
        if (!active) return;
 
        const avgByGrade = avgRes?.data?.data || [];
        const dist = distRes?.data?.data || {};
 
        const blockAvg = avgByGrade.map((item) => ({
          name: `Khối ${item.khoi}`,
          value: item.avgScore != null ? Number(item.avgScore.toFixed(2)) : "--",
          h: item.avgScore != null
            ? `${Math.max(10, Math.min(100, (item.avgScore / 10) * 100)).toFixed(0)}%`
            : "10%",
          count: item.studentCount || 0,
        }));
 
        const distributionCounts = dist.counts || { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 };
 
        setDashboardData((prev) => ({
          ...prev,
          blockAvg,
          distributionCounts,
          totalStudents: dist.total || 0,
        }));
 
        setStats((prev) => ({
          ...prev,
          avgScore: dist.avgScore ?? null,
        }));
 
        setChartLoading(false); 
 
      } catch {
        if (active) setError("Không thể tải thống kê.");
      } finally {
        if (active) {
          setLoading(false);
          setChartLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);
 
  const gradeDistribution = useMemo(() => {
    const total = dashboardData.totalStudents || 1;
    const counts = dashboardData.distributionCounts;
    return [
      { key: "TOT", legacyKey: "TỐT", label: "Tốt" },
      { key: "KHA", legacyKey: "KHÁ", label: "Khá" },
      { key: "DAT", legacyKey: "ĐẠT", label: "Đạt" },
      { key: "CHUA_DAT", legacyKey: "CHƯA ĐẠT", label: "Chưa đạt" },
    ].map((item, i) => {
      const count = counts[item.key] || counts[item.legacyKey] || 0;
      return {
        label: item.label,
        count,
        pct: Math.round((count / total) * 100) || 0,
        color: GRADE_COLORS[i],
      };
    });
  }, [dashboardData.distributionCounts, dashboardData.totalStudents]);

  const handleExportReport = async () => {
    try {
      notifySuccess("Đang tải dữ liệu để xuất báo cáo...");
      const hsRes = await getHocSinh();
      const studentsList = hsRes?.data?.data || [];
      if (!studentsList.length) {
        notifyError("Không có dữ liệu học sinh để xuất.");
        return;
      }

      const header = "STT,Họ tên,Lớp\n";
      const rows = studentsList.map((s, i) =>
        `${i + 1},"${s.hoTen}","${s.lop?.tenLop || ""}"`
      );
      const summary = `\n\nTổng học sinh,${studentsList.length}\nTổng giáo viên,${stats.teachers}\nTổng lớp,${dashboardData.classes.length}`;
      const csv = "﻿" + header + rows.join("\n") + summary;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao_cao_tong_quan_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      notifySuccess("Đã xuất báo cáo thành công!");
    } catch {
      notifyError("Không thể tải danh sách học sinh để xuất báo cáo.");
    }
  };

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Tổng quan quản lý"
        description="Chào mừng trở lại! Dưới đây là dữ liệu cập nhật của trường THPT."
        actions={
          <button type="button" onClick={handleExportReport} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Xuất báo cáo
          </button>
        }
      />

      {error && (
        <p className="rounded-xl bg-error-container px-md py-sm text-body-sm text-on-error-container">{error}</p>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng lớp", value: stats.classes, border: "border-primary" },
          { label: "Khối 10", value: stats.grade10, border: "border-secondary" },
          { label: "Khối 11", value: stats.grade11, border: "border-tertiary" },
          { label: "Khối 12", value: stats.grade12, border: "border-error" },
        ].map((card) => (
          <div key={card.label} className={`flex items-center justify-between rounded-2xl border-l-4 bg-surface-container-lowest p-lg shadow-card ${card.border}`}>
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{card.label}</p>
              <p className="text-headline-md font-bold text-primary">{loading ? "..." : formatNumber(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
        {/* Bar chart - ĐTB theo khối */}
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm lg:col-span-8">
          <div className="mb-xl border-b border-outline-variant/30 pb-sm">
            <h3 className="text-headline-md font-semibold text-primary">ĐTB theo khối</h3>
          </div>
          {chartLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : dashboardData.blockAvg.length === 0 || dashboardData.blockAvg.every((b) => b.count === 0) ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400">
              <span className="text-sm">Chưa có dữ liệu điểm</span>
            </div>
          ) : (
            <BlockAvgChart blockAvg={dashboardData.blockAvg} />
          )}
        </section>

        {/* Pie chart - Tỷ lệ xếp loại */}
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm lg:col-span-4">
          <h3 className="mb-md text-headline-md font-semibold text-primary">Tỷ lệ xếp loại</h3>
          {chartLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : dashboardData.totalStudents === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-sm">Chưa có dữ liệu</span>
            </div>
          ) : (
            <DonutChart
              data={gradeDistribution}
              avgScore={stats.avgScore}
              total={dashboardData.totalStudents}
            />
          )}
        </section>
      </div>

      {/* Recent classes */}
      <RecentClasses
        classes={dashboardData.classes}
        students={dashboardData.students}
        siSoByLopId={dashboardData.siSoByLopId || {}}
        homeroomByClassId={dashboardData.homeroomByClassId}
        teacherNameById={dashboardData.teacherNameById}
        loading={loading}
      />
    </div>
  );
}

function BlockAvgChart({ blockAvg }) {
  const CHART_HEIGHT = 200;

  const validScores = blockAvg
    .filter((b) => b.count > 0 && b.value !== "--")
    .map((b) => Number(b.value));
  const minScore = Math.min(5, ...validScores);
  const maxScore = 10;
  const range = maxScore - minScore || 1;

  const barColors = [
    "linear-gradient(180deg, #3b82f6 0%, #93c5fd 100%)",
    "linear-gradient(180deg, #8b5cf6 0%, #c4b5fd 100%)",
    "linear-gradient(180deg, #10b981 0%, #6ee7b7 100%)",
  ];

  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", height: CHART_HEIGHT, gap: 20 }}>
        {blockAvg.map((b, i) => {
          const score = Number(b.value);
          const barHeightPx =
            b.count === 0 || b.value === "--"
              ? 12
              : Math.max(12, ((score - minScore) / range) * (CHART_HEIGHT * 0.85) + CHART_HEIGHT * 0.1);

          return (
            <div key={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: b.count === 0 ? "#9ca3af" : "#1e3a5f",
                marginBottom: 6,
              }}>
                {b.value === "--" ? "--" : b.value}
              </span>
              <div style={{
                width: "60%", minWidth: 48, maxWidth: 80,
                height: barHeightPx,
                background: b.count === 0 ? "#e5e7eb" : barColors[i % barColors.length],
                borderRadius: "8px 8px 0 0",
                transition: "height 0.4s ease",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ height: 2, background: "#e5e7eb", margin: "4px 0 8px 0", borderRadius: 2 }} />
      <div style={{ display: "flex", gap: 20 }}>
        {blockAvg.map((b) => (
          <div key={b.name} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{b.name}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {b.count > 0 ? `${b.count} học sinh` : "Chưa có điểm"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, avgScore, total }) {
  const SIZE = 180;
  const STROKE = 28;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 3;

  const validData = data.filter((d) => d.count > 0);
  let cumulativePct = 0;

  const segments = validData.map((d) => {
    const pct = d.count / total;
    const arcLen = pct * CIRCUMFERENCE - GAP;
    const offset = CIRCUMFERENCE - cumulativePct * CIRCUMFERENCE;
    cumulativePct += pct;
    return { ...d, arcLen: Math.max(0, arcLen), offset };
  });

  const LABEL_COLORS = {
    "Tốt": { bg: "#dcfce7", text: "#15803d" },
    "Khá": { bg: "#dbeafe", text: "#1d4ed8" },
    "Đạt": { bg: "#fef9c3", text: "#a16207" },
    "Chưa đạt": { bg: "#fee2e2", text: "#b91c1c" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#f3f4f6" strokeWidth={STROKE} />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" stroke={seg.color} strokeWidth={STROKE}
              strokeDasharray={`${seg.arcLen} ${CIRCUMFERENCE}`}
              strokeDashoffset={-(CIRCUMFERENCE - seg.offset)}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", lineHeight: 1.1 }}>
            {avgScore == null ? "--" : Number(avgScore).toFixed(2)}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", marginTop: 3, textTransform: "uppercase" }}>
            ĐTB toàn trường
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", width: "100%" }}>
        {data.map((d) => {
          const colors = LABEL_COLORS[d.label] || { bg: "#f3f4f6", text: "#374151" };
          return (
            <div key={d.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: colors.bg, borderRadius: 10, padding: "6px 10px",
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>{d.label}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{d.count} HS · {d.pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentClasses({ classes = [], students = [], siSoByLopId = {}, homeroomByClassId = {}, teacherNameById = {}, loading = false }) {
  const rows = useMemo(
    () =>
      (classes || [])
        .slice()
        .sort(sortClasses)
        .slice(0, 5)
        .map((item) => {
          // Sử dụng sĩ số tính từ danh sách học sinh thực tế
          const realSiSo = siSoByLopId[String(item.id)];
          if (realSiSo === undefined) {
            // fallback: đếm từ mảng students nếu có
            const derivedCount = (students || []).filter((s) => {
              const lopId = s?.lop?.id ?? s?.lopId ?? null;
              return lopId !== null && String(lopId) === String(item.id);
            }).length;
            return {
              id: item.id,
              lop: item.tenLop || "--",
              siSo: derivedCount > 0 ? derivedCount : (item.siSo ?? 0),
              gvcn: teacherNameById[String(homeroomByClassId[String(item.id)] || "")] || "--",
              status: homeroomByClassId[String(item.id)] ? "Hoạt động" : "Thiếu GV",
            };
          }
          return {
            id: item.id,
            lop: item.tenLop || "--",
            siSo: realSiSo,
            gvcn: teacherNameById[String(homeroomByClassId[String(item.id)] || "")] || "--",
            status: homeroomByClassId[String(item.id)] ? "Hoạt động" : "Thiếu GV",
          };
        }),
    [classes, students, siSoByLopId, homeroomByClassId, teacherNameById]
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-card">
      <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low/50 px-lg py-md">
        <h3 className="text-headline-md font-semibold text-primary">Lớp học gần đây</h3>
        <Link to="/admin/lop" className="font-label-md text-secondary hover:underline">Xem tất cả</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/80 text-label-md text-on-surface">
              <th className="px-lg py-md">Lớp</th>
              <th className="px-lg py-md">Sĩ số</th>
              <th className="px-lg py-md">GVCN</th>
              <th className="px-lg py-md">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-lg py-md" colSpan={4}><div className="skeleton h-6 w-full" /></td>
                  </tr>
                ))
              : rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-surface-container-low">
                    <td className="px-lg py-md font-bold text-primary">{r.lop}</td>
                    <td className="px-lg py-md">{r.siSo}</td>
                    <td className="px-lg py-md">{r.gvcn}</td>
                    <td className="px-lg py-md">
                      <span className={`rounded-full px-sm py-xs text-[12px] font-bold ${r.status === "Hoạt động" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
