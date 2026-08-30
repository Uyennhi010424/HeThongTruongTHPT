import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getLop, syncSiSo } from "../../../api/lopApi.js";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getDiemAvgByGrade, getDiemDistribution } from "../../../api/diemApi.js";
import { notifyError } from "../../../utils/notify.js";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const GRADE_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626"];

const sortClasses = (a, b) => {
  const ga = Number(a?.khoi || 0);
  const gb = Number(b?.khoi || 0);
  if (ga !== gb) return ga - gb;
  return String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
    sensitivity: "base",
    numeric: true,
  });
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-white shadow-xl backdrop-blur-md transition-all">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
          <p className="text-sm font-semibold text-white/90">Xếp loại {data.label}</p>
        </div>
        <p className="text-lg font-bold text-white">
          {formatNumber(data.count)} <span className="text-sm font-normal text-white/70">Học sinh</span>
        </p>
        <p className="text-xs text-white/50 mt-0.5">Chiếm {data.pct}%</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-white shadow-xl backdrop-blur-md transition-all">
        <p className="mb-1 text-sm font-semibold text-white/90">{label}</p>
        <p className="text-lg font-bold text-primary-300">
          {payload[0].value} <span className="text-sm font-normal text-white/70">ĐTB</span>
        </p>
      </div>
    );
  }
  return null;
};


const TypewriterText = ({ text }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayText("");
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
};

const CountUp = ({ end, duration = 1500, decimals = 0, isNumber = true }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isNumber || isNaN(Number(end))) {
       setCount(end);
       return;
    }
    
    const target = Number(end);
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTimestamp = null;
    let animationFrameId = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(easeProgress * target);
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, isNumber]);

  if (!isNumber || isNaN(Number(end))) {
    return <span>{end}</span>;
  }

  const formatted = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(count);

  return <span>{formatted}</span>;
};

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Quản trị viên");
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
    homeroomByClassId: {},
    teacherNameById: {},
    siSoByLopId: {},
    blockAvg: [],
    distributionCounts: { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 },
    totalStudents: 0,
    grade10Students: 0,
    grade11Students: 0,
    grade12Students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState("");
  const chartDataRef = useRef([]); // prevents re-showing spinner when data already exists

  // Use simple boolean for default Recharts animation
  const barShouldAnimate = true;

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setAdminName(userObj.hoTen || userObj.username || "Quản trị viên");
      }
    } catch { }

    let cancelled = false;

    const fetchMain = async () => {
      try {
        setLoading(true);

        try {
          await withTimeout(syncSiSo(), 5000);
        } catch { /* ignore */ }

        const [gv, lop, namHocRes, chuNhiemRes] = await Promise.all([
          getGiaoVien().catch(() => ({ data: { data: [] } })),
          getLop().catch(() => ({ data: { data: [] } })),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          getChuNhiem().catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;

        const teachersArr = gv?.data?.data || [];
        const allClassesArr = lop?.data?.data || [];
        const homeroomArr = chuNhiemRes?.data?.data || [];

        const namHocArrRaw = namHocRes?.data?.data || [];
        const activeNamHocObj = namHocArrRaw.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO");
        const activeNamHoc = activeNamHocObj ? activeNamHocObj.tenNamHoc : null;

        const classesArr = activeNamHoc ? allClassesArr.filter(c => c.namHoc === activeNamHoc) : allClassesArr;

        const namHocArr = namHocArrRaw
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

        const g10Classes = classesArr.filter((c) => String(c.khoi) === "10");
        const g11Classes = classesArr.filter((c) => String(c.khoi) === "11");
        const g12Classes = classesArr.filter((c) => String(c.khoi) === "12");

        const grade10Students = g10Classes.reduce((acc, c) => acc + (c.siSo || 0), 0);
        const grade11Students = g11Classes.reduce((acc, c) => acc + (c.siSo || 0), 0);
        const grade12Students = g12Classes.reduce((acc, c) => acc + (c.siSo || 0), 0);

        const siSoByLopId = classesArr.reduce((acc, item) => {
          acc[String(item.id)] = item.siSo || 0;
          return acc;
        }, {});

        if (cancelled) return;

        setStats({
          students: totalStudentCount,
          teachers: teachersArr.length,
          classes: classesArr.length,
          grade10: g10Classes.length,
          grade11: g11Classes.length,
          grade12: g12Classes.length,
          avgScore: null,
        });

        setDashboardData((prev) => ({
          ...prev,
          classes: classesArr,
          teachers: teachersArr,
          homeroomByClassId,
          teacherNameById,
          siSoByLopId,
          grade10Students,
          grade11Students,
          grade12Students,
        }));

        setLoading(false);

        // Now fetch chart data — only show spinner if we don't have data yet
        if (chartDataRef.current.length === 0) {
          setChartLoading(true);
        }
        const [avgRes, distRes] = await Promise.all([
          withTimeout(getDiemAvgByGrade({ namHoc: activeNamHoc }), 30000).catch(() => ({ data: { data: [] } })),
          withTimeout(getDiemDistribution({ namHoc: activeNamHoc }), 120000).catch(() => ({ data: { data: { counts: {}, total: 0, avgScore: null } } })),
        ]);

        if (cancelled) return;

        const avgByGrade = avgRes?.data?.data || [];
        const dist = distRes?.data?.data || {};

        const blockAvg = avgByGrade.map((item) => ({
          name: `Khối ${item.khoi}`,
          value: item.avgScore != null ? Number(item.avgScore) : null,
          count: item.studentCount || 0,
        }));

        const distributionCounts = dist.counts || { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 };

        if (cancelled) return;

        chartDataRef.current = blockAvg;
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

      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Không thể tải thống kê.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setChartLoading(false);
        }
      }
    };

    fetchMain();

    const handleSoftRefresh = () => { fetchMain(); };
    window.addEventListener("httt_refresh_dashboard", handleSoftRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("httt_refresh_dashboard", handleSoftRefresh);
    };
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

  return (
    <div className="space-y-6 pb-12 bg-[#f8fafc] min-h-screen text-slate-900 font-sans">

      {/* 2. Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
            <TypewriterText text={`Chào mừng trở lại, ${adminName}`} />
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Cập nhật dữ liệu mới nhất của trường hôm nay</p>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-100 px-6 py-4 text-sm font-semibold text-red-700">{error}</p>
      )}

      {/* 3. Dãy thống kê đầu trang (4 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Tổng học sinh", value: stats.students, desc: "Tăng so với năm trước", color: "blue", icon: "school", trend: "12%", isLoading: loading },
          { label: "Tổng giáo viên", value: stats.teachers, desc: "Đang giảng dạy", color: "green", icon: "badge", trend: "4%", isLoading: loading },
          { label: "Tổng lớp học", value: stats.classes, desc: "Khối 10, 11 và 12", color: "purple", icon: "meeting_room", trend: "2%", isLoading: loading },
          { label: "Điểm trung bình", value: stats.avgScore || "Chưa có", desc: "Toàn trường", color: "orange", icon: "insights", trend: "8%", isLoading: chartLoading },
        ].map((card, i) => {
          const bgColors = { blue: "bg-blue-100 text-blue-600", green: "bg-green-100 text-green-600", purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600" };
          return (
            <div key={i} className="group flex flex-col justify-center rounded-[24px] bg-white p-6 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-[120px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColors[card.color]} transition-transform duration-300 group-hover:scale-110`}>
                    <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                    <div className="h-8 flex items-center mt-1">
                      {card.isLoading ? (
                        <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${bgColors[card.color].split(' ')[1]}`}></div>
                      ) : (
                        <h4 className="text-2xl font-extrabold text-blue-900 tracking-tight"><CountUp end={card.value} isNumber={!isNaN(Number(card.value))} decimals={card.label === "Điểm trung bình" && !isNaN(Number(card.value)) ? 2 : 0} /></h4>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Biểu đồ */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Bar Chart (70%) */}
        <div className="lg:w-[70%] h-[420px] rounded-[24px] bg-white border border-slate-200 shadow-sm p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-900">Điểm trung bình theo khối (Năm học hiện tại)</h3>
          </div>
          <div className="flex-1 w-full relative">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
              </div>
            ) : dashboardData.blockAvg.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">Chưa có dữ liệu điểm</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.blockAvg} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#94a3b8", fontWeight: 600 }} domain={[0, 10]} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "transparent" }} />
                    <Bar dataKey="value" maxBarSize={60} radius={[6, 6, 0, 0]} isAnimationActive={barShouldAnimate} animationDuration={800} label={{ position: 'top', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                      {dashboardData.blockAvg.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#2563eb" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

        {/* Pie Chart (30%) */}
        <div className="lg:w-[30%] h-[420px] rounded-[24px] bg-white border border-slate-200 shadow-sm p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-900">Xếp loại học lực (Cả năm)</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative">
            {chartLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
            ) : dashboardData.totalStudents === 0 ? (
              <div className="text-slate-400 text-sm font-semibold">Chưa có dữ liệu</div>
            ) : (
              <>
                <div className="h-[200px] w-full relative flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng học sinh</p>
                    <p className="text-3xl font-black text-slate-900 leading-tight"><CountUp end={dashboardData.totalStudents} /></p>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="label"
                        stroke="none"
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} cursor={{ fill: 'transparent' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="w-full mt-6 flex flex-col gap-3 px-2">
                  {gradeDistribution.map((d) => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-bold text-slate-700">{d.label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 font-semibold">{formatNumber(d.count)}</span>
                        <span className="text-sm font-bold text-slate-900 w-8 text-right">{d.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* 7. Phần dưới (3 cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Lớp học gần đây */}
        <div className="rounded-[24px] bg-white border border-slate-200 shadow-sm p-6 flex flex-col h-[340px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-900">Lớp học gần đây</h3>
            <Link to="/admin/lop" className="text-[#2563eb] text-sm font-bold hover:underline">Xem tất cả</Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            <RecentClassesList
              classes={dashboardData.classes}
              siSoByLopId={dashboardData.siSoByLopId}
              homeroomByClassId={dashboardData.homeroomByClassId}
              teacherNameById={dashboardData.teacherNameById}
              loading={loading}
            />
          </div>
        </div>

        {/* Card 2: Thông báo mới */}
        <div className="rounded-[24px] bg-white border border-slate-200 shadow-sm p-6 flex flex-col h-[340px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-900">Thông báo mới</h3>
            <button className="text-[#2563eb] text-sm font-bold hover:underline">Thêm</button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { icon: "campaign", title: "Họp hội đồng sư phạm tháng 11", time: "2 giờ trước", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: "event", title: "Lịch thi học kì 1 khối 12", time: "5 giờ trước", color: "text-orange-600", bg: "bg-orange-50" },
              { icon: "school", title: "Cập nhật danh sách đội tuyển HSG", time: "1 ngày trước", color: "text-green-600", bg: "bg-green-50" },
              { icon: "warning", title: "Bảo trì hệ thống điểm điện tử", time: "2 ngày trước", color: "text-red-600", bg: "bg-red-50" }
            ].map((n, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${n.bg} ${n.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Giáo viên mới */}
        <div className="rounded-[24px] bg-white border border-slate-200 shadow-sm p-6 flex flex-col h-[340px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-900">Giáo viên mới</h3>
            <Link to="/admin/giaovien" className="text-[#2563eb] text-sm font-bold hover:underline">Quản lý</Link>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div></div>
            ) : dashboardData.teachers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400 font-semibold">Chưa có giáo viên</div>
            ) : (
              dashboardData.teachers.slice(0, 4).map((gv, i) => (
                <div key={gv.id || i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(gv.hoTen || "GV")}&background=random&color=fff`} alt={gv.hoTen} className="w-10 h-10 rounded-full shadow-sm shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{gv.hoTen}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{gv.monHoc?.tenMonHoc || "Giáo viên bộ môn"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function RecentClassesList({ classes = [], siSoByLopId = {}, homeroomByClassId = {}, teacherNameById = {}, loading = false }) {
  const rows = useMemo(() => {
    const sorted = (classes || []).slice().sort(sortClasses);
    const grade10 = sorted.filter(c => c.khoi === 10).slice(0, 2);
    const grade11 = sorted.filter(c => c.khoi === 11).slice(0, 2);
    const grade12 = sorted.filter(c => c.khoi === 12).slice(0, 1);
    const combined = [...grade10, ...grade11, ...grade12];

    return combined.map((item) => {
      return {
        id: item.id,
        lop: item.tenLop || "--",
        siSo: siSoByLopId[String(item.id)] ?? item.siSo ?? 0,
        gvcn: teacherNameById[String(homeroomByClassId[String(item.id)] || "")] || "Chưa có GVCN",
      };
    });
  }, [classes, siSoByLopId, homeroomByClassId, teacherNameById]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (rows.length === 0) return (
    <div className="flex items-center justify-center h-full text-sm text-slate-400 font-semibold">Chưa có lớp học</div>
  );

  return (
    <>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group/item">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex shrink-0 items-center justify-center transition-transform duration-300 group-hover/item:scale-110">
              <span className="material-symbols-outlined text-[20px]">class</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{r.lop}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{r.gvcn}</p>
            </div>
          </div>
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
            {r.siSo} HS
          </div>
        </div>
      ))}
    </>
  );
}


