import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getDiem, getDiemSummary, getDiemDistribution } from "../../../api/diemApi.js";
import { getStatisticsOverview, getStatisticsAcademic } from "../../../api/statisticsApi.js";
import statisticsApi from "../../../api/statisticsApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

/* -- Helpers -------------------------------------------------------- */

const classify = (avg) => {
  if (avg == null) return "--";
  if (avg >= 8) return "Tốt";
  if (avg >= 6.5) return "Khá";
  if (avg >= 5) return "Đạt";
  return "Chưa đạt";
};

const classifyColor = (avg) => {
  if (avg == null) return "#9ca3af";
  if (avg >= 8) return "#16a34a";
  if (avg >= 6.5) return "#2563eb";
  if (avg >= 5) return "#ca8a04";
  return "#dc2626";
};

// Đồng bộ màu với Dashboard - theo Thông tư 22
const GRADE_COLORS = {
  "TỐT": "#16a34a",
  "KHÁ": "#2563eb",
  "ĐẠT": "#ca8a04",
  "CHƯA ĐẠT": "#dc2626",
};

const sortByClass = (a, b) => {
  const ka = Number(a?.khoi || 0), kb = Number(b?.khoi || 0);
  if (ka !== kb) return ka - kb;
  return String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", { sensitivity: "base", numeric: true });
};

/* -- Component ------------------------------------------------------ */

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allScores, setAllScores] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("0");
  const [selectedKhoi, setSelectedKhoi] = useState("0");
  const [compareYears, setCompareYears] = useState([]);

  // Statistics from API
  const [statsOverview, setStatsOverview] = useState(null);
  const [statsAcademic, setStatsAcademic] = useState(null);
  const [statsConduct, setStatsConduct] = useState(null);
  const [statsAttendance, setStatsAttendance] = useState(null);
  const [statsDistribution, setStatsDistribution] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfHtmlContent, setPdfHtmlContent] = useState("");
  const renderCardValue = (value, width = "70px") => {
    if (statsLoading) {
      return (
        <span 
          className="inline-block animate-pulse rounded"
          style={{ 
            width, 
            height: "28px", 
            backgroundColor: "rgba(0, 0, 0, 0.08)", 
            verticalAlign: "middle" 
          }}
        />
      );
    }
    return value;
  };

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [yRes, cRes, sRes, stRes, tRes] = await Promise.all([
          getNamHoc(), getLop(), getMonHoc(), getHocSinh(), getGiaoVien()
        ]);
        if (!active) return;
        const yData = yRes?.data?.data || [];
        setYears(yData);
        setClasses((cRes?.data?.data || []).sort(sortByClass));
        setSubjects(sRes?.data?.data || []);
        setStudents(stRes?.data?.data || []);
        setTeachers(tRes?.data?.data || []);
        const current = yData.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || yData[yData.length - 1];
        if (current) setSelectedYear(current.tenNamHoc);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, []);

  // Fetch scores when year or semester changes
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    const fetchScores = async () => {
      try {
        const params = { namHoc: selectedYear };
        if (selectedHocKy !== "0") params.hocKy = Number(selectedHocKy);
        const res = await getDiemSummary(params);
        if (!active) return;
        setAllScores(res?.data?.data || []);
      } catch {
        if (!active) return;
        setAllScores([]);
      }
    };
    fetchScores();
    return () => { active = false; };
  }, [selectedYear, selectedHocKy]);

  // Fetch statistics from API when year/khoi changes
  useEffect(() => {
    if (!selectedYear) return;
    let active = true;
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsOverview(null);
      setStatsAcademic(null);
      setStatsConduct(null);
      setStatsAttendance(null);
      setStatsDistribution(null);

      try {
        await Promise.all([
          getStatisticsOverview({ namHoc: selectedYear }).then(res => {
            if (active) setStatsOverview(res?.data?.data || null);
          }).catch(err => console.error("Overview stats error:", err)),

          getStatisticsAcademic({ namHoc: selectedYear, ...(selectedKhoi !== "0" ? { khoi: Number(selectedKhoi) } : {}) }).then(res => {
            if (active) setStatsAcademic(res?.data?.data || null);
          }).catch(err => console.error("Academic stats error:", err)),

          statisticsApi.getConduct(selectedYear, selectedHocKy).then(res => {
            if (active) setStatsConduct(res?.data?.data || null);
          }).catch(err => console.error("Conduct stats error:", err)),

          statisticsApi.getAttendance({ namHoc: selectedYear }).then(res => {
            if (active) setStatsAttendance(res?.data?.data || null);
          }).catch(err => console.error("Attendance stats error:", err)),

          getDiemDistribution({
            namHoc: selectedYear,
            hocKy: Number(selectedHocKy),
            ...(selectedKhoi !== "0" ? { khoi: Number(selectedKhoi) } : {})
          }).then(res => {
            if (active) setStatsDistribution(res?.data?.data || null);
          }).catch(err => console.error("Distribution stats error:", err))
        ]);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        if (active) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { active = false; };
  }, [selectedYear, selectedKhoi, selectedHocKy]);

  /* -- Filtered scores (lọc theo Khối) ------------------------------ */
  const filteredScores = useMemo(() => {
    let list = allScores;
    if (selectedKhoi !== "0") {
      const targetKhoi = Number(selectedKhoi);
      list = list.filter((s) => Number(s?.khoi) === targetKhoi);
    }
    return list;
  }, [allScores, selectedKhoi]);

  /* -- Subject stats ------------------------------------------------ */
  const subjectMap = useMemo(() => new Map(subjects.map((m) => [m.id, m])), [subjects]);

  const subjectStats = useMemo(() => {
    const bySubject = {};
    filteredScores.forEach((s) => {
      const monId = s?.monHoc?.id ?? s?.monHocId;
      if (!monId) return;
      const monInfo = subjectMap.get(monId);
      if (!bySubject[monId]) {
        bySubject[monId] = {
          id: monId,
          tenMon: monInfo?.tenMon || s?.monHoc?.tenMon || "--",
          nhomDanhGia: monInfo?.nhomDanhGia || s?.monHoc?.nhomDanhGia || "DIEM_SO",
          scores: []
        };
      }
      if (s.giaTriDiem != null) bySubject[monId].scores.push(Number(s.giaTriDiem));
    });

    return Object.values(bySubject).map((m) => {
      const scores = m.scores;
      const count = scores.length;
      if (count === 0) return { ...m, count: 0, avg: null, max: null, min: null, gioi: 0, kha: 0, tb: 0, yeu: 0, gioiP: 0, khaP: 0, tbP: 0, yeuP: 0 };
      const avg = scores.reduce((a, b) => a + b, 0) / count;
      const gioi = scores.filter((s) => s >= 8).length;
      const kha = scores.filter((s) => s >= 6.5 && s < 8).length;
      const tb = scores.filter((s) => s >= 5 && s < 6.5).length;
      const yeu = scores.filter((s) => s < 5).length;
      return {
        ...m, count, avg: Math.round(avg * 100) / 100,
        max: Math.max(...scores), min: Math.min(...scores),
        gioi, kha, tb, yeu,
        gioiP: Math.round((gioi / count) * 100),
        khaP: Math.round((kha / count) * 100),
        tbP: Math.round((tb / count) * 100),
        yeuP: Math.round((yeu / count) * 100)
      };
    }).sort((a, b) => String(a.tenMon).localeCompare(String(b.tenMon), "vi"));
  }, [filteredScores]);

  /* -- Overview stats (client-side fallback) ------------------------ */
  const overviewStats = useMemo(() => {
    if (statsOverview) {
      return {
        totalTeachers: statsOverview.tongGiaoVien ?? teachers.length,
        totalStudents: statsOverview.tongHocSinh ?? students.length,
        activeStudents: students.filter((s) => s.trangThai === 1).length,
        totalClasses: statsOverview.tongLop ?? classes.length,
        totalSubjects: subjects.length,
      };
    }
    return {
      totalTeachers: teachers.length,
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.trangThai === 1).length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
    };
  }, [statsOverview, teachers, students, classes, subjects]);

  /* -- Academic stats ---------------------------------------- */
  // Tất cả (HK1, HK2, Cả năm) đều dùng statsDistribution từ diem/distribution API
  // để đảm bảo nguồn dữ liệu đồng nhất, không dùng hoc_ba cho việc hiển thị
  const academicData = useMemo(() => {
    if (statsDistribution) {
      const counts = statsDistribution.counts || {};
      const gioi = counts["TOT"] || counts["TỐT"] || 0;
      const kha = counts["KHA"] || counts["KHÁ"] || 0;
      const tb = counts["DAT"] || counts["ĐẠT"] || 0;
      const yeu = counts["CHUA_DAT"] || counts["CHƯA ĐẠT"] || 0;

      const total = gioi + kha + tb + yeu || 1;
      return {
        overallAvg: statsDistribution.avgScore ?? 0,
        total: statsDistribution.total || total,
        gioi, kha, tb, yeu, kem: 0,
        gioiP: Math.round((gioi / total) * 100),
        khaP: Math.round((kha / total) * 100),
        tbP: Math.round((tb / total) * 100),
        yeuP: Math.round((yeu / total) * 100),
        kemP: 0,
        classStats: statsAcademic?.classStats || [],
        mode: "DIEM",
      };
    }

    // Fallback: statsAcademic (hoc_ba) - chỉ dùng khi không có statsDistribution
    if (statsAcademic && selectedHocKy === "0") {
      const pl = statsAcademic.phanLoaiHocLuc || {};
      const gioi = (pl["TOT"] || 0) + (pl["GIOI"] || 0);
      const kha = pl["KHA"] || 0;
      const dat = (pl["DAT"] || 0) + (pl["TRUNG_BINH"] || 0);
      const chuaDat = (pl["CHUA_DAT"] || 0) + (pl["YEU"] || 0) + (pl["KEM"] || 0);
      const total = gioi + kha + dat + chuaDat || 1;
      return {
        overallAvg: statsAcademic.diemTBToanTruong ?? 0,
        total: statsAcademic.tongHocSinh ?? total,
        gioi, kha, tb: dat, yeu: chuaDat, kem: 0,
        gioiP: Math.round((gioi / total) * 100),
        khaP: Math.round((kha / total) * 100),
        tbP: Math.round((dat / total) * 100),
        yeuP: Math.round((chuaDat / total) * 100),
        kemP: 0,
        classStats: statsAcademic.classStats || [],
        mode: "HOC_BA",
      };
    }


    // Fallback: empty
    return {
      overallAvg: 0, total: 0, gioi: 0, kha: 0, tb: 0, yeu: 0, kem: 0,
      gioiP: 0, khaP: 0, tbP: 0, yeuP: 0, kemP: 0, classStats: [], mode: "DIEM",
    };

  }, [statsDistribution, statsAcademic, filteredScores, students, selectedHocKy]);

  /* -- Year comparison ---------------------------------------------- */
  const toggleCompareYear = (tenNamHoc) => {
    setCompareYears((prev) =>
      prev.includes(tenNamHoc) ? prev.filter((y) => y !== tenNamHoc) : [...prev, tenNamHoc]
    );
  };

  const [compareData, setCompareData] = useState({});

  useEffect(() => {
    if (compareYears.length === 0) return;
    let active = true;
    const fetchCompare = async () => {
      const results = {};
      await Promise.all(compareYears.map(async (y) => {
        try {
          const res = await getDiem({ namHoc: y, skipCache: true });
          if (!active) return;
          results[y] = res?.data?.data || [];
        } catch {
          results[y] = [];
        }
      }));
      if (active) setCompareData((prev) => ({ ...prev, ...results }));
    };
    fetchCompare();
    return () => { active = false; };
  }, [compareYears]);

  const comparisonStats = useMemo(() => {
    return compareYears.map((y) => {
      const scores = (compareData[y] || []).filter((s) => s.giaTriDiem != null);
      const count = scores.length;
      const avg = count > 0 ? scores.reduce((a, s) => a + Number(s.giaTriDiem), 0) / count : 0;
      const gioi = scores.filter((s) => Number(s.giaTriDiem) >= 8).length;
      const kha = scores.filter((s) => Number(s.giaTriDiem) >= 6.5 && Number(s.giaTriDiem) < 8).length;
      const tb = scores.filter((s) => Number(s.giaTriDiem) >= 5 && Number(s.giaTriDiem) < 6.5).length;
      const yeu = scores.filter((s) => Number(s.giaTriDiem) < 5).length;
      const total = gioi + kha + tb + yeu || 1;
      return { year: y, count, avg: Math.round(avg * 100) / 100, gioi, kha, tb, yeu, gioiP: Math.round(gioi / total * 100), khaP: Math.round(kha / total * 100), tbP: Math.round(tb / total * 100), yeuP: Math.round(yeu / total * 100) };
    });
  }, [compareYears, compareData]);

  /* -- Print PDF ---------------------------------------------------- */
  const handlePrint = () => {
    const now = new Date().toLocaleDateString("vi-VN");
    const hkLabel = selectedHocKy === "0" ? "Cả năm" : `Học kỳ ${selectedHocKy}`;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo tổng hợp</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:15px;font-size:13px}
h1{text-align:center;font-size:18px;margin-bottom:4px}
.sub{text-align:center;font-size:12px;color:#555;margin-bottom:12px}
table{border-collapse:collapse;width:100%;margin-bottom:14px}
th,td{border:1px solid #999;padding:4px 8px;font-size:12px}
th{background:#1565c0;color:#fff;text-align:center;font-weight:700}
td.center{text-align:center}
.stats-row{display:flex;gap:10px;margin-bottom:12px}
.stat-box{flex:1;border:1px solid #ccc;border-radius:6px;padding:8px;text-align:center}
.stat-num{font-size:22px;font-weight:700;color:#1565c0}
.stat-lbl{font-size:11px;color:#555}
@media print{@page{size:A4 portrait;margin:10mm}body{padding:0}}
</style></head><body>
<h1>BÁO CÁO TỔNG HỢP</h1>
<div class="sub">${selectedYear} · ${hkLabel} · In ngày ${now}</div>

<div class="stats-row">
<div class="stat-box"><div class="stat-num">${overviewStats.totalTeachers}</div><div class="stat-lbl">Giáo viên</div></div>
<div class="stat-box"><div class="stat-num">${overviewStats.activeStudents}</div><div class="stat-lbl">HS đang học</div></div>
<div class="stat-box"><div class="stat-num">${overviewStats.totalClasses}</div><div class="stat-lbl">Lớp</div></div>
<div class="stat-box"><div class="stat-num">${academicData.overallAvg}</div><div class="stat-lbl">ĐTB toàn trường</div></div>
</div>

<table><thead><tr><th>Phân loại</th><th>Sĩ số</th><th>Tỷ lệ</th></tr></thead><tbody>
<tr><td>Tốt (≥8.0)</td><td class="center">${academicData.gioi}</td><td class="center">${academicData.gioiP}%</td></tr>
<tr><td>Khá (≥6.5)</td><td class="center">${academicData.kha}</td><td class="center">${academicData.khaP}%</td></tr>
<tr><td>Đạt (≥5.0)</td><td class="center">${academicData.tb}</td><td class="center">${academicData.tbP}%</td></tr>
<tr><td>Chưa đạt (&lt;5.0)</td><td class="center">${academicData.yeu}</td><td class="center">${academicData.yeuP}%</td></tr>
</tbody></table>

<h2 style="font-size:14px;margin:10px 0 6px">Thống kê theo môn</h2>
<table><thead><tr><th>Môn</th><th>ĐTB</th><th>Cao</th><th>Thấp</th><th>Tốt</th><th>Khá</th><th>Đạt</th><th>Chưa đạt</th></tr></thead><tbody>`;

    subjectStats.forEach((m) => {
      html += `<tr><td>${m.tenMon}</td><td class="center">${m.avg ?? "--"}</td><td class="center">${m.max ?? "--"}</td><td class="center">${m.min ?? "--"}</td><td class="center">${m.gioiP ?? 0}%</td><td class="center">${m.khaP ?? 0}%</td><td class="center">${m.tbP ?? 0}%</td><td class="center">${m.yeuP ?? 0}%</td></tr>`;
    });
    html += `</tbody></table></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    else notifyError("Trình duyệt chặn popup.");
  };

  /* -- Preview PDF in modal ----------------------------------------- */
  const handlePreviewPdf = () => {
    const now = new Date().toLocaleDateString("vi-VN");
    const hkLabel = selectedHocKy === "0" ? "Cả năm" : `Học kỳ ${selectedHocKy}`;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo tổng hợp</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:20px;font-size:13px;background:#fff}
h1{text-align:center;font-size:20px;margin-bottom:6px;color:#1565c0}
.sub{text-align:center;font-size:12px;color:#555;margin-bottom:16px}
table{border-collapse:collapse;width:100%;margin-bottom:18px}
th,td{border:1px solid #bbb;padding:6px 10px;font-size:12px}
th{background:#1565c0;color:#fff;text-align:center;font-weight:700}
td.center{text-align:center}
.stats-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.stat-box{flex:1;min-width:120px;border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;background:#f8fafc}
.stat-num{font-size:26px;font-weight:700;color:#1565c0}
.stat-lbl{font-size:11px;color:#666;margin-top:2px}
.section-title{font-size:15px;font-weight:700;margin:16px 0 8px;color:#1565c0;border-bottom:2px solid #1565c0;padding-bottom:4px}
</style></head><body>
<h1>BÁO CÁO TỔNG HỢP</h1>
<div class="sub">${selectedYear} · ${hkLabel} · In ngày ${now}</div>

<div class="section-title">Số liệu tổng quan</div>
<div class="stats-row">
<div class="stat-box"><div class="stat-num">${overviewStats.totalTeachers}</div><div class="stat-lbl">Giáo viên</div></div>
<div class="stat-box"><div class="stat-num">${overviewStats.activeStudents}</div><div class="stat-lbl">HS đang học</div></div>
<div class="stat-box"><div class="stat-num">${overviewStats.totalClasses}</div><div class="stat-lbl">Lớp</div></div>
<div class="stat-box"><div class="stat-num">${academicData.overallAvg}</div><div class="stat-lbl">ĐTB toàn trường</div></div>
</div>

<div class="section-title">Phân loại học lực</div>
<table><thead><tr><th>Phân loại</th><th>Sĩ số</th><th>Tỷ lệ</th></tr></thead><tbody>
<tr><td>Tốt (≥8.0)</td><td class="center">${academicData.gioi}</td><td class="center">${academicData.gioiP}%</td></tr>
<tr><td>Khá (≥6.5)</td><td class="center">${academicData.kha}</td><td class="center">${academicData.khaP}%</td></tr>
<tr><td>Đạt (≥5.0)</td><td class="center">${academicData.tb}</td><td class="center">${academicData.tbP}%</td></tr>
<tr><td>Chưa đạt (&lt;5.0)</td><td class="center">${academicData.yeu}</td><td class="center">${academicData.yeuP}%</td></tr>
</tbody></table>

<div class="section-title">Thống kê theo môn</div>
<table><thead><tr><th>Môn</th><th>ĐTB</th><th>Cao nhất</th><th>Thấp nhất</th><th>Tốt</th><th>Khá</th><th>Đạt</th><th>Chưa đạt</th></tr></thead><tbody>`;

    subjectStats.forEach((m) => {
      html += `<tr><td>${m.tenMon}</td><td class="center">${m.avg ?? "--"}</td><td class="center">${m.max ?? "--"}</td><td class="center">${m.min ?? "--"}</td><td class="center">${m.gioiP ?? 0}%</td><td class="center">${m.khaP ?? 0}%</td><td class="center">${m.tbP ?? 0}%</td><td class="center">${m.yeuP ?? 0}%</td></tr>`;
    });
    html += `</tbody></table></body></html>`;

    setPdfHtmlContent(html);
    setShowPdfPreview(true);
  };

  const handlePrintFromPreview = () => {
    const win = window.open("", "_blank");
    if (win) { win.document.write(pdfHtmlContent); win.document.close(); win.print(); }
    else notifyError("Trình duyệt chặn popup.");
  };

  /* -- Tabs --------------------------------------------------------- */
  const tabs = [
    { key: "overview", label: "Tổng quan", icon: "dashboard" },
    { key: "academic", label: "Học lực", icon: "school" },
    { key: "attendance", label: "Chuyên cần", icon: "event_available" },
    { key: "conduct", label: "Hạnh kiểm", icon: "verified_user" },
  ];

  /* -- Render ------------------------------------------------------- */
  return (
    <div className="page users-page">
      <PageHeader title="Báo cáo & Thống kê" />

      {/* Tabs */}
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, padding: "12px 16px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: activeTab === t.key ? "#1565c0" : "transparent",
                color: activeTab === t.key ? "#fff" : "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card users-toolbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label className="form-field" style={{ marginBottom: 0 }}>
            <span>Năm học</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map((y) => <option key={y.id} value={y.tenNamHoc}>{y.tenNamHoc}</option>)}
            </select>
          </label>
          <label className="form-field" style={{ marginBottom: 0 }}>
            <span>Học kỳ</span>
            <select value={selectedHocKy} onChange={(e) => setSelectedHocKy(e.target.value)}>
              <option value="0">Cả năm</option>
              <option value="1">Học kỳ I</option>
              <option value="2">Học kỳ II</option>
            </select>
          </label>
          {activeTab === "academic" && (
            <label className="form-field" style={{ marginBottom: 0 }}>
              <span>Khối</span>
              <select value={selectedKhoi} onChange={(e) => setSelectedKhoi(e.target.value)}>
                <option value="0">Tất cả</option>
                <option value="10">Khối 10</option>
                <option value="11">Khối 11</option>
                <option value="12">Khối 12</option>
              </select>
            </label>
          )}
          <button type="button" className="btn-primary" style={{ marginLeft: "auto" }} onClick={handlePreviewPdf}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle" }}>picture_as_pdf</span>
            {" "}Xem trước PDF
          </button>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}
      {loading && <div className="card table-empty">Đang tải dữ liệu...</div>}

      {/* === TAB: TONG QUAN === */}
      {!loading && activeTab === "overview" && (
        <>
          <div className="users-stats">
            <div className="stat-card stat-blue"><div className="stat-label">Giáo viên</div><div className="stat-value">{renderCardValue(overviewStats.totalTeachers)}</div></div>
            <div className="stat-card stat-sky"><div className="stat-label">Học sinh</div><div className="stat-value">{renderCardValue(overviewStats.totalStudents)}</div></div>
            <div className="stat-card stat-ice"><div className="stat-label">Đang học</div><div className="stat-value">{renderCardValue(overviewStats.activeStudents)}</div></div>
            <div className="stat-card stat-ice"><div className="stat-label">Lớp</div><div className="stat-value">{renderCardValue(overviewStats.totalClasses)}</div></div>
            <div className="stat-card stat-blue"><div className="stat-label">Môn học</div><div className="stat-value">{renderCardValue(overviewStats.totalSubjects)}</div></div>
          </div>

          <div className="users-stats">
            <div className="stat-card stat-blue"><div className="stat-label">ĐTB toàn trường</div><div className="stat-value">{renderCardValue(academicData.overallAvg)}</div></div>
            <div className="stat-card" style={{ background: "#dcfce7" }}><div className="stat-label">Tốt</div><div className="stat-value" style={{ color: "#16a34a" }}>{renderCardValue(<>{academicData.gioi} <small>({academicData.gioiP}%)</small></>, "90px")}</div></div>
            <div className="stat-card" style={{ background: "#dbeafe" }}><div className="stat-label">Khá</div><div className="stat-value" style={{ color: "#2563eb" }}>{renderCardValue(<>{academicData.kha} <small>({academicData.khaP}%)</small></>, "90px")}</div></div>
            <div className="stat-card" style={{ background: "#fef9c3" }}><div className="stat-label">Đạt</div><div className="stat-value" style={{ color: "#ca8a04" }}>{renderCardValue(<>{academicData.tb} <small>({academicData.tbP}%)</small></>, "90px")}</div></div>
            <div className="stat-card" style={{ background: "#fee2e2" }}><div className="stat-label">Chưa đạt</div><div className="stat-value" style={{ color: "#dc2626" }}>{renderCardValue(<>{academicData.yeu} <small>({academicData.yeuP}%)</small></>, "90px")}</div></div>
          </div>

          {/* Pie chart CSS */}
          <div className="card users-table">
            <div className="table-header"><div><div className="panel-title">Phân loại học lực</div><div className="panel-subtitle">{selectedYear} · {selectedHocKy === "0" ? "Cả năm" : `HK${selectedHocKy}`}</div></div></div>
            {statsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, width: "100%", color: "#666", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #2563eb", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <span>Đang tính toán số liệu học lực...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 32, padding: 20, justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{
                  width: 160, height: 160, borderRadius: "50%",
                  background: `conic-gradient(#16a34a 0% ${academicData.gioiP}%, #2563eb ${academicData.gioiP}% ${academicData.gioiP + academicData.khaP}%, #ca8a04 ${academicData.gioiP + academicData.khaP}% ${academicData.gioiP + academicData.khaP + academicData.tbP}%, #dc2626 ${academicData.gioiP + academicData.khaP + academicData.tbP}% 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#1565c0" }}>{academicData.total}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>học sinh</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Tốt", color: "#16a34a", count: academicData.gioi, pct: academicData.gioiP },
                    { label: "Khá", color: "#2563eb", count: academicData.kha, pct: academicData.khaP },
                    { label: "Đạt", color: "#ca8a04", count: academicData.tb, pct: academicData.tbP },
                    { label: "Chưa đạt", color: "#dc2626", count: academicData.yeu, pct: academicData.yeuP },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color }} />
                      <span style={{ fontSize: 13, width: 90 }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 40 }}>{item.count}</span>
                      <span style={{ fontSize: 12, color: "#666" }}>({item.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* === TAB: HOC LUC === */}
      {!loading && activeTab === "academic" && (
        <>
          <div className="users-stats">
            <div className="stat-card stat-blue"><div className="stat-label">ĐTB toàn trường</div><div className="stat-value">{renderCardValue(academicData.overallAvg)}</div></div>
            <div className="stat-card" style={{ background: "#dcfce7" }}><div className="stat-label">Tốt</div><div className="stat-value" style={{ color: "#16a34a" }}>{renderCardValue(academicData.gioi)}</div></div>
            <div className="stat-card" style={{ background: "#dbeafe" }}><div className="stat-label">Khá</div><div className="stat-value" style={{ color: "#2563eb" }}>{renderCardValue(academicData.kha)}</div></div>
            <div className="stat-card" style={{ background: "#fef9c3" }}><div className="stat-label">Đạt</div><div className="stat-value" style={{ color: "#ca8a04" }}>{renderCardValue(academicData.tb)}</div></div>
            <div className="stat-card" style={{ background: "#fee2e2" }}><div className="stat-label">Chưa đạt</div><div className="stat-value" style={{ color: "#dc2626" }}>{renderCardValue(academicData.yeu)}</div></div>
          </div>
          <div style={{ padding: "6px 12px", background: "#eff6ff", borderRadius: 8, fontSize: 12, color: "#1565c0", marginBottom: 8 }}>
            Phân loại học lực theo Thông tư 22/2021/TT-BGDĐT: Tốt / Khá / Đạt / Chưa đạt
          </div>

          {/* Subject stats */}
          <div className="card users-table">
            <div className="table-header"><div><div className="panel-title">Thống kê điểm theo môn học</div><div className="panel-subtitle">{selectedYear} · {selectedHocKy === "0" ? "Cả năm" : `HK${selectedHocKy}`}</div></div></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", fontWeight: 600 }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", minWidth: 180 }}>Môn học</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", width: 60 }}>ĐTB</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", width: 65 }}>Cao nhất</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", width: 65 }}>Thấp nhất</th>
                    <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 160 }}>Phân bổ</th>
                    <th style={{ padding: "10px 8px", textAlign: "center", width: 220 }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
              {subjectStats.filter((m) => m.nhomDanhGia === "DIEM_SO").map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{m.tenMon}</td>
                  <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, color: classifyColor(m.avg) }}>{m.avg ?? "--"}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}>{m.max ?? "--"}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}>{m.min ?? "--"}</td>
                  <td style={{ padding: "8px" }}>
                    <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", background: "#e5e7eb" }}>
                      {m.gioiP > 0 && <div style={{ width: `${m.gioiP}%`, background: "#16a34a" }} title={`Tốt: ${m.gioiP}%`} />}
                      {m.khaP > 0 && <div style={{ width: `${m.khaP}%`, background: "#2563eb" }} title={`Khá: ${m.khaP}%`} />}
                      {m.tbP > 0 && <div style={{ width: `${m.tbP}%`, background: "#ca8a04" }} title={`Đạt: ${m.tbP}%`} />}
                      {m.yeuP > 0 && <div style={{ width: `${m.yeuP}%`, background: "#dc2626" }} title={`Chưa đạt: ${m.yeuP}%`} />}
                    </div>
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                    {[{ v: m.gioiP, c: "#16a34a" }, { v: m.khaP, c: "#2563eb" }, { v: m.tbP, c: "#ca8a04" }, { v: m.yeuP, c: "#dc2626" }].map((b, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "1px 5px", borderRadius: 8, background: b.c + "18", color: b.c, fontWeight: 600 }}>{b.v}%</span>
                    ))}
                  </div>
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class stats from API */}
          {academicData.classStats && academicData.classStats.length > 0 && (
            <div className="card users-table">
              <div className="table-header"><div><div className="panel-title">Điểm trung bình theo lớp</div><div className="panel-subtitle">Xếp hạng lớp theo ĐTB</div></div></div>
              {[10, 11, 12].map((khoi) => {
                const khoiClasses = academicData.classStats.filter((c) => c.khoi === khoi);
                if (khoiClasses.length === 0) return null;
                return (
                  <div key={khoi} style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#1565c0" }}>Khối {khoi}</div>
                    {khoiClasses.map((c) => (
                      <div key={c.tenLop} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 50, fontSize: 13, fontWeight: 600 }}>{c.tenLop}</span>
                        <div style={{ flex: 1, height: 22, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${((c.avg || 0) / 10) * 100}%`, background: classifyColor(c.avg), borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ width: 40, textAlign: "right", fontSize: 13, fontWeight: 700, color: classifyColor(c.avg) }}>{c.avg ?? "--"}</span>
                        <span style={{ width: 50, fontSize: 11, color: "#666" }}>{c.total} HS</span>
                      </div>
                    ))}

      
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* === TAB: CHUYEN CAN === */}
      {!loading && activeTab === "attendance" && (
        <>
          {statsLoading ? (
            <div className="users-stats">
              <div className="stat-card stat-blue">
                <div className="stat-label">Tổng ngày vắng</div>
                <div className="stat-value">{renderCardValue(null)}</div>
              </div>
              <div className="stat-card" style={{ background: "#fee2e2" }}>
                <div className="stat-label">Tỷ lệ vắng</div>
                <div className="stat-value">{renderCardValue(null)}</div>
              </div>
            </div>
          ) : statsAttendance ? (
            <>
              <div className="users-stats">
                <div className="stat-card stat-blue">
                  <div className="stat-label">Tổng ngày vắng</div>
                  <div className="stat-value">{statsAttendance.tongNgayVang}</div>
                </div>
                <div className="stat-card" style={{ background: "#fee2e2" }}>
                  <div className="stat-label">Tỷ lệ vắng</div>
                  <div className="stat-value" style={{ color: "#dc2626" }}>{statsAttendance.tyLeVang}%</div>
                </div>
              </div>

              {/* Bảng theo lớp */}
              {statsAttendance.theoLop && statsAttendance.theoLop.length > 0 && (
                <div className="card users-table">
                  <div className="table-header"><div><div className="panel-title">Chuyên cần theo lớp</div><div className="panel-subtitle">{selectedYear} · {statsAttendance.theoLop.length} lớp</div></div></div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6", fontWeight: 600 }}>
                          <th style={{ padding: "10px 12px", textAlign: "left" }}>Lớp</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Sĩ số</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Tổng vắng</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Có phép</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Không phép</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Tỷ lệ vắng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsAttendance.theoLop.map((lop, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{lop.tenLop}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>{lop.siSo}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{lop.tongVang}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#f59e0b" }}>{lop.coPhep}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#dc2626" }}>{lop.khongPhep}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <span style={{
                                padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: lop.tyLeVang > 10 ? "#fee2e2" : lop.tyLeVang > 5 ? "#fef9c3" : "#dcfce7",
                                color: lop.tyLeVang > 10 ? "#dc2626" : lop.tyLeVang > 5 ? "#ca8a04" : "#16a34a"
                              }}>{lop.tyLeVang}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top vắng nhiều nhất */}
              {statsAttendance.topVangNhat && statsAttendance.topVangNhat.length > 0 && (
                <div className="card users-table">
                  <div className="table-header"><div><div className="panel-title">Học sinh vắng nhiều nhất</div><div className="panel-subtitle">Top 10</div></div></div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6", fontWeight: 600 }}>
                          <th style={{ padding: "10px 12px", textAlign: "left" }}>Họ tên</th>
                          <th style={{ padding: "10px 12px", textAlign: "left" }}>Lớp</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Tổng vắng</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Có phép</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Không phép</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsAttendance.topVangNhat.map((s, i) => (
                          <tr key={s.hocSinhId || i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{s.hoTen}</td>
                            <td style={{ padding: "8px 12px" }}>{s.tenLop}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#dc2626" }}>{s.soNgayVang}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#f59e0b" }}>{s.coPhep}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#dc2626" }}>{s.khongPhep}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card users-table">
              <div className="table-header"><div><div className="panel-title">Thống kê chuyên cần</div><div className="panel-subtitle">Dữ liệu điểm danh theo lớp</div></div></div>
              <div style={{ padding: 20, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
                Không có dữ liệu chuyên cần cho năm học này.
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB: HANH KIEM === */}
      {!loading && activeTab === "conduct" && (
        <>
          {statsLoading ? (
            <div className="users-stats">
              {[
                { label: "Tốt", bg: "#dcfce7" },
                { label: "Khá", bg: "#dbeafe" },
                { label: "Trung bình", bg: "#fef9c3" },
                { label: "Yếu", bg: "#fee2e2" },
              ].map((item, i) => (
                <div key={i} className="stat-card" style={{ background: item.bg }}>
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value">{renderCardValue(null)}</div>
                </div>
              ))}
            </div>
          ) : statsConduct ? (
            <>
              <div className="users-stats">
                {[
                  { label: "Tốt", key: "TOT", color: "#16a34a", bg: "#dcfce7" },
                  { label: "Khá", key: "KHA", color: "#2563eb", bg: "#dbeafe" },
                  { label: "Trung bình", key: "TRUNG_BINH", color: "#ca8a04", bg: "#fef9c3" },
                  { label: "Yếu", key: "YEU", color: "#dc2626", bg: "#fee2e2" },
                ].map((item) => (
                  <div key={item.key} className="stat-card" style={{ background: item.bg }}>
                    <div className="stat-label">{item.label}</div>
                    <div className="stat-value" style={{ color: item.color }}>{statsConduct.phanBoHanhKiem?.[item.key] ?? 0}</div>
                  </div>
                ))}
              </div>

              <div className="card users-table">
                <div className="table-header"><div><div className="panel-title">Thống kê hạnh kiểm</div><div className="panel-subtitle">{selectedYear}</div></div></div>
                <div style={{ padding: 20 }}>
                  {/* Pie chart */}
                  <div style={{ display: "flex", alignItems: "center", gap: 32, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                    <div style={{
                      width: 160, height: 160, borderRadius: "50%",
                      background: (() => {
                        const pb = statsConduct.phanBoHanhKiem || {};
                        const total = (pb.TOT || 0) + (pb.KHA || 0) + (pb.TRUNG_BINH || 0) + (pb.YEU || 0) || 1;
                        const p1 = Math.round(((pb.TOT || 0) / total) * 100);
                        const p2 = Math.round(((pb.KHA || 0) / total) * 100);
                        const p3 = Math.round(((pb.TRUNG_BINH || 0) / total) * 100);
                        return `conic-gradient(#16a34a 0% ${p1}%, #2563eb ${p1}% ${p1 + p2}%, #ca8a04 ${p1 + p2}% ${p1 + p2 + p3}%, #dc2626 ${p1 + p2 + p3}% 100%)`;
                      })(),
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#1565c0" }}>
                          {Object.values(statsConduct.phanBoHanhKiem || {}).reduce((a, b) => a + b, 0)}
                        </div>
                        <div style={{ fontSize: 10, color: "#666" }}>học sinh</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Tốt", key: "TOT", color: "#16a34a" },
                        { label: "Khá", key: "KHA", color: "#2563eb" },
                        { label: "Trung bình", key: "TRUNG_BINH", color: "#ca8a04" },
                        { label: "Yếu", key: "YEU", color: "#dc2626" },
                      ].map((item) => (
                        <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color }} />
                          <span style={{ fontSize: 13, width: 90 }}>{item.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{statsConduct.phanBoHanhKiem?.[item.key] ?? 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best/worst class */}
                  <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    {statsConduct.lopTotNhat && (
                      <div style={{ padding: "8px 16px", borderRadius: 8, background: "#dcfce7", fontSize: 13 }}>
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>Lớp tốt nhất: </span>
                        <span style={{ fontWeight: 700 }}>{statsConduct.lopTotNhat}</span>
                      </div>
                    )}
                    {statsConduct.lopYeuNhat && (
                      <div style={{ padding: "8px 16px", borderRadius: 8, background: "#fee2e2", fontSize: 13 }}>
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>Lớp cần cải thiện: </span>
                        <span style={{ fontWeight: 700 }}>{statsConduct.lopYeuNhat}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card users-table">
              <div className="table-header"><div><div className="panel-title">Thống kê hạnh kiểm</div><div className="panel-subtitle">Đánh giá hạnh kiểm học sinh</div></div></div>
              <div style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 48, color: "#1565c0", marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48 }}>verified_user</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Quản lý hạnh kiểm</div>
                <div style={{ fontSize: 13, color: "#6b7280", maxWidth: 400, margin: "0 auto" }}>
                  Dữ liệu hạnh kiểm được quản lý tại trang Hạnh kiểm. Sử dụng menu để truy cập.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB: SO SANH NAM (kept for comparison) === */}
      {!loading && activeTab === "compare" && (
        <>
          <div className="card users-toolbar">
            <div>
              <div className="users-title">Chọn năm học để so sánh</div>
              <div className="users-subtitle">Có thể chọn nhiều năm. Dữ liệu sẽ được tải khi chọn.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {years.map((y) => (
                <button key={y.id} type="button" onClick={() => toggleCompareYear(y.tenNamHoc)}
                  style={{
                    padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    border: compareYears.includes(y.tenNamHoc) ? "2px solid #1565c0" : "1px solid #d1d5db",
                    background: compareYears.includes(y.tenNamHoc) ? "#eff6ff" : "#fff",
                    color: compareYears.includes(y.tenNamHoc) ? "#1565c0" : "#374151"
                  }}>
                  {y.tenNamHoc}
                </button>
              ))}
            </div>
          </div>

          {comparisonStats.length > 0 && (
            <div className="card users-table">
              <div className="table-header"><div><div className="panel-title">So sánh các năm học</div><div className="panel-subtitle">Điểm trung bình và phân loại học lực</div></div></div>
              <div className="table-grid">
                <div className="table-row table-head">
                  <div style={{ width: 100 }}>Năm học</div>
                  <div style={{ width: 60, textAlign: "center" }}>Số điểm</div>
                  <div style={{ width: 60, textAlign: "center" }}>ĐTB</div>
                  <div style={{ flex: 1 }}>Phân bổ tỷ lệ</div>
                  <div style={{ width: 180, textAlign: "center" }}>Chi tiết</div>
                </div>
                {comparisonStats.map((cs) => (
                  <div key={cs.year} className="table-row" style={{ alignItems: "center" }}>
                    <div style={{ width: 100, fontWeight: 700, fontSize: 13 }}>{cs.year}</div>
                    <div style={{ width: 60, textAlign: "center", fontSize: 13 }}>{cs.count}</div>
                    <div style={{ width: 60, textAlign: "center", fontSize: 15, fontWeight: 700, color: classifyColor(cs.avg) }}>{cs.avg}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden", background: "#e5e7eb" }}>
                        {cs.gioiP > 0 && <div style={{ width: `${cs.gioiP}%`, background: "#16a34a" }} />}
                        {cs.khaP > 0 && <div style={{ width: `${cs.khaP}%`, background: "#2563eb" }} />}
                        {cs.tbP > 0 && <div style={{ width: `${cs.tbP}%`, background: "#ca8a04" }} />}
                        {cs.yeuP > 0 && <div style={{ width: `${cs.yeuP}%`, background: "#dc2626" }} />}
                      </div>
                    </div>
                    <div style={{ width: 180, display: "flex", gap: 4, justifyContent: "center" }}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 8, background: "#dcfce7", color: "#16a34a", fontWeight: 600 }}>G:{cs.gioi}</span>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 8, background: "#dbeafe", color: "#2563eb", fontWeight: 600 }}>K:{cs.kha}</span>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 8, background: "#fef9c3", color: "#ca8a04", fontWeight: 600 }}>TB:{cs.tb}</span>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 8, background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>Y:{cs.yeu}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comparisonStats.length === 0 && (
            <div className="card table-empty">Chọn năm học ở trên để so sánh.</div>
          )}
        </>
      )}
      {showPdfPreview && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: 24
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPdfPreview(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: 12, overflow: "hidden",
            width: "min(900px, 95vw)", height: "85vh",
            display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
          }}>
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: "1px solid #e5e7eb",
              background: "#1565c0"
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>picture_as_pdf</span>
                Xem trước báo cáo — {selectedYear}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handlePrintFromPreview}
                  style={{
                    padding: "6px 16px", background: "#fff", color: "#1565c0",
                    border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>print</span>
                  In ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  style={{
                    padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
            {/* iframe preview */}
            <iframe
              title="preview-pdf"
              srcDoc={pdfHtmlContent}
              style={{ flex: 1, border: "none", width: "100%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
