import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, CalendarDays, FileText, CheckCircle } from "lucide-react";
import { getStudentDashboard } from "../../api/hocsinhApi";
import { getNamHoc } from "../../api/namhocApi";
import { getActiveAcademicYear, getVisibleAcademicYears, getStudentAcademicYears } from "../../utils/helpers";
import { readCachedAvatar } from "../../utils/avatarCache";
import { getCurrentUsernameFromToken } from "../../utils/teacherProfile";
import { getPolicyBySubject } from "../../utils/scorePolicy";
import StudentProfileWidget from "./dashboard/StudentProfileWidget";
import TimetableWidget from "./dashboard/TimetableWidget";
import StatCardsWidget from "./dashboard/StatCardsWidget";
import ScoreChartWidget from "./dashboard/ScoreChartWidget";
import NoticesWidget from "./dashboard/NoticesWidget";

const HANH_KIEM_LABELS = {
  TOT: "Tốt",
  KHA: "Khá",
  TRUNG_BINH: "Trung bình",
  YEU: "Yếu",
};

const SUBJECT_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be185d", "#4f46e5", "#059669", "#ea580c",
  "#6d28d9", "#0d9488", "#b91c1c", "#1d4ed8", "#a16207",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [systemYears, setSystemYears] = useState([]);
  const [activeYearName, setActiveYearName] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [selectedHK, setSelectedHK] = useState(1);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [dashboardRes, namHocRes] = await Promise.all([
          getStudentDashboard(),
          getNamHoc().catch(() => null)
        ]);
        if (!active) return;
        const dashboardData = dashboardRes?.data?.data || null;
        setData(dashboardData);

        const rawYears = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawYears);
        setSystemYears(visibleYears);

        const activeYearObj = getActiveAcademicYear(visibleYears)
          || visibleYears.find(y => y.tenNamHoc === dashboardData?.student?.lop?.namHoc)
          || visibleYears[0];

        const curActiveYear = activeYearObj?.tenNamHoc || dashboardData?.student?.lop?.namHoc || "";
        setActiveYearName(curActiveYear);
        setSelectedNamHoc(curActiveYear);

        if (activeYearObj?.ngayBatDauHk2 && new Date().toISOString().slice(0, 10) >= activeYearObj.ngayBatDauHk2) {
          setSelectedHK(2);
        } else {
          setSelectedHK(1);
        }

        if (dashboardData?.student) {
          const username = getCurrentUsernameFromToken();
          const dbAvatar = dashboardData.student.anhDaiDien || "";
          const cachedAvatar = readCachedAvatar({ username, role: "student" }) || "";
          setAvatarSrc(dbAvatar || cachedAvatar);
        }
      } catch (err) {
        if (active) setError("Không thể tải dữ liệu trang chủ.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      active = false;
    };
  }, []);

  const subjectMap = useMemo(() => {
    const m = {};
    if (data?.subjects) {
      for (const s of data.subjects) {
        if (s?.id) m[s.id] = s.tenMon || s.tenMonHoc || `Môn ${s.id}`;
      }
    }
    if (data?.scores) {
      for (const s of data.scores) {
        const id = s.monHoc?.id ?? s.monHocId;
        if (id && !m[id]) {
          m[id] = s.monHoc?.tenMon || s.monHoc?.tenMonHoc || `Môn ${id}`;
        }
      }
    }
    return m;
  }, [data?.subjects, data?.scores]);

  const getSubjectName = (id) => subjectMap[id] || `Môn ${id}`;

  const subjectColorMap = useMemo(() => {
    const m = {};
    const allSubjectIds = Object.keys(subjectMap);
    allSubjectIds.forEach((id, i) => {
      m[id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
    });
    return m;
  }, [subjectMap]);

  const namHocList = useMemo(() => {
    const studentYears = getStudentAcademicYears(systemYears, data?.student);
    const years = studentYears.map(y => y.tenNamHoc).filter(Boolean);
    return years.length > 0 ? years : (activeYearName ? [activeYearName] : []);
  }, [systemYears, data?.student, activeYearName]);

  useEffect(() => {
    if (namHocList.length > 0 && !selectedNamHoc) {
      setSelectedNamHoc(activeYearName || namHocList[0]);
    }
  }, [namHocList, selectedNamHoc, activeYearName]);

  const dynamicSubjectScores = useMemo(() => {
    if (!data?.scores || !selectedNamHoc || !selectedHK) return data?.subjectScores || [];
    
    const clean = (str) => String(str || "").replace(/\s+/g, "").trim();
    const selYearClean = clean(selectedNamHoc);
    const selHK = Number(selectedHK);

    const filteredScores = data.scores.filter(s => {
      const sYear = clean(typeof s.namHoc === "object" ? s.namHoc?.tenNamHoc : s.namHoc);
      const sHK = Number(s.hocKy);
      return sYear === selYearClean && sHK === selHK;
    });

    // Build subject list from data.subjects and any subjects found in filtered scores
    const subjectsList = Array.isArray(data?.subjects) && data.subjects.length > 0 ? [...data.subjects] : [];
    const seenIds = new Set(subjectsList.map(s => Number(s.id)));

    filteredScores.forEach(s => {
      const sId = Number(s.monHoc?.id ?? s.monHocId);
      if (sId && !seenIds.has(sId)) {
        seenIds.add(sId);
        subjectsList.push(s.monHoc || { id: sId, tenMon: subjectMap[sId] || `Môn ${sId}` });
      }
    });

    return subjectsList.map(subj => {
      const subjId = Number(subj.id);
      const subjScores = filteredScores.filter(s => Number(s.monHoc?.id ?? s.monHocId) === subjId);
      if (subjScores.length === 0) return { monHocId: subjId, avgScore: null };
      
      const policy = getPolicyBySubject(subj);
      if (policy.mode === "COMMENT" || subj.nhomDanhGia === "NHAN_XET" || subj.nhomDanhGia === "nhan_xet") {
        return { monHocId: subjId, avgScore: null };
      }
      
      const txScores = [];
      let gkScore = null;
      let ckScore = null;

      subjScores.forEach(s => {
        if (s.giaTriDiem == null && s.giaTri == null) return;
        const val = Number(s.giaTriDiem ?? s.giaTri);
        if (Number.isNaN(val)) return;

        const loai = String(s.loaiDiem || "").toUpperCase().trim();
        if (loai === "TX" || loai === "MIENG" || loai === "15P" || loai.startsWith("TX")) {
          txScores.push(val);
        } else if (loai === "GK" || loai === "1T") {
          gkScore = val;
        } else if (loai === "CK" || loai === "THI") {
          ckScore = val;
        }
      });
      
      // Theo Thông tư 22/2021/TT-BGDĐT: ĐTB môn học kỳ = (sum(TX) + 2*GK + 3*CK) / (count(TX) + 5)
      let avgScore = null;
      if (txScores.length > 0 && gkScore != null && ckScore != null) {
        const sumTx = txScores.reduce((acc, v) => acc + v, 0);
        const avg = (sumTx + Number(gkScore) * 2 + Number(ckScore) * 3) / (txScores.length + 5);
        avgScore = Math.round(avg * 10) / 10;
      }
      
      return { monHocId: subjId, avgScore };
    });
  }, [data?.scores, data?.subjects, selectedNamHoc, selectedHK, data?.subjectScores, subjectMap]);

  const dynamicGPA = useMemo(() => {
    const scoredSubs = dynamicSubjectScores.filter(s => s.avgScore !== null);
    if (scoredSubs.length === 0) return null;
    const sum = scoredSubs.reduce((acc, curr) => acc + curr.avgScore, 0);
    return Math.round((sum / scoredSubs.length) * 10) / 10;
  }, [dynamicSubjectScores]);

  const hanhKiemRaw = useMemo(() => {
    if (!data?.conducts?.length) return null;
    const clean = (str) => String(str || "").replace(/\s+/g, "").trim();
    const selYearClean = clean(selectedNamHoc);
    const selHK = Number(selectedHK);

    const filtered = data.conducts.filter((c) => {
      const tenNamHoc = clean(c.namHoc?.tenNamHoc || c.tenNamHoc || c.namHoc || "");
      const matchNamHoc = selectedNamHoc ? tenNamHoc === selYearClean : true;
      const matchHK = Number(c.hocKy) === selHK;
      return matchNamHoc && matchHK;
    });
    const approved = filtered.find((c) => c.trangThai === "APPROVED" || c.status === "APPROVED");
    const record = approved || filtered[filtered.length - 1];
    return record?.xepLoai || record?.hanhKiem || null;
  }, [data?.conducts, selectedNamHoc, selectedHK]);

  const hanhKiemLabel = HANH_KIEM_LABELS[hanhKiemRaw] || hanhKiemRaw || "--";

  const hkColor = useMemo(() => {
    const map = {
      TOT: { bg: "#dcfce7", text: "#16a34a" },
      KHA: { bg: "#dbeafe", text: "#2563eb" },
      TRUNG_BINH: { bg: "#fef9c3", text: "#ca8a04" },
      YEU: { bg: "#fee2e2", text: "#dc2626" },
    };
    return map[hanhKiemRaw] || { bg: "#f3f4f6", text: "#6b7280" };
  }, [hanhKiemRaw]);

  const todayDay = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;
  const currentMonth = new Date().getMonth() + 1;
  const activeYearObj = getActiveAcademicYear(systemYears) || systemYears[0];
  
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isNotStartedYet = Boolean(activeYearObj?.ngayBatDauHk1 && todayDateStr < activeYearObj.ngayBatDauHk1);
  const isSummerBreak = activeYearObj?.ngayKetThucHk2 
    ? todayDateStr > activeYearObj.ngayKetThucHk2 
    : (currentMonth === 6 || currentMonth === 7 || currentMonth === 8);

  const attendanceRate = data?.attendanceStats
    ? Math.max(0, 100 - (Number(data.attendanceStats.coPhep || 0) + Number(data.attendanceStats.khongPhep || 0)))
    : 100;

  // Tính chính xác số môn học thực tế của học sinh THPT (Chuẩn GDPT 2018: 8 môn bắt buộc + 4 môn tự chọn = 12 môn)
  const studentSubjectsCount = useMemo(() => {
    if (!data?.subjects || data.subjects.length === 0) return 12;

    const allSubs = data.subjects.filter((s) => {
      const name = (s.tenMon || s.tenMonHoc || "").toLowerCase();
      const ma = (s.maMon || "").toUpperCase();
      return (
        !name.includes("shdc") &&
        !name.includes("shl") &&
        !name.includes("chào cờ") &&
        !name.includes("sinh hoạt lớp") &&
        ma !== "SHDC" &&
        ma !== "SHL"
      );
    });

    const toHopIds =
      data?.student?.lop?.toHopMonIds ||
      data?.student?.lop?.toHop?.monHocIds ||
      data?.toHopMon?.monHocIds ||
      null;

    if (toHopIds && toHopIds.length > 0) {
      const toHopSet = new Set(toHopIds.map(Number));
      const filtered = allSubs.filter((s) => {
        const name = (s.tenMon || s.tenMonHoc || "").toLowerCase();
        const isMandatory =
          name.includes("toán") ||
          name.includes("ngữ văn") ||
          name.includes("tiếng anh") ||
          name.includes("ngoại ngữ") ||
          name.includes("lịch sử") ||
          name.includes("thể chất") ||
          name.includes("thể dục") ||
          name.includes("quốc phòng") ||
          name.includes("trải nghiệm") ||
          name.includes("địa phương");
        return isMandatory || toHopSet.has(Number(s.id));
      });
      if (filtered.length > 0) return filtered.length;
    }

    return 12;
  }, [data?.subjects, data?.student, data?.toHopMon]);

  // Lấy thông tin lớp tương ứng với năm học đang chọn
  // PHẢI đặt trước early return để không vi phạm Rules of Hooks
  const currentClassInfo = useMemo(() => {
    if (!selectedNamHoc) return data?.student?.lop;
    
    // Nếu chọn năm học hiện tại của học sinh
    if (data?.student?.lop?.namHoc === selectedNamHoc) {
      return data?.student?.lop;
    }
    
    // Tìm trong lịch sử học tập
    const history = (data?.academicHistories || []).find(h => h.namHoc === selectedNamHoc);
    if (history?.lopHoc) {
      return history.lopHoc;
    }
    
    // Fallback thông minh: Nếu chọn năm học trước năm hiện tại
    const currentClassName = data?.student?.lop?.tenLop || "";
    const match = currentClassName.match(/^(\d+)(.*)$/);
    if (match) {
      const currentGrade = parseInt(match[1], 10);
      const suffix = match[2];
      const curYearParts = (data?.student?.lop?.namHoc || activeYearName || "").split("-");
      const selYearParts = selectedNamHoc.split("-");
      if (curYearParts.length === 2 && selYearParts.length === 2) {
        const diffYears = parseInt(curYearParts[0], 10) - parseInt(selYearParts[0], 10);
        const targetGrade = currentGrade - diffYears;
        if (targetGrade >= 10 && targetGrade <= 12) {
          return {
            ...data?.student?.lop,
            tenLop: `${targetGrade}${suffix}`,
            khoi: targetGrade,
            namHoc: selectedNamHoc
          };
        }
      }
    }
    
    return data?.student?.lop;
  }, [selectedNamHoc, data?.student?.lop, data?.academicHistories, activeYearName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col gap-6 min-h-0 lg:h-full">
          <StudentProfileWidget
            student={data?.student}
            classInfo={data?.student?.lop || currentClassInfo}
            avatarSrc={avatarSrc}
            selectedNamHoc={data?.currentNamHoc || activeYearName}
            selectedHK={data?.currentHocKy || (activeYearObj?.ngayBatDauHk2 && todayDateStr >= activeYearObj.ngayBatDauHk2 ? 2 : 1)}
            homeroomTeacher={data?.student?.lop?.gvcn || currentClassInfo?.gvcn || data?.homeroomTeacher}
          />
          <TimetableWidget
            timetable={data?.timetable || []}
            studentClass={data?.student?.lop?.tenLop}
            isSummerBreak={isSummerBreak}
            isNotStartedYet={isNotStartedYet}
            schoolStartDate={activeYearObj?.ngayBatDauHk1}
            isExamWeek={data?.examWeek === true}
            todayDay={todayDay}
            subjectColorMap={subjectColorMap}
            getSubjectName={getSubjectName}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <StatCardsWidget
            weekTimetable={data?.timetable || []}
            subjectsCount={studentSubjectsCount}
            dtb={dynamicGPA}
            hanhKiemLabel={hanhKiemLabel}
            hkColor={hkColor}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/student/score")}
              className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Kết quả học tập</span>
            </button>
            <button
              onClick={() => navigate("/student/timetable?filter=lessons")}
              className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Thời khóa biểu</span>
            </button>
            <button
              onClick={() => navigate("/student/timetable?filter=exams")}
              className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-sm font-semibold text-slate-700">Lịch thi</span>
            </button>
          </div>

          <ScoreChartWidget
            subjectScores={dynamicSubjectScores}
            subjectMap={subjectMap}
            subjectColorMap={subjectColorMap}
            namHocList={namHocList}
            activeYearName={activeYearName}
            selectedNamHoc={selectedNamHoc}
            setSelectedNamHoc={setSelectedNamHoc}
            selectedHK={selectedHK}
            setSelectedHK={setSelectedHK}
          />

          <NoticesWidget unreadNotices={data?.notices || []} attendanceRate={attendanceRate} dtb={dynamicGPA} />
        </div>
      </div>
    </div>
  );
}
