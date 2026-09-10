import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getLop, syncSiSo } from "../../../api/lopApi.js";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getDiemAvgByGrade, getDiemDistribution, getDiemSummary, getDiemSubjectAvg } from "../../../api/diemApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import statisticsApi, { getStatisticsAcademic } from "../../../api/statisticsApi.js";
import { notifyError } from "../../../utils/notify.js";
import {
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  BarChart,
  LineChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);

const GRADE_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626"];

const classifyColor = (avg) => {
  if (avg == null) return "#9ca3af";
  if (avg >= 8) return "#16a34a";
  if (avg >= 6.5) return "#2563eb";
  if (avg >= 5) return "#ca8a04";
  return "#dc2626";
};

const getClassifyLabel = (avg) => {
  if (avg == null) return "--";
  if (avg >= 8) return "Tốt";
  if (avg >= 6.5) return "Khá";
  if (avg >= 5) return "Đạt";
  return "Chưa đạt";
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

const formatShortSubjectName = (rawName) => {
  if (!rawName) return "--";
  const str = rawName.trim();
  const lower = str.toLowerCase();
  if (lower.includes("kinh tế") && lower.includes("pháp luật")) return "GDKT & PL";
  if (lower.includes("quốc phòng")) return "GDQP - AN";
  if (lower.includes("thể chất")) return "GD Thể chất";
  if (lower.includes("công dân")) return "GDCD";
  if (lower.includes("hoạt động trải nghiệm")) return "HĐTN, HN";
  return str;
};

const CustomSubjectTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    const title = data?.fullName || label;
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-white shadow-xl backdrop-blur-md transition-all">
        <p className="mb-1 text-xs font-semibold text-white/90">{title}</p>
        <p className="text-base font-bold text-primary-300">
          {payload[0].value} <span className="text-xs font-normal text-white/70">ĐTB</span>
        </p>
        {data?.count ? (
          <p className="text-[11px] text-white/60 mt-0.5">{formatNumber(data.count)} học sinh</p>
        ) : null}
      </div>
    );
  }
  return null;
};

const CustomConductTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-white shadow-xl backdrop-blur-md transition-all">
        <p className="mb-1 text-xs font-semibold text-white/70">Xếp loại {label}</p>
        <p className="text-base font-bold text-white">
          {formatNumber(payload[0].value)} <span className="text-xs font-normal text-white/70">Học sinh</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomScoreRangeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-white shadow-xl backdrop-blur-md transition-all">
        <p className="mb-1 text-xs font-semibold text-white/70">Thang điểm {label}</p>
        <p className="text-base font-bold text-white">
          {formatNumber(payload[0].value)} <span className="text-xs font-normal text-white/70">Học sinh</span>
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
    maximumFractionDigits: decimals,
  }).format(count);

  return <span>{formatted}</span>;
};

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Quản trị viên");
  const [schoolYears, setSchoolYears] = useState([]);
  const [activeYear, setActiveYear] = useState("");
  const [allRawClasses, setAllRawClasses] = useState([]);
  const [allRawTeachers, setAllRawTeachers] = useState([]);
  const [allRawHomeroom, setAllRawHomeroom] = useState([]);
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
  const chartDataRef = useRef([]);

  // States for 3 bottom charts
  const [bottomHocKy, setBottomHocKy] = useState("0"); // "0": Cả năm, "1": Học kỳ 1, "2": Học kỳ 2
  const [rawSubjects, setRawSubjects] = useState([]);
  const [bottomScores, setBottomScores] = useState([]);
  const [bottomConduct, setBottomConduct] = useState(null);
  const [bottomDistribution, setBottomDistribution] = useState(null);
  const [bottomChartsLoading, setBottomChartsLoading] = useState(true);
  const scoresCacheRef = useRef({});
  const conductCacheRef = useRef({});
  const distCacheRef = useRef({});

  // States for Top 10 Students
  const [topStudents, setTopStudents] = useState([]);
  const [topStudentsLoading, setTopStudentsLoading] = useState(true);
  const [topStudentsKhoi, setTopStudentsKhoi] = useState("0"); // "0": Tất cả khối, "10", "11", "12"
  const topStudentsCacheRef = useRef({});

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

        // Run syncSiSo in background without blocking initial rendering
        syncSiSo().catch(() => {});

        const [gv, lop, namHocRes, chuNhiemRes, subRes] = await Promise.all([
          getGiaoVien().catch(() => ({ data: { data: [] } })),
          getLop().catch(() => ({ data: { data: [] } })),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          getChuNhiem().catch(() => ({ data: { data: [] } })),
          getMonHoc().catch(() => ({ data: { data: [] } })),
        ]);
        if (cancelled) return;

        const teachersArr = gv?.data?.data || [];
        const allClassesArr = lop?.data?.data || [];
        const homeroomArr = chuNhiemRes?.data?.data || [];
        const subjectsArr = subRes?.data?.data || [];

        setAllRawClasses(allClassesArr);
        setAllRawTeachers(teachersArr);
        setAllRawHomeroom(homeroomArr);
        setRawSubjects(subjectsArr);

        const namHocArrRaw = namHocRes?.data?.data || [];
        const activeNamHocObj = namHocArrRaw.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || namHocArrRaw[0] || null;
        const activeNamHoc = activeNamHocObj ? activeNamHocObj.tenNamHoc : "2025-2026";
        setActiveYear(activeNamHoc);

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

        classesArr.forEach((c) => {
          if (c?.id != null && (c.gvcn?.id || c.gvcnId)) {
            homeroomByClassId[String(c.id)] = c.gvcn?.id || c.gvcnId;
          }
        });

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

        setStats((prev) => ({
          ...prev,
          students: totalStudentCount,
          teachers: teachersArr.length,
          classes: classesArr.length,
          grade10: g10Classes.length,
          grade11: g11Classes.length,
          grade12: g12Classes.length,
        }));

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

        // Fetch top chart data in background without blocking main dashboard
        if (chartDataRef.current.length === 0) {
          setChartLoading(true);
        }
        Promise.all([
          withTimeout(getDiemAvgByGrade({ namHoc: activeNamHoc }), 10000).catch(() => ({ data: { data: [] } })),
          withTimeout(getDiemDistribution({ namHoc: activeNamHoc }), 15000).catch(() => ({ data: { data: { counts: {}, total: 0, avgScore: null } } })),
        ]).then(([avgRes, distRes]) => {
          if (cancelled) return;
          const avgByGrade = avgRes?.data?.data || [];
          const dist = distRes?.data?.data || {};

          const blockAvg = avgByGrade.map((item) => ({
            name: `Khối ${item.khoi}`,
            value: item.avgScore != null ? Number(item.avgScore) : null,
            count: item.studentCount || 0,
          }));

          const distributionCounts = dist.counts || { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 };
          const scoreRanges = dist.scoreRanges || null;

          chartDataRef.current = blockAvg;
          setDashboardData((prev) => ({
            ...prev,
            blockAvg,
            distributionCounts,
            scoreRanges,
            totalStudents: dist.total || 0,
          }));

          setStats((prev) => ({
            ...prev,
            avgScore: dist.avgScore ?? null,
          }));
          setChartLoading(false);
        }).catch(() => {
          if (!cancelled) setChartLoading(false);
        });

      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Không thể tải thống kê.");
      } finally {
        if (!cancelled) {
          setLoading(false);
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

  // Effect to load bottom 3 charts whenever activeYear or bottomHocKy changes
  useEffect(() => {
    if (!activeYear) return;
    let cancelled = false;
    const cacheKey = `${activeYear}_${bottomHocKy}`;

    // Instant render from cache if available
    if (scoresCacheRef.current[cacheKey] && conductCacheRef.current[cacheKey]) {
      setBottomScores(scoresCacheRef.current[cacheKey]);
      setBottomConduct(conductCacheRef.current[cacheKey]);
      setBottomDistribution(distCacheRef.current[cacheKey] || null);
      setBottomChartsLoading(false);
    } else {
      setBottomChartsLoading(true);
    }

    const fetchBottomCharts = async () => {
      try {
        const scoreParams = { namHoc: activeYear };
        if (bottomHocKy !== "0") scoreParams.hocKy = Number(bottomHocKy);

        const [subjectAvgRes, conductRes, distRes] = await Promise.all([
          withTimeout(getDiemSubjectAvg(scoreParams), 15000).catch(() => ({ data: { data: [] } })),
          withTimeout(statisticsApi.getConduct(activeYear, bottomHocKy), 30000).catch(() => ({ data: { data: null } })),
          withTimeout(getDiemDistribution(scoreParams), 15000).catch(() => ({ data: { data: null } })),
        ]);

        if (cancelled) return;
        const sData = subjectAvgRes?.data?.data !== undefined ? subjectAvgRes?.data?.data : (subjectAvgRes?.data || []);
        let cData = conductRes?.data?.data !== undefined ? conductRes?.data?.data : (conductRes?.data || null);
        const dData = distRes?.data?.data !== undefined ? distRes?.data?.data : (distRes?.data || null);

        // Fallback: If conduct statistics API returned empty or 0s, calculate directly from raw hanh kiem list
        const pbCheck = cData?.phanBoHanhKiem || {};
        const totalCount = Object.values(pbCheck).reduce((a, b) => Number(a || 0) + Number(b || 0), 0);
        if (!cData || totalCount === 0) {
          try {
            const rawHkRes = await withTimeout(getHanhKiem(), 10000);
            const rawHkList = rawHkRes?.data?.data || rawHkRes?.data || [];
            if (Array.isArray(rawHkList) && rawHkList.length > 0) {
              const pb = { TOT: 0, KHA: 0, TRUNG_BINH: 0, YEU: 0 };
              const cleanY = (activeYear || "").replace(/\s+/g, "");
              const termNum = bottomHocKy !== "0" ? Number(bottomHocKy) : 0;

              const studentHkMap = {};
              rawHkList.forEach((hk) => {
                const hkYear = (hk?.namHoc?.tenNamHoc || "").replace(/\s+/g, "");
                if (cleanY && hkYear && hkYear !== cleanY) return;
                const hkHocKy = hk?.hocKy ?? hk?.hoc_ky;
                if (termNum !== 0 && hkHocKy !== termNum) return;

                const sId = hk?.hocSinh?.id ?? hk?.idHocSinh;
                if (!sId) return;
                const existing = studentHkMap[sId];
                if (!existing || (hkHocKy && existing.hocKy && hkHocKy >= existing.hocKy)) {
                  studentHkMap[sId] = hk;
                }
              });

              Object.values(studentHkMap).forEach((hk) => {
                const xl = String(hk.xepLoai || "").toUpperCase();
                if (xl.includes("TOT") || xl.includes("TỐT")) pb.TOT++;
                else if (xl.includes("KHA") || xl.includes("KHÁ")) pb.KHA++;
                else if (xl.includes("TRUNG_BINH") || xl.includes("TRUNG BÌNH") || xl.includes("DAT") || xl.includes("ĐẠT")) pb.TRUNG_BINH++;
                else if (xl.includes("YEU") || xl.includes("YẾU") || xl.includes("CHUA_DAT") || xl.includes("CHƯA ĐẠT")) pb.YEU++;
              });

              if (Object.values(pb).some((v) => v > 0)) {
                cData = { phanBoHanhKiem: pb };
              }
            }
          } catch { /* ignore fallback error */ }
        }

        const validScores = Array.isArray(sData) ? sData : [];
        scoresCacheRef.current[cacheKey] = validScores;
        conductCacheRef.current[cacheKey] = cData;
        distCacheRef.current[cacheKey] = dData;

        setBottomScores(validScores);
        setBottomConduct(cData);
        setBottomDistribution(dData);
      } catch (err) {
        console.error("Error loading bottom charts data:", err);
      } finally {
        if (!cancelled) setBottomChartsLoading(false);
      }
    };

    fetchBottomCharts();

    return () => { cancelled = true; };
  }, [activeYear, bottomHocKy]);

  // Effect to load Top 10 Students whenever activeYear or topStudentsKhoi changes
  useEffect(() => {
    if (!activeYear) return;
    let cancelled = false;
    const cacheKey = `${activeYear}_${topStudentsKhoi}`;

    if (topStudentsCacheRef.current[cacheKey]) {
      setTopStudents(topStudentsCacheRef.current[cacheKey]);
      setTopStudentsLoading(false);
    } else {
      setTopStudentsLoading(true);
    }

    const fetchTopStudents = async () => {
      try {
        const params = { namHoc: activeYear };
        if (topStudentsKhoi !== "0") {
          params.khoi = Number(topStudentsKhoi);
        }
        const res = await withTimeout(getStatisticsAcademic(params), 15000);
        if (cancelled) return;
        const data = res?.data?.data?.topStudents || [];
        topStudentsCacheRef.current[cacheKey] = data;
        setTopStudents(data);
      } catch (err) {
        console.error("Error loading top students:", err);
        if (!cancelled) setTopStudents([]);
      } finally {
        if (!cancelled) setTopStudentsLoading(false);
      }
    };

    fetchTopStudents();

    return () => {
      cancelled = true;
    };
  }, [activeYear, topStudentsKhoi]);

  const handleYearChange = async (targetYear) => {
    setActiveYear(targetYear);
    const classesArr = targetYear ? allRawClasses.filter(c => c.namHoc === targetYear) : allRawClasses;

    const teacherNameById = allRawTeachers.reduce((acc, item) => {
      if (item?.id != null) acc[String(item.id)] = item?.hoTen || "--";
      return acc;
    }, {});

    const homeroomByClassId = allRawHomeroom.reduce((acc, item) => {
      if (item?.lopId != null) acc[String(item.lopId)] = item?.giaoVienId ?? null;
      return acc;
    }, {});

    classesArr.forEach((c) => {
      if (c?.id != null && (c.gvcn?.id || c.gvcnId)) {
        homeroomByClassId[String(c.id)] = c.gvcn?.id || c.gvcnId;
      }
    });

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

    setStats({
      students: totalStudentCount,
      teachers: allRawTeachers.length,
      classes: classesArr.length,
      grade10: g10Classes.length,
      grade11: g11Classes.length,
      grade12: g12Classes.length,
      avgScore: null,
    });

    setDashboardData((prev) => ({
      ...prev,
      classes: classesArr,
      teachers: allRawTeachers,
      homeroomByClassId,
      teacherNameById,
      siSoByLopId,
      grade10Students,
      grade11Students,
      grade12Students,
    }));

    setChartLoading(true);
    try {
      const [avgRes, distRes] = await Promise.all([
        withTimeout(getDiemAvgByGrade({ namHoc: targetYear }), 30000).catch(() => ({ data: { data: [] } })),
        withTimeout(getDiemDistribution({ namHoc: targetYear }), 120000).catch(() => ({ data: { data: { counts: {}, total: 0, avgScore: null } } })),
      ]);
      const avgByGrade = avgRes?.data?.data || [];
      const dist = distRes?.data?.data || {};
      const blockAvg = avgByGrade.map((item) => ({
        name: `Khối ${item.khoi}`,
        value: item.avgScore != null ? Number(item.avgScore) : null,
        count: item.studentCount || 0,
      }));
      const distributionCounts = dist.counts || { "TỐT": 0, "KHÁ": 0, "ĐẠT": 0, "CHƯA ĐẠT": 0 };
      const scoreRanges = dist.scoreRanges || null;
      setDashboardData((prev) => ({
        ...prev,
        blockAvg,
        distributionCounts,
        scoreRanges,
        totalStudents: dist.total || 0,
      }));
      setStats((prev) => ({
        ...prev,
        avgScore: dist.avgScore ?? null,
      }));
    } finally {
      setChartLoading(false);
    }
  };

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

  // 1. Subject Average Line Chart Data (from pre-aggregated /subject-avg API)
  const subjectAvgData = useMemo(() => {
    if (!Array.isArray(bottomScores) || bottomScores.length === 0) return [];

    // Check if data is from the new aggregated /subject-avg endpoint
    // Format: [{monHocId, tenMon, avgScore, studentCount}]
    const firstItem = bottomScores[0];
    if (firstItem && ('avgScore' in firstItem || 'avg_score' in firstItem) && ('tenMon' in firstItem || 'ten_mon' in firstItem)) {
      // New aggregated format - just map directly
      return bottomScores
        .map(item => {
          const rawName = item.tenMon || item.ten_mon || '--';
          return {
            name: formatShortSubjectName(rawName),
            fullName: rawName,
            avg: item.avgScore != null ? Number(item.avgScore) : (item.avg_score != null ? Number(item.avg_score) : 0),
            count: Number(item.studentCount || item.student_count || 0),
          };
        })
        .filter(item => item.avg > 0)
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
    }

    // Legacy format: raw scores [{hocSinhId, monHocId, giaTriDiem, ...}]
    const subjectMap = new Map((rawSubjects || []).map((s) => [s.id, s]));
    const bySubject = {};

    (bottomScores || []).forEach((s) => {
      const monId = s?.monHoc?.id ?? s?.monHocId;
      if (!monId) return;
      const monInfo = subjectMap.get(monId);
      const tenMon = monInfo?.tenMon || s?.monHoc?.tenMon || "--";
      const nhomDanhGia = monInfo?.nhomDanhGia || s?.monHoc?.nhomDanhGia || "DIEM_SO";

      if (nhomDanhGia !== "DIEM_SO") return;
      const lowerName = tenMon.toLowerCase();
      if (lowerName.includes("shdc") || lowerName.includes("sinh hoạt")) return;

      if (!bySubject[monId]) {
        bySubject[monId] = { id: monId, tenMon, scores: [] };
      }
      if (s.giaTriDiem != null && !isNaN(Number(s.giaTriDiem))) {
        bySubject[monId].scores.push(Number(s.giaTriDiem));
      }
    });

    return Object.values(bySubject)
      .map((m) => {
        const count = m.scores.length;
        const avg = count > 0 ? Math.round((m.scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
        return {
          name: m.tenMon,
          avg: count > 0 ? avg : 0,
          count: count,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [bottomScores, rawSubjects]);

  // 2. Conduct Distribution Bar + Line Combo Chart Data
  const conductChartData = useMemo(() => {
    const pb = bottomConduct?.phanBoHanhKiem || bottomConduct || {};
    const tot = Number(pb.TOT ?? pb["TỐT"] ?? 0) || 0;
    const kha = Number(pb.KHA ?? pb["KHÁ"] ?? 0) || 0;
    const tb = Number(pb.TRUNG_BINH ?? pb["TRUNG BÌNH"] ?? pb.DAT ?? pb["ĐẠT"] ?? 0) || 0;
    const yeu = Number(pb.YEU ?? pb["YẾU"] ?? pb.CHUA_DAT ?? pb["CHƯA ĐẠT"] ?? 0) || 0;

    return [
      { name: "Yếu", count: yeu, fill: "#ef4444" },
      { name: "Trung bình", count: tb, fill: "#f59e0b" },
      { name: "Khá", count: kha, fill: "#06b6d4" },
      { name: "Tốt", count: tot, fill: "#2563eb" },
    ];
  }, [bottomConduct]);

  // 3. Score Range Histogram Data - 6 buckets (0-4.9, 5-5.9, 6-6.9, 7-7.9, 8-8.9, 9-10.0)
  const scoreRangeData = useMemo(() => {
    // 1. Check scoreRanges from distribution API (aggregated)
    const ranges = bottomDistribution?.scoreRanges || dashboardData.scoreRanges;
    if (ranges && typeof ranges === "object" && Object.keys(ranges).length > 0) {
      return [
        { range: "0–4,9", count: Number(ranges["0–4,9"] ?? ranges["0-4.9"] ?? 0) },
        { range: "5,0–5,9", count: Number(ranges["5,0–5,9"] ?? ranges["5.0-5.9"] ?? 0) },
        { range: "6,0–6,9", count: Number(ranges["6,0–6,9"] ?? ranges["6.0-6.9"] ?? 0) },
        { range: "7,0–7,9", count: Number(ranges["7,0–7,9"] ?? ranges["7.0-7.9"] ?? 0) },
        { range: "8,0–8,9", count: Number(ranges["8,0–8,9"] ?? ranges["8.0-8.9"] ?? 0) },
        { range: "9,0–10,0", count: Number(ranges["9,0–10,0"] ?? ranges["9.0-10.0"] ?? 0) },
      ];
    }

    // 2. Fallback: compute from raw scores (legacy format)
    const studentSubjectScores = {};
    (bottomScores || []).forEach((s) => {
      const stId = s?.hocSinh?.id ?? s?.hocSinhId;
      const monId = s?.monHoc?.id ?? s?.monHocId;
      if (!stId || !monId || s.giaTriDiem == null) return;
      const val = Number(s.giaTriDiem);
      if (isNaN(val)) return;

      if (!studentSubjectScores[stId]) studentSubjectScores[stId] = {};
      if (!studentSubjectScores[stId][monId]) studentSubjectScores[stId][monId] = [];
      studentSubjectScores[stId][monId].push(val);
    });

    const studentAverages = [];
    Object.values(studentSubjectScores).forEach((subjMap) => {
      const subjectAvgs = [];
      Object.values(subjMap).forEach((scList) => {
        if (scList.length > 0) {
          subjectAvgs.push(scList.reduce((a, b) => a + b, 0) / scList.length);
        }
      });
      if (subjectAvgs.length > 0) {
        const studentGpa = subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length;
        studentAverages.push(studentGpa);
      }
    });

    const brackets = [
      { range: "0–4,9", count: 0 },
      { range: "5,0–5,9", count: 0 },
      { range: "6,0–6,9", count: 0 },
      { range: "7,0–7,9", count: 0 },
      { range: "8,0–8,9", count: 0 },
      { range: "9,0–10,0", count: 0 },
    ];

    studentAverages.forEach((gpa) => {
      if (gpa < 5.0) brackets[0].count++;
      else if (gpa < 6.0) brackets[1].count++;
      else if (gpa < 7.0) brackets[2].count++;
      else if (gpa < 8.0) brackets[3].count++;
      else if (gpa < 9.0) brackets[4].count++;
      else brackets[5].count++;
    });

    return brackets;
  }, [bottomScores, bottomDistribution, dashboardData.scoreRanges]);

  return (
    <div className="space-y-6 pb-12 bg-[#f8fafc] min-h-screen text-slate-900 font-sans">

      {/* 2. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
            <TypewriterText text={`Chào mừng trở lại, ${adminName}`} />
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Cập nhật dữ liệu mới nhất của trường hôm nay</p>
        </div>

        {schoolYears.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="material-symbols-outlined text-[20px] text-blue-600">calendar_month</span>
            <span className="text-xs font-bold text-slate-500">Năm học:</span>
            <select
              value={activeYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-blue-900 outline-none cursor-pointer"
            >
              {schoolYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
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
          const labelColors = { blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600", orange: "text-orange-600" };
          return (
            <div key={i} className="flex flex-col justify-center rounded-[24px] bg-white p-6 border border-slate-200 h-[120px]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColors[card.color]}`}>
                    <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${labelColors[card.color]}`}>{card.label}</p>
                    <div className="h-7 flex items-center mt-0.5">
                      {card.isLoading ? (
                        <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${bgColors[card.color].split(' ')[1]}`}></div>
                      ) : (
                        <h4 className="text-xl font-bold text-blue-900 tracking-tight"><CountUp end={card.value} isNumber={!isNaN(Number(card.value))} decimals={card.label === "Điểm trung bình" && !isNaN(Number(card.value)) ? 2 : 0} /></h4>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Biểu đồ trên (Điểm trung bình theo khối & Xếp loại học lực) */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Bar Chart (70%) */}
        <div className="lg:w-[70%] h-[420px] rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-900">Điểm trung bình theo khối (Năm học {activeYear || "hiện tại"})</h3>
          </div>
          <div className="flex-1 w-full relative">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
              </div>
            ) : dashboardData.blockAvg.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">Chưa có dữ liệu điểm</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dashboardData.blockAvg} margin={{ top: 25, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: "#94a3b8", fontWeight: 600 }} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.4)" }} />
                  <Bar dataKey="value" maxBarSize={60} radius={[6, 6, 0, 0]} isAnimationActive={barShouldAnimate} animationDuration={800} label={{ position: 'top', fill: '#0f172a', fontSize: 13, fontWeight: 'bold' }}>
                    {dashboardData.blockAvg.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#2563eb" />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: "#f59e0b", stroke: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#d97706", stroke: "#ffffff", strokeWidth: 2 }} isAnimationActive={barShouldAnimate} animationDuration={1000} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart (30%) */}
        <div className="lg:w-[30%] h-[420px] rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col">
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

      {/* 5. Phân tích & Thống kê chi tiết (3 charts: ĐTB Môn ngang rộng + Phân bổ hạnh kiểm & Phổ điểm) */}
      <div className="space-y-6">
        {/* Header section with Semester toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div>
            <h3 className="text-lg font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">analytics</span>
              Thống kê & Phân tích chuyên sâu
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Dữ liệu phân tích điểm theo môn học, phân bổ hạnh kiểm và phổ điểm học sinh
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
            {[
              { val: "0", label: "Cả năm" },
              { val: "1", label: "Học kỳ 1" },
              { val: "2", label: "Học kỳ 2" },
            ].map((hk) => (
              <button
                key={hk.val}
                type="button"
                onClick={() => setBottomHocKy(hk.val)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bottomHocKy === hk.val
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-blue-900 hover:bg-slate-50"
                }`}
              >
                {hk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng 1: Biểu đồ ĐTB Theo môn học (Chiều ngang rộng rãi) */}
        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-blue-900 uppercase tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">show_chart</span>
              ĐTB Theo môn học
            </h3>
          </div>
          <div className="flex-1 w-full relative">
            {bottomChartsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
              </div>
            ) : subjectAvgData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                Chưa có dữ liệu điểm môn học
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectAvgData} margin={{ top: 20, right: 30, left: 10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={60}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomSubjectTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#1d4ed8", stroke: "#ffffff", strokeWidth: 2 }}
                    isAnimationActive={barShouldAnimate}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Hàng 2: Phân bổ hạnh kiểm (Trái) & Phổ điểm học sinh (Phải) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 2: Phân bổ số lượng hạnh kiểm */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col h-[380px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-blue-900 uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-[20px]">verified_user</span>
                Phân bổ số lượng hạnh kiểm
              </h3>
            </div>
            <div className="flex-1 w-full relative">
              {bottomChartsLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
                </div>
              ) : conductChartData.every((c) => c.count === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                  Chưa có dữ liệu hạnh kiểm
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={conductChartData} margin={{ top: 20, right: 20, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                      dy={5}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomConductTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.4)" }} />
                    <Bar
                      dataKey="count"
                      maxBarSize={56}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={barShouldAnimate}
                      animationDuration={800}
                      label={{ position: "top", fill: "#0f172a", fontSize: 13, fontWeight: "bold" }}
                    >
                      {conductChartData.map((entry, index) => (
                        <Cell key={`cell-conduct-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#64748b"
                      strokeWidth={2}
                      dot={{ r: 5, fill: "#ffffff", stroke: "#0284c7", strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2 }}
                      isAnimationActive={barShouldAnimate}
                      animationDuration={1000}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[11px] text-center font-bold text-slate-400 mt-1">Mức xếp loại</p>
          </div>

          {/* Chart 3: Phổ điểm trung bình học sinh */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col h-[380px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-blue-900 uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 text-[20px]">bar_chart</span>
                Phổ điểm trung bình học sinh
              </h3>
            </div>
            <div className="flex-1 w-full relative">
              {bottomChartsLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
                </div>
              ) : scoreRangeData.every((b) => b.count === 0) ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                  Chưa có dữ liệu điểm học sinh
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreRangeData} margin={{ top: 20, right: 15, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="range"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                      dy={5}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomScoreRangeTooltip />} cursor={{ fill: "rgba(241, 245, 249, 0.4)" }} />
                    <Bar
                      dataKey="count"
                      maxBarSize={50}
                      fill="#38bdf8"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={barShouldAnimate}
                      animationDuration={800}
                      label={{ position: "top", fill: "#0f172a", fontSize: 13, fontWeight: "bold" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[11px] text-center font-bold text-slate-400 mt-1">Khoảng điểm</p>
          </div>

        </div>
      </div>

      {/* 6. Bảng vinh danh Top 10 học sinh xuất sắc nhất (Theo năm học) */}
      <div className="rounded-[24px] bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <span className="material-symbols-outlined text-[24px]">emoji_events</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-blue-900 tracking-tight flex items-center gap-2">
                Top 10 học sinh xuất sắc nhất
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Năm học {activeYear || "hiện tại"}
                </span>
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Bảng vinh danh các học sinh có điểm trung bình cao nhất
              </p>
            </div>
          </div>

          {/* Grade filter pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            {[
              { val: "0", label: "Tất cả khối" },
              { val: "10", label: "Khối 10" },
              { val: "11", label: "Khối 11" },
              { val: "12", label: "Khối 12" },
            ].map((k) => (
              <button
                key={k.val}
                type="button"
                onClick={() => setTopStudentsKhoi(k.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  topStudentsKhoi === k.val
                    ? "bg-white text-blue-900 shadow-xs"
                    : "text-slate-600 hover:text-blue-900 hover:bg-white/50"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table content */}
        <div className="mt-4 overflow-x-auto">
          {topStudentsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
              <span className="text-slate-500 text-xs font-semibold">Đang tải danh sách học sinh xuất sắc...</span>
            </div>
          ) : topStudents.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <span className="material-symbols-outlined text-[28px]">school</span>
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu học sinh xuất sắc</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Điểm tổng kết năm học {activeYear} chưa được tính hoặc chưa có bảng điểm học bạ.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600 min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 text-center w-16">Hạng</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4 text-center">Lớp</th>
                  <th className="py-3 px-4 text-center">Điểm TB</th>
                  <th className="py-3 px-4 text-center">Xếp loại</th>
                  <th className="py-3 px-4 w-[35%]">Mức độ hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topStudents.map((s, index) => {
                  const rank = index + 1;
                  const avg = Number(s.diemTB || 0);
                  const color = classifyColor(avg);
                  const label = getClassifyLabel(avg);
                  const progressPct = Math.min(Math.max((avg / 10) * 100, 0), 100);

                  return (
                    <tr key={index} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Rank badge */}
                      <td className="py-3.5 px-4 text-center">
                        {rank === 1 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-xs shadow-xs">
                            1
                          </div>
                        ) : rank === 2 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white font-black text-xs shadow-xs">
                            2
                          </div>
                        ) : rank === 3 ? (
                          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-xs shadow-xs">
                            3
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                            {rank}
                          </span>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            rank <= 3 ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {(s.hoTen || "HS").split(" ").pop()?.charAt(0) || "H"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {s.hoTen}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          {s.tenLop || "--"}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-[15px]" style={{ color }}>
                        {avg > 0 ? avg.toFixed(2) : (s.diemTB ?? "--")}
                      </td>

                      {/* Rank Classification */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: `${color}15`,
                            color: color,
                          }}
                        >
                          {label}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 w-10 text-right">
                            {progressPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
