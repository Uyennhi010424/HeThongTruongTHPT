import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getLichThiByLop } from "../../api/lichthiApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { formatDateShort, getDayLabel, getCurrentSemesterWeek } from "../../utils/helpers.js";
import MaterialIcon from "../../components/edu/MaterialIcon.jsx";

const WEEK_DAYS = [2, 3, 4, 5, 6, 7, 8];
const MORNING_PERIODS = [1, 2, 3, 4, 5];
const AFTERNOON_PERIODS = [6, 7, 8, 9, 10];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "lessons", label: "Lịch học" },
  { value: "exams", label: "Lịch thi" },
];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);
  const [yearInfo, setYearInfo] = useState({ tenNamHoc: "", hocKy: 1 });
  const location = useLocation();
  
  // Lấy giá trị filter từ query param, nếu không có thì mặc định là "all"
  const getInitialFilter = () => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    return ["all", "lessons", "exams"].includes(filterParam) ? filterParam : "all";
  };
  
  const [filterType, setFilterType] = useState(getInitialFilter());

  // Cập nhật filter nếu URL thay đổi (VD: khi đang ở trang TKB mà user bấm link ở sidebar)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    if (filterParam && ["all", "lessons", "exams"].includes(filterParam)) {
      setFilterType(filterParam);
    }
  }, [location.search]);
  const [lopId, setLopId] = useState(null);
  const [namHocList, setNamHocList] = useState([]);
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const dateInputRef = useRef(null);

  const handleDateChange = (e) => {
    const selectedDateStr = e.target.value; // "YYYY-MM-DD"
    if (!selectedDateStr || !namHocList.length) return;

    const selectedDate = new Date(selectedDateStr + "T00:00:00");
    setDisplayedDate(selectedDate);

    // Sort academic years descending to match selectedDate with correct year start
    const sortedYears = [...namHocList].sort((a, b) => 
      new Date(b.ngayBatDauHk1 + "T00:00:00") - new Date(a.ngayBatDauHk1 + "T00:00:00")
    );

    const matchedYear = sortedYears.find(y => 
      selectedDate >= new Date(y.ngayBatDauHk1 + "T00:00:00")
    ) || sortedYears[sortedYears.length - 1];

    if (!matchedYear) return;

    // Determine semester
    let calculatedHocKy = 1;
    if (matchedYear.ngayBatDauHk2) {
      if (selectedDateStr >= matchedYear.ngayBatDauHk2) {
        calculatedHocKy = 2;
      }
    }

    // Calculate week
    let calculatedWeek = 1;
    if (matchedYear.ngayBatDauHk1) {
      const schoolStart = new Date(matchedYear.ngayBatDauHk1 + "T00:00:00");
      const dayOfWeek = schoolStart.getDay();
      const monday = new Date(schoolStart);
      monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

      const diffDays = Math.floor((selectedDate - monday) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        calculatedWeek = Math.floor(diffDays / 7) + 1;
      }
    }

    setYearInfo({ tenNamHoc: matchedYear.tenNamHoc, hocKy: calculatedHocKy });
    setSelectedTuan(Math.max(1, Math.min(52, calculatedWeek)));
  };

  const getDefaultTuan = (ngayBatDauHk1) => {
    // Call the shared helper. Since it expects an object with ngayBatDauHk1, we pass it.
    return getCurrentSemesterWeek({ ngayBatDauHk1 });
  };

  useEffect(() => {
    let active = true;
    const fetchInit = async () => {
      try {
        setLoading(true);
        setError("");
        const studentRes = await getCurrentHocSinh();
        if (!active) return;
        const sLopId = studentRes?.data?.data?.lop?.id;
        if (!sLopId) {
          setError("Không tìm thấy lớp của học sinh.");
          setLoading(false);
          return;
        }
        setLopId(sLopId);

        let currentNamHoc = "";
        let currentHocKy = 1;
        let ngayBatDauHk1 = null;
        try {
          const namHocRes = await getNamHoc();
          const years = namHocRes?.data?.data || [];
          if (active) setNamHocList(years);
          const currentYear = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[years.length - 1];
          currentNamHoc = currentYear?.tenNamHoc || "";
          ngayBatDauHk1 = currentYear?.ngayBatDauHk1 || null;
          if (currentYear?.ngayBatDauHk2) {
            const today = new Date().toISOString().slice(0, 10);
            if (today >= currentYear.ngayBatDauHk2) currentHocKy = 2;
          }
        } catch { /* ignore */ }

        let defaultTuan = getDefaultTuan(ngayBatDauHk1);
        setYearInfo({ tenNamHoc: currentNamHoc, hocKy: currentHocKy });
        setSelectedTuan(defaultTuan);

        try {
          const examRes = await getLichThiByLop(sLopId);
          if (active) setExams(examRes?.data?.data || []);
        } catch { /* ignore */ }
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu thời khóa biểu.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchInit();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const refetch = async () => {
      try {
        const studentRes = await getCurrentHocSinh();
        const sLopId = studentRes?.data?.data?.lop?.id;
        if (!sLopId) return;
        const res = await getThoiKhoaBieu({ 
          lopId: sLopId, 
          namHoc: yearInfo.tenNamHoc, 
          hocKy: yearInfo.hocKy, 
          tuan: selectedTuan 
        });
        if (!active) return;
        setTimetable(res?.data?.data || []);
      } catch { /* ignore */ }
    };
    refetch();
    return () => { active = false; };
  }, [selectedTuan, yearInfo.tenNamHoc, yearInfo.hocKy]);

  /* ── Schedule map (day → period → entries) ── */
  const scheduleMap = useMemo(() => {
    const map = new Map();
    // Tính selectedWeekStart ngay bên trong để tránh lỗi TDZ
    let weekStart = new Date();
    if (yearInfo.tenNamHoc) {
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

      // Skip dates between Sept 1st and Sept 4th
      const dayDiff = day - 2;
      const targetDate = new Date(weekStart);
      targetDate.setDate(weekStart.getDate() + dayDiff);
      const m = targetDate.getMonth() + 1;
      const d = targetDate.getDate();
      if (m === 9 && d >= 1 && d <= 4) {
        return;
      }

      for (let p = start; p < start + count; p++) {
        const key = `${day}-${p}`;
        const entries = map.get(key) || [];
        entries.push(item);
        map.set(key, entries);
      }
    });
    return map;
  }, [timetable, selectedTuan, yearInfo.tenNamHoc]);

  const getCellEntries = (day, period) => scheduleMap.get(`${day}-${period}`) || [];

  /* ── Visible days (hide Sunday if no classes) ── */
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

  /* ── Exams grouped by day-of-week for selected week ── */
  const examsByDay = useMemo(() => {
    const { monday } = getWeekDates(selectedTuan);
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
  }, [exams, selectedTuan, yearInfo.tenNamHoc]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const totalLessons = timetable.length;
    const uniqueDays = new Set(timetable.map((i) => i.thu)).size;
    const weekExamCount = Object.values(examsByDay).reduce((s, arr) => s + arr.length, 0);
    return { totalLessons, uniqueDays, weekExamCount };
  }, [timetable, examsByDay]);

  /* ── Date helpers ── */
  function getWeekDates(tuan) {
    if (!yearInfo.tenNamHoc) return { monday: new Date() };
    const startYear = parseInt(yearInfo.tenNamHoc.split("-")[0]);
    const schoolStart = new Date(startYear, 8, 5);
    const dow = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setDate(monday.getDate() + (tuan - 1) * 7);
    return { monday };
  }

  const selectedWeekStart = getWeekDates(selectedTuan).monday;

  const weekRangeText = useMemo(() => {
    const monday = selectedWeekStart;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `Tuần ${selectedTuan} (${formatShort(monday)} – ${formatShort(sunday)})`;
  }, [selectedTuan, selectedWeekStart]);

  const getDateByDay = (day) => {
    const offset = day === 8 ? 6 : day - 2;
    return addDays(selectedWeekStart, offset);
  };

  const todayThu = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const { monday } = getWeekDates(selectedTuan);
    const sunday = addDays(monday, 6);
    now.setHours(0, 0, 0, 0);
    return now >= monday && now <= sunday;
  }, [selectedTuan, yearInfo.tenNamHoc]);

  const todayDateStr = `${String(displayedDate.getDate()).padStart(2, "0")}/${String(displayedDate.getMonth() + 1).padStart(2, "0")}/${displayedDate.getFullYear()}`;

  const handleGoToCurrentWeek = () => {
    const today = new Date();
    setDisplayedDate(today);
    if (!yearInfo.tenNamHoc || !namHocList.length) return;
    const currentYear = namHocList.find(y => y.tenNamHoc === yearInfo.tenNamHoc);
    const startStr = currentYear?.ngayBatDauHk1 || `${parseInt(yearInfo.tenNamHoc.split("-")[0])}-09-05`;
    const schoolStart = new Date(startStr + "T00:00:00");
    const dow = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
    const diff = Math.floor((today - monday) / 86400000);
    if (diff >= 0) setSelectedTuan(Math.max(1, Math.floor(diff / 7) + 1));
  };

  const getSubjectLabel = (item) => item?.monHoc?.tenMon || "--";
  const getClassLabel = (item) => {
    const teacher = item?.giaoVien?.hoTen || "";
    const room = item?.phongHoc || "";
    if (teacher && room) return `${teacher} · ${room}`;
    return teacher || room || "";
  };

  const getExamThu = (exam) => {
    const dow = new Date(exam.ngayThi + "T00:00:00").getDay();
    return dow === 0 ? 8 : dow + 1;
  };

  /* ── Filter ── */
  const showLessons = filterType === "all" || filterType === "lessons";
  const showExams = filterType === "all" || filterType === "exams";

  /* ── Render row group ── */
  const renderSessionRows = (periods, sessionClass) =>
    periods.map((period, idx) => (
      <tr key={`p-${period}`}>
        {idx === 0 && (
          <td
            rowSpan={periods.length}
            className={`tkb-ca-hoc ${sessionClass}`}
          >
            {sessionClass === "tkb-sang" ? "Sáng" : "Chiều"}
          </td>
        )}
        <td className="tkb-period">{period}</td>
        {scheduleDays.map((day) => {
          const isToday = day === todayThu && isCurrentWeek;
          const cellLessons = showLessons ? getCellEntries(day, period) : [];
          const cellExams =
            showExams && idx === 0 && examsByDay[day]?.length
              ? examsByDay[day]
              : [];
          return (
            <td
              key={day}
              className={isToday ? "tkb-today-col" : ""}
            >
              {cellExams.map((exam, ei) => (
                <div className="tkb-entry tkb-entry-exam" key={`ex-${exam.id}-${ei}`}>
                  <div className="tkb-subject">
                    {exam.monHoc?.tenMon || "--"}{" "}
                    <span className="tkb-exam-type">({exam.loaiKiemTra || "KT"})</span>
                  </div>
                  <div className="tkb-class">
                    {exam.gioBatDau || "--"} · P.{exam.phongThi || "--"}
                  </div>
                </div>
              ))}
              {cellLessons.map((item, li) => (
                <div
                  className={`tkb-entry ${period <= 5 ? "tkb-entry-sang" : "tkb-entry-chieu"}`}
                  key={`${item.id || li}-p${period}`}
                >
                  <div className="tkb-subject">{getSubjectLabel(item)}</div>
                  <div className="tkb-class">{getClassLabel(item)}</div>
                  {item.ghiChu && (
                    <div style={{ marginTop: "4px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#fef3c7", color: "#d97706", fontSize: "0.75rem", fontWeight: 600, display: "inline-block" }}>
                      📝 {item.ghiChu}
                    </div>
                  )}
                </div>
              ))}
              {!cellLessons.length && !cellExams.length && (
                <div className="tkb-empty">&nbsp;</div>
              )}
            </td>
          );
        })}
      </tr>
    ));

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Thời khóa biểu</h2>
          <p className="student-hero-subtitle">
            Xem lịch học và lịch thi theo tuần.
          </p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">
            {loading ? "..." : stats.totalLessons} tiết
          </div>
          <div className="student-hero-chip">
            {loading ? "..." : stats.uniqueDays} ngày học
          </div>
          <div className="student-hero-chip">
            {loading ? "..." : stats.weekExamCount} lịch thi
          </div>
        </div>
      </section>

      <div className="card tkb-card">
        {/* Toolbar */}
        <div className="tkb-toolbar">
          <div className="tkb-toolbar-title">Lịch học, lịch thi theo tuần</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={yearInfo.tenNamHoc}
              onChange={(e) => setYearInfo(prev => ({ ...prev, tenNamHoc: e.target.value }))}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}
            >
              {namHocList.map(y => (
                <option key={y.id} value={y.tenNamHoc}>Năm học {y.tenNamHoc}</option>
              ))}
            </select>
            <select
              value={yearInfo.hocKy}
              onChange={(e) => setYearInfo(prev => ({ ...prev, hocKy: parseInt(e.target.value) }))}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12, fontWeight: 600, color: "#374151", background: "#fff", cursor: "pointer" }}
            >
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>
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
            <span 
              className="tkb-today-text" 
              onClick={() => dateInputRef.current?.showPicker()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, cursor: "pointer", position: "relative" }}
              title="Bấm để chọn ngày nhảy đến tuần tương ứng"
            >
              <MaterialIcon name="calendar_month" style={{ fontSize: 18, color: "#4b5563" }} />
              {todayDateStr}
              <input
                ref={dateInputRef}
                type="date"
                onChange={handleDateChange}
                style={{
                  position: "absolute",
                  visibility: "hidden",
                  width: 0,
                  height: 0,
                  pointerEvents: "none"
                }}
              />
            </span>
            <button
              className="tkb-btn"
              type="button"
              style={{ color: "#2563eb", fontWeight: 600 }}
              onClick={handleGoToCurrentWeek}
            >
              Hiện tại
            </button>
             <button
              className="tkb-btn"
              type="button"
              onClick={() => setSelectedTuan((prev) => Math.max(1, prev - 1))}
              disabled={selectedTuan <= 1}
            >
              ← Trở về
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb", display: "inline-flex", alignItems: "center", height: 38 }}>
              {weekRangeText}
            </span>
            <button
              className="tkb-btn"
              type="button"
              onClick={() => setSelectedTuan((prev) => Math.min(getCurrentSemesterWeek(yearInfo.tenNamHoc) + 2, prev + 1))}
              disabled={selectedTuan >= getCurrentSemesterWeek(yearInfo.tenNamHoc) + 2}
            >
              Tiếp →
            </button>
          </div>
        </div>

        {error && <div className="tkb-error">{error}</div>}

        {/* Bảng TKB */}
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
                    <th
                      key={day}
                      className={isToday ? "tkb-today-header" : ""}
                    >
                      <div>{getDayLabel(day)}</div>
                      <div className="tkb-date">
                        {d.getDate()}/{d.getMonth() + 1}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={2 + scheduleDays.length}
                    className="tkb-loading"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : (
                <>
                  {renderSessionRows(MORNING_PERIODS, "tkb-sang")}
                  {renderSessionRows(AFTERNOON_PERIODS, "tkb-chieu")}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="tkb-legend">
          <div className="tkb-legend-item">
            <div
              className="tkb-legend-dot"
              style={{ background: "#fff", borderLeft: "3px solid #3b82f6" }}
            />
            Lịch học buổi sáng
          </div>
          <div className="tkb-legend-item">
            <div
              className="tkb-legend-dot"
              style={{ background: "#fef9c3", borderLeft: "3px solid #f59e0b" }}
            />
            Lịch học buổi chiều
          </div>
          <div className="tkb-legend-item">
            <div
              className="tkb-legend-dot"
              style={{ background: "#dbeafe", borderLeft: "3px solid #3b82f6" }}
            />
            Lịch thi
          </div>
          <div className="tkb-legend-item">
            <div
              className="tkb-legend-dot"
              style={{ background: "#f0f9ff" }}
            />
            Ngày hôm nay
          </div>
        </div>
      </div>
    </div>
  );
}
