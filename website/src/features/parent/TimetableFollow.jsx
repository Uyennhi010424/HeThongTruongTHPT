import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { getDayLabel, getCurrentSemesterWeek, getWeekDates, mapTimeToPeriod } from "../../utils/helpers.js";
import { getLichThi, getLichThiByLop } from "../../api/lichthiApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";
import MaterialIcon from "../../components/edu/MaterialIcon.jsx";

const WEEK_DAYS = [2, 3, 4, 5, 6, 7, 8];
const MORNING_PERIODS = [1, 2, 3, 4, 5];
const AFTERNOON_PERIODS = [6, 7, 8, 9, 10];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateShort = (date) => {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "lessons", label: "Lịch học" },
  { value: "exams", label: "Lịch thi" },
];

export default function TimetableFollow() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading, error: studentsError } = useParentStudents();
  
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isExamWeek, setIsExamWeek] = useState(false);
  const [dataError, setDataError] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);
  const [yearInfo, setYearInfo] = useState({ tenNamHoc: "", hocKy: 1, activeYearObj: null });

  const isInitialLoad = useRef(true);
  
  const location = useLocation();
  const getInitialFilter = () => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    return ["all", "lessons", "exams"].includes(filterParam) ? filterParam : "all";
  };
  
  const [filterType, setFilterType] = useState(getInitialFilter());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    if (filterParam && ["all", "lessons", "exams"].includes(filterParam)) {
      setFilterType(filterParam);
    }
  }, [location.search]);

  // Fetch logic for Parent Student
  useEffect(() => {
    if (!currentStudent) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const lopId = currentStudent?.lop?.id;

        let curNamHoc = "";
        let curHocKy = 1;
        let activeYearObj = null;
        try {
          const namHocRes = await getNamHoc();
          activeYearObj = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[0] || null;
          if (activeYearObj) {
            curNamHoc = activeYearObj.tenNamHoc || "";
            if (activeYearObj.ngayBatDauHk2) {
              const today = new Date().toISOString().slice(0, 10);
              if (today >= activeYearObj.ngayBatDauHk2) curHocKy = 2;
            }
          }
        } catch { /* ignore */ }

        const currentTuan = getCurrentSemesterWeek(activeYearObj);

        isInitialLoad.current = true;
        setYearInfo({ tenNamHoc: curNamHoc, hocKy: curHocKy, activeYearObj });
        setSelectedTuan(currentTuan);

        const [tkbRes, examRes] = await Promise.all([
          lopId
            ? getThoiKhoaBieu({ lopId, namHoc: curNamHoc, hocKy: curHocKy, tuan: currentTuan })
            : getThoiKhoaBieu(),
          lopId ? getLichThiByLop(lopId) : getLichThi()
        ]);
        if (!active) return;
        setTimetable(tkbRes?.data?.data || []);
        setIsExamWeek(tkbRes?.data?.message === "TUAN_THI");
        setExams(examRes?.data?.data || []);
        if (tkbRes?.data?.message === "TUAN_THI") {
          setFilterType(prev => prev === "lessons" ? "all" : prev);
        }
        isInitialLoad.current = false;
      } catch {
        if (!active) return;
        setDataError("Không thể tải lịch học hoặc lịch thi.");
        isInitialLoad.current = false;
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currentStudent?.id]);

  useEffect(() => {
    if (!yearInfo.tenNamHoc || !currentStudent?.lop?.id) return;
    if (isInitialLoad.current) return;
    let active = true;
    const lopId = currentStudent.lop.id;
    const refetchByWeek = async () => {
      try {
        setDataLoading(true);
        const res = await getThoiKhoaBieu({
          lopId,
          namHoc: yearInfo.tenNamHoc,
          hocKy: yearInfo.hocKy,
          tuan: selectedTuan
        });
        if (!active) return;
        setTimetable(res?.data?.data || []);
        if (res?.data?.message === "TUAN_THI") {
          setIsExamWeek(true);
          setFilterType(prev => prev === "lessons" ? "all" : prev);
        } else {
          setIsExamWeek(false);
        }
      } catch { /* ignore */ } finally {
        if (active) setDataLoading(false);
      }
    };
    refetchByWeek();
    return () => { active = false; };
  }, [selectedTuan, yearInfo.tenNamHoc, yearInfo.hocKy, currentStudent?.lop?.id]);

  const scheduleMap = useMemo(() => {
    const map = new Map();
    let weekStart = new Date();
    if (yearInfo.activeYearObj) {
        weekStart = getWeekDates(selectedTuan, yearInfo.activeYearObj).monday;
    } else if (yearInfo.tenNamHoc) {
      const startYear = parseInt(yearInfo.tenNamHoc.split("-")[0]);
      const schoolStart = new Date(startYear, 8, 5);
      const dow = schoolStart.getDay();
      const monday = new Date(schoolStart);
      monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
      monday.setDate(monday.getDate() + (selectedTuan - 1) * 7);
      weekStart = monday;
    }
    
    timetable.forEach((item) => {
      const day = Number(item?.thu);
      const start = Number(item?.tietBatDau || 1);
      const count = Math.max(1, Number(item?.soTiet || 1));
      if (!Number.isFinite(day) || !Number.isFinite(start)) return;

      for (let p = start; p < start + count; p++) {
        const key = `${day}-${p}`;
        const entries = map.get(key) || [];
        entries.push(item);
        map.set(key, entries);
      }
    });

    if (exams && exams.length > 0) {
      const sunday = addDays(weekStart, 6);
      exams.forEach((exam) => {
        if (!exam.ngayThi) return;
        const d = new Date(exam.ngayThi + "T00:00:00");
        if (d >= weekStart && d <= sunday) {
          const dow = d.getDay();
          const thu = dow === 0 ? 8 : dow + 1;
          const period = mapTimeToPeriod(exam.gioBatDau);
          const key = `${thu}-${period}`;
          const entries = map.get(key) || [];
          entries.push({ ...exam, isExam: true });
          map.set(key, entries);
        }
      });
    }
    return map;
  }, [timetable, exams, selectedTuan, yearInfo.activeYearObj, yearInfo.tenNamHoc]);

  const getCellEntries = (day, period) => scheduleMap.get(`${day}-${period}`) || [];

  const scheduleDays = useMemo(() => {
    const daySet = new Set(
      timetable
        .map((item) => Number(item?.thu))
        .filter((d) => Number.isFinite(d) && d >= 2 && d <= 8)
    );
    const examDaySet = new Set(
      exams
        .filter((e) => e.ngayThi)
        .map((e) => {
          const dow = new Date(e.ngayThi + "T00:00:00").getDay();
          return dow === 0 ? 8 : dow + 1;
        })
        .filter((d) => d >= 2 && d <= 8)
    );
    const allDays = new Set([...daySet, ...examDaySet]);
    const visible = WEEK_DAYS.filter((d) => d !== 8 || allDays.has(8));
    return visible.length > 0 ? visible : WEEK_DAYS.slice(0, 6);
  }, [timetable, exams]);

  const examsByDay = useMemo(() => {
    const { monday } = getWeekDates(selectedTuan, yearInfo.activeYearObj);
    const sunday = addDays(monday, 6);
    const map = {};
    exams.forEach((exam) => {
      if (!exam.ngayThi) return;
      const d = new Date(exam.ngayThi + "T00:00:00");
      if (d >= monday && d <= sunday) {
        const dow = d.getDay();
        const thu = dow === 0 ? 8 : dow + 1;
        if (!map[thu]) map[thu] = [];
        map[thu].push(exam);
      }
    });
    return map;
  }, [exams, selectedTuan, yearInfo.activeYearObj]);

  const { todayThu, todayDateStr, isCurrentWeek, getDateByDay, currentWeekRange } = useMemo(() => {
    const now = new Date();
    const dow = now.getDay();
    const thu = dow === 0 ? 8 : dow + 1;
    const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    const { monday, sunday } = getWeekDates(selectedTuan, yearInfo.activeYearObj);
    const isCurrent = now >= monday && now <= sunday;
    const weekRangeText = `Tuần ${selectedTuan} (${formatDateShort(monday)} - ${formatDateShort(sunday)})`;
    const getDateByDayFunc = (day) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + (day - 2));
      return d;
    };
    return {
      todayThu: thu,
      todayDateStr: dateStr,
      isCurrentWeek: isCurrent,
      getDateByDay: getDateByDayFunc,
      currentWeekRange: weekRangeText,
    };
  }, [selectedTuan, yearInfo.activeYearObj]);

  const handleGoToCurrentWeek = () => {
    const currentTuan = getCurrentSemesterWeek(yearInfo.activeYearObj);
    setSelectedTuan(currentTuan);
  };

  const showLessons = filterType === "all" || filterType === "lessons";
  const showExams = filterType === "all" || filterType === "exams";

  const getSubjectLabel = (item) => item?.monHoc?.tenMon || item?.tenMonHoc || "--";
  const getClassLabel = (item) => {
    const teacher = item?.giaoVien?.hoTen || "";
    const room = item?.phongHoc || "";
    if (teacher && room) return `${teacher} - ${room}`;
    return teacher || room || "";
  };

  const renderSessionRows = (periods, sessionClass) =>
    periods.map((period, idx) => (
      <tr key={`p-${period}`}>
        {idx === 0 && (
          <td rowSpan={periods.length} className={`tkb-ca-hoc ${sessionClass}`}>
            {sessionClass === "tkb-sang" ? "Sáng" : "Chiều"}
          </td>
        )}
        <td className="tkb-period">{period}</td>
        {scheduleDays.map((day) => {
          const isToday = day === todayThu && isCurrentWeek;
          const entries = getCellEntries(day, period);
          const cellLessons = entries.filter(item => 
            (item.isExam && showExams) || (!item.isExam && showLessons)
          );
          return (
            <td key={day} className={isToday ? "tkb-today-col" : ""}>
              {cellLessons.map((item, li) => {
                if (item.isExam) {
                  return (
                    <div className="tkb-entry tkb-entry-exam" key={`ex-${item.id}-${li}`} style={{ marginBottom: "8px", borderLeftColor: "#b91c1c", backgroundColor: "#fef2f2" }}>
                      <div className="tkb-subject" style={{ color: "#b91c1c", fontWeight: 700 }}>
                        {item.monHoc?.tenMon || item.tenMonHoc || "--"} <span className="tkb-exam-type">({item.loaiKiemTra || "KT"})</span>
                      </div>
                      <div className="tkb-class" style={{ color: "#991b1b" }}>
                        {item.gioBatDau || "--"} - P.{item.phongThi || "--"}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    className={`tkb-entry ${period <= 5 ? "tkb-entry-sang" : "tkb-entry-chieu"}`}
                    key={`${item.id || li}-p${period}`}
                  >
                    <div className="tkb-subject">{getSubjectLabel(item)}</div>
                    <div className="tkb-class">{getClassLabel(item)}</div>
                    {item.ghiChu && (
                      <div style={{ marginTop: "4px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#fef3c7", color: "#d97706", fontSize: "0.75rem", fontWeight: 600, display: "inline-block" }}>
                        📌 {item.ghiChu}
                      </div>
                    )}
                  </div>
                );
              })}
              {!cellLessons.length && <div className="tkb-empty">&nbsp;</div>}
            </td>
          );
        })}
      </tr>
    ));

  const loading = studentsLoading || dataLoading;
  const error = studentsError || dataError;

  return (
    <div className="student-page">
      <StudentSelector
        students={students}
        selectedIndex={selectedIndex}
        onSelect={selectStudent}
        loading={studentsLoading}
        error={studentsError}
      />
      
      {!currentStudent && !studentsLoading && !studentsError && (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          Chưa có học sinh nào được liên kết.
        </div>
      )}

      {currentStudent && (
        <div className="student-page" style={{ marginTop: "24px" }}>
          <h2 style={{ marginBottom: "16px", fontSize: "1.5rem", fontWeight: "bold", color: "#00236f", marginLeft: "16px" }}>
            Thời Khóa Biểu
          </h2>
          <div className="card tkb-card">
            {/* Toolbar */}
          <div className="tkb-toolbar">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#00236f", marginLeft: 16 }}>
                Năm học {yearInfo.tenNamHoc} - Học kỳ {yearInfo.hocKy === 1 ? 'I' : 'II'}
              </span>
            </div>
            <div className="tkb-toolbar-center">
              {FILTER_OPTIONS.map((opt) => (
                <label key={opt.value} className="tkb-radio-label">
                  <input
                    type="radio"
                    name="tkb-filter"
                    value={opt.value}
                    checked={filterType === opt.value}
                    onChange={() => setFilterType(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="tkb-toolbar-right">
              <span className="tkb-today-text" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, position: "relative" }}>
                <MaterialIcon name="calendar_month" style={{ fontSize: 18, color: "#4b5563" }} />
                {todayDateStr}
              </span>
              <button className="tkb-btn" type="button" style={{ color: "#2563eb", fontWeight: 600 }} onClick={handleGoToCurrentWeek}>
                Hiện tại
              </button>
              <button className="tkb-btn" type="button" onClick={() => setSelectedTuan((prev) => Math.max(1, prev - 1))} disabled={selectedTuan <= 1}>
                ⬅ Trở về
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb", display: "inline-flex", alignItems: "center", height: 38 }}>
                {currentWeekRange}
              </span>
              <button className="tkb-btn" type="button" onClick={() => setSelectedTuan((prev) => prev + 1)}>
                Tiếp ➡
              </button>
            </div>
          </div>

          {error && <div className="tkb-error">{error}</div>}



          <div className="tkb-table-wrap">
            <table className="tkb-table">
              <thead>
                <tr>
                  <th className="tkb-header-ca" rowSpan={2}>Ca học</th>
                  <th className="tkb-header-tiet" rowSpan={2}>Tiết</th>
                  {scheduleDays.map((day) => {
                    const isToday = day === todayThu && isCurrentWeek;
                    const d = getDateByDay(day);
                    return (
                      <th key={day} className={isToday ? "tkb-today-header" : ""}>
                        <div>{getDayLabel(day)}</div>
                        <div className="tkb-date">{d.getDate()}/{d.getMonth() + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2 + scheduleDays.length} className="tkb-loading">Đang tải dữ liệu...</td>
                  </tr>
                ) : (
                  <>
                    {(showLessons || showExams) && renderSessionRows(MORNING_PERIODS, "tkb-sang")}
                    {(showLessons || showExams) && renderSessionRows(AFTERNOON_PERIODS, "tkb-chieu")}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="tkb-legend">
            <div className="tkb-legend-item">
              <div className="tkb-legend-dot" style={{ background: "#fff", borderLeft: "3px solid #3b82f6" }} />
              Lịch học buổi sáng
            </div>
            <div className="tkb-legend-item">
              <div className="tkb-legend-dot" style={{ background: "#fef9c3", borderLeft: "3px solid #f59e0b" }} />
              Lịch học buổi chiều
            </div>
            <div className="tkb-legend-item">
              <div className="tkb-legend-dot" style={{ background: "#dbeafe", borderLeft: "3px solid #3b82f6" }} />
              Lịch thi
            </div>
            <div className="tkb-legend-item">
              <div className="tkb-legend-dot" style={{ background: "#f0f9ff" }} />
              Ngày hôm nay
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
