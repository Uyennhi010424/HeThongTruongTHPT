import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { FileText, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getDiemSummary, getDiemDistribution } from "../../../api/diemApi.js";
import { getStatisticsOverview, getStatisticsAcademic } from "../../../api/statisticsApi.js";
import statisticsApi from "../../../api/statisticsApi.js";
import { notifyError } from "../../../utils/notify.js";
import PdfPreviewModal from "../../../components/common/PdfPreviewModal.jsx";
import { getVisibleAcademicYears, getActiveAcademicYear } from "../../../utils/helpers.js";

/* -- Helpers -------------------------------------------------------- */
const classifyColor = (avg) => {
  if (avg == null) return "#9ca3af";
  if (avg >= 8) return "#16a34a"; // Tốt
  if (avg >= 6.5) return "#2563eb"; // Khá
  if (avg >= 5) return "#ca8a04"; // Đạt
  return "#dc2626"; // Chưa đạt
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
  const [activeTab, setActiveTab] = useState("academic");
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allScores, setAllScores] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("0");
  const [selectedKhoi, setSelectedKhoi] = useState("0");

  const [statsOverview, setStatsOverview] = useState(null);
  const [statsAcademic, setStatsAcademic] = useState(null);
  const [statsConduct, setStatsConduct] = useState(null);
  const [statsAttendance, setStatsAttendance] = useState(null);
  const [statsDistribution, setStatsDistribution] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfHtmlContent, setPdfHtmlContent] = useState("");

  const renderCardValue = (value) => {
    if (statsLoading) {
      return (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin my-1" />
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
        const visibleYears = getVisibleAcademicYears(yData);
        setYears(visibleYears);
        setClasses((cRes?.data?.data || []).sort(sortByClass));
        const rawSubjects = sRes?.data?.data || [];
        const filteredSubjects = rawSubjects.filter(s => {
          const name = (s.tenMon || "").toLowerCase();
          return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
        });
        setSubjects(filteredSubjects);
        setStudents(stRes?.data?.data || []);
        setTeachers(tRes?.data?.data || []);
        const current = getActiveAcademicYear(visibleYears) || visibleYears[0];
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
          }).catch(err => console.error("Overview error:", err)),

          getStatisticsAcademic({ namHoc: selectedYear, ...(selectedKhoi !== "0" ? { khoi: Number(selectedKhoi) } : {}) }).then(res => {
            if (active) setStatsAcademic(res?.data?.data || null);
          }).catch(err => console.error("Academic error:", err)),

          statisticsApi.getConduct(selectedYear, selectedHocKy).then(res => {
            if (active) setStatsConduct(res?.data?.data || null);
          }).catch(err => console.error("Conduct error:", err)),

          (() => {
            const currentYearObj = years.find((y) => y.tenNamHoc === selectedYear);
            let fromDate = null;
            let toDate = null;
            if (currentYearObj) {
              if (selectedHocKy === "1") {
                fromDate = currentYearObj.ngayBatDauHk1;
                toDate = currentYearObj.ngayKetThucHk1;
              } else if (selectedHocKy === "2") {
                fromDate = currentYearObj.ngayBatDauHk2;
                toDate = currentYearObj.ngayKetThucHk2;
              }
            }
            const params = { namHoc: selectedYear };
            if (fromDate) params.from = fromDate;
            if (toDate) params.to = toDate;
            return statisticsApi.getAttendance(params).then(res => {
              if (active) setStatsAttendance(res?.data?.data || null);
            });
          })().catch(err => console.error("Attendance error:", err)),

          getDiemDistribution({
            namHoc: selectedYear,
            hocKy: Number(selectedHocKy),
            ...(selectedKhoi !== "0" ? { khoi: Number(selectedKhoi) } : {})
          }).then(res => {
            if (active) setStatsDistribution(res?.data?.data || null);
          }).catch(err => console.error("Distribution error:", err))
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

  const filteredScores = useMemo(() => {
    let list = allScores;
    if (selectedKhoi !== "0") {
      const targetKhoi = Number(selectedKhoi);
      list = list.filter((s) => Number(s?.khoi) === targetKhoi);
    }
    return list;
  }, [allScores, selectedKhoi]);

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
  }, [filteredScores, subjectMap]);

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
        topStudents: statsAcademic?.topStudents || [],
      };
    }

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
        topStudents: statsAcademic.topStudents || [],
      };
    }

    return {
      overallAvg: 0, total: 0, gioi: 0, kha: 0, tb: 0, yeu: 0,
      gioiP: 0, khaP: 0, tbP: 0, yeuP: 0, topStudents: [],
    };
  }, [statsDistribution, statsAcademic, selectedHocKy]);

  const topStudentsList = useMemo(() => {
    if (!academicData?.topStudents) return [];
    return [...academicData.topStudents].slice(0, 10);
  }, [academicData.topStudents]);

  const pieData = [
    { name: "Tốt", value: academicData.gioi, color: "#16a34a" },
    { name: "Khá", value: academicData.kha, color: "#2563eb" },
    { name: "Đạt", value: academicData.tb, color: "#ca8a04" },
    { name: "Chưa đạt", value: academicData.yeu, color: "#dc2626" },
  ];

  const lineData = subjectStats.filter(m => m.nhomDanhGia === "DIEM_SO").map(m => ({
    name: m.tenMon,
    avg: m.avg ?? 0
  }));

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

  const conductData = useMemo(() => {
    if (!statsConduct?.phanBoHanhKiem) return { tot: 0, kha: 0, tb: 0, yeu: 0, total: 0 };
    const { TOT, KHA, TRUNG_BINH, YEU } = statsConduct.phanBoHanhKiem;
    const tot = TOT || 0;
    const kha = KHA || 0;
    const tb = TRUNG_BINH || 0;
    const yeu = YEU || 0;
    const total = tot + kha + tb + yeu || 1;
    return { tot, kha, tb, yeu, total, lopTot: statsConduct.lopTotNhat, lopYeu: statsConduct.lopYeuNhat };
  }, [statsConduct]);
  
  const conductPieData = useMemo(() => [
    { name: "Tốt", value: conductData.tot, color: "#16a34a" },
    { name: "Khá", value: conductData.kha, color: "#2563eb" },
    { name: "Trung bình", value: conductData.tb, color: "#ca8a04" },
    { name: "Yếu", value: conductData.yeu, color: "#dc2626" },
  ].filter(d => d.value > 0), [conductData]);

  const tabs = [
    { key: "academic", label: "Học lực", icon: "school" },
    { key: "attendance", label: "Chuyên cần", icon: "event_available" },
    { key: "conduct", label: "Hạnh kiểm", icon: "verified_user" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <PageHeader title="Báo cáo & Thống kê" />

      <div className="p-6 flex-1 max-w-7xl mx-auto w-full">

        {/* TABS */}
        <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* BỘ LỌC */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none focus:border-blue-500 shadow-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y.id} value={y.tenNamHoc}>
                {y.tenNamHoc}
              </option>
            ))}
          </select>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none focus:border-blue-500 shadow-sm"
            value={selectedHocKy}
            onChange={(e) => setSelectedHocKy(e.target.value)}
          >
            <option value="0">Cả năm</option>
            <option value="1">Học kỳ I</option>
            <option value="2">Học kỳ II</option>
          </select>
          {activeTab === "academic" && (
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white outline-none focus:border-blue-500 shadow-sm"
              value={selectedKhoi}
              onChange={(e) => setSelectedKhoi(e.target.value)}
            >
              <option value="0">Tất cả Khối</option>
              <option value="10">Khối 10</option>
              <option value="11">Khối 11</option>
              <option value="12">Khối 12</option>
            </select>
          )}

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            onClick={handlePreviewPdf}
          >
            <FileText className="w-4 h-4" /> Xuất PDF
          </button>
        </div>

        {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}

        {/* KPI CARDS */}
        {activeTab === "academic" && (
          <div className="bg-white rounded-xl border border-slate-100 border-t-[3px] border-t-blue-600 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] mb-8 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
            {[
              { label: "Tổng số Giáo viên", value: renderCardValue(overviewStats.totalTeachers) },
              { label: "Tổng số Học sinh", value: renderCardValue(overviewStats.activeStudents) },
              { label: "Tổng số Lớp học", value: renderCardValue(overviewStats.totalClasses) },
              { label: "ĐTB toàn trường", value: renderCardValue(academicData.overallAvg) },
            ].map((k, i) => (
              <div key={i} className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">{k.label}</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{k.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* CHARTS */}
        {activeTab === "academic" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Doughnut Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">Phân loại học lực</h3>
              <div className="flex-1 min-h-[280px] flex items-center justify-center relative">
                {statsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-slate-500 text-sm font-medium">Đang tính toán...</span>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                      <span className="text-3xl font-bold text-slate-800">{academicData.total}</span>
                      <span className="text-xs text-slate-500 font-medium">Học sinh</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={85}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [`${value} HS`, name]}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-6 flex-wrap">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: entry.color }}></span>
                    <span className="text-sm font-medium text-slate-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-blue-900 mb-6 uppercase tracking-wide">ĐTB Theo môn học</h3>
              <div className="flex-1 min-h-[280px]">
                {statsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="text-slate-500 text-sm font-medium">Đang tải biểu đồ...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={5} />
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                        formatter={(value) => [value, 'ĐTB']}
                      />
                      <Line type="monotone" dataKey="avg" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TOP STUDENTS TABLE (Only Academic) */}
        {activeTab === "academic" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Top 10 học sinh xuất sắc nhất</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-center w-16">STT</th>
                    <th className="px-6 py-4">Học sinh</th>
                    <th className="px-6 py-4 text-center">Lớp</th>
                    <th className="px-6 py-4 text-center">ĐTB</th>
                    <th className="px-6 py-4 w-[35%]">Mức độ hoàn thành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStudentsList.length > 0 ? topStudentsList.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-center font-medium">{i + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{s.hoTen}</td>
                      <td className="px-6 py-4 text-center text-slate-500">{s.tenLop}</td>
                      <td className="px-6 py-4 text-center font-bold text-[15px]" style={{ color: classifyColor(s.diemTB) }}>{s.diemTB ?? "--"}</td>
                      <td className="px-6 py-4">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(s.diemTB / 10) * 100}%`, backgroundColor: classifyColor(s.diemTB) }}></div>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Không có dữ liệu đánh giá học sinh</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHUYÊN CẦN */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 border-t-[3px] border-t-blue-600 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Tổng lượt nghỉ</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{statsAttendance?.tongNgayVang ?? "--"}</div>
              </div>
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Tỷ lệ vắng trung bình</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{statsAttendance?.tyLeVang ?? "--"}%</div>
              </div>
            </div>

            {statsAttendance?.theoLop?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Chuyên cần theo lớp</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Lớp</th>
                        <th className="px-6 py-4 text-center">Sĩ số</th>
                        <th className="px-6 py-4 text-center">Tổng vắng</th>
                        <th className="px-6 py-4 text-center">Có phép</th>
                        <th className="px-6 py-4 text-center">Không phép</th>
                        <th className="px-6 py-4 text-center">Tỷ lệ vắng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statsAttendance.theoLop.map((lop, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{lop.tenLop}</td>
                          <td className="px-6 py-4 text-center">{lop.siSo}</td>
                          <td className="px-6 py-4 text-center font-bold text-red-600">{lop.tongVang}</td>
                          <td className="px-6 py-4 text-center text-amber-500 font-medium">{lop.coPhep}</td>
                          <td className="px-6 py-4 text-center text-red-500 font-medium">{lop.khongPhep}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${lop.tyLeVang > 10 ? "bg-red-100 text-red-700" : lop.tyLeVang > 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {lop.tyLeVang}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HẠNH KIỂM */}
        {activeTab === "conduct" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 border-t-[3px] border-t-blue-600 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 overflow-hidden">
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Tổng HS được đánh giá</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{statsConduct ? conductData.total : "--"}</div>
              </div>
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Tỷ lệ Hạnh kiểm Tốt</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{statsConduct ? Math.round((conductData.tot / conductData.total) * 100) + "%" : "--"}</div>
              </div>
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Lớp xuất sắc nhất</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{conductData.lopTot || "--"}</div>
              </div>
              <div className="flex-1 px-6 py-5 flex flex-col justify-center items-start hover:bg-slate-50/50 transition-colors cursor-default">
                <div className="text-[13px] font-medium text-slate-500 mb-1">Lớp cần lưu ý</div>
                <div className="text-[36px] font-bold text-slate-800 leading-none">{conductData.lopYeu || "--"}</div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-blue-900 mb-2 uppercase tracking-wide">Phân loại hạnh kiểm</h3>
                <div className="flex-1 min-h-[280px] flex items-center justify-center relative">
                  {statsLoading ? (
                    <span className="text-slate-400 text-sm">Đang tính toán...</span>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
                        <span className="text-3xl font-bold text-slate-800">{conductData.total}</span>
                        <span className="text-xs text-slate-500 font-medium">Học sinh</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={conductPieData}
                            cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value"
                            stroke="none"
                          >
                            {conductPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => [`${value} học sinh`, 'Số lượng']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-6">
                  {conductPieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium text-slate-700">{item.name} ({Math.round(item.value / conductData.total * 100)}%)</span>
                    </div>
                  ))}
                </div>

                {/* Danh sách các lớp */}
                {statsConduct?.theoLop && statsConduct.theoLop.length > 0 && (
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h4 className="text-[13px] font-bold text-slate-500 mb-4 uppercase tracking-wide">Chi tiết theo lớp</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {statsConduct.theoLop.map((lop, idx) => (
                        <div key={idx} className="flex items-center p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors bg-slate-50/30">
                          <span className="font-bold text-slate-800 w-14 text-sm">{lop.tenLop}</span>
                          <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            {lop.tot > 0 && <span className="text-green-600 font-semibold"><span className="text-slate-500 font-normal">Tốt:</span> {lop.tot}</span>}
                            {lop.kha > 0 && <span className="text-blue-600 font-semibold"><span className="text-slate-500 font-normal">Khá:</span> {lop.kha}</span>}
                            {lop.trungBinh > 0 && <span className="text-yellow-600 font-semibold"><span className="text-slate-500 font-normal">TB:</span> {lop.trungBinh}</span>}
                            {lop.yeu > 0 && <span className="text-red-600 font-semibold"><span className="text-slate-500 font-normal">Yếu:</span> {lop.yeu}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        htmlContent={pdfHtmlContent}
      />
    </div>
  );
}
