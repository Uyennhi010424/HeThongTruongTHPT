import { useEffect, useMemo, useState, useRef } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import { Link } from "react-router-dom";
import CachedAvatar from "../../../components/common/CachedAvatar.jsx";
import WeekPicker from "../../../components/edu/WeekPicker.jsx";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getThongBao } from "../../../api/thongbaoApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getThoiKhoaBieu, getGiaoVienThoiKhoaBieu, updateTkbNote } from "../../../api/thoikhoabieuApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import {
  findTeacherByUsername,
  getCurrentUsernameFromToken,
  getHomeroomAssignment,
  getTeacherSubjectLabel
} from "../../../utils/teacherProfile.js";
import { formatDate, getDayLabel, getCurrentSemesterWeek, getWeekDates } from "../../../utils/helpers.js";
import { normalizeVietnameseDisplay } from "../../../utils/normalizeText.js";

const nfc = normalizeVietnameseDisplay;

const getDayLabelCustom = (value) => {
  switch (value) {
    case 2: return "Thứ 2";
    case 3: return "Thứ 3";
    case 4: return "Thứ 4";
    case 5: return "Thứ 5";
    case 6: return "Thứ 6";
    case 7: return "Thứ 7";
    case 8: return "Chủ nhật";
    default: return "--";
  }
};

const getSubjectLabel = (item) => {
  return nfc(
    item?.monHoc?.tenMon ||
    item?.monHoc?.tenMonHoc ||
    item?.tenMon ||
    item?.tenMonHoc ||
    item?.monThi ||
    item?.ghiChu ||
    "--"
  );
};

const getClassLabel = (item) => {
  return nfc(item?.lopHoc?.tenLop || item?.lop?.tenLop || item?.tenLop || item?.maLop || "--");
};

const getNoticeTargetLabel = (value) => {
  switch (value) {
    case "GIAO_VIEN": return "Giáo viên";
    case "ALL": return "Toàn trường";
    default: return value || "Khác";
  }
};

const getInitials = (name) => {
  if (!name) return "GV";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].charAt(0).toUpperCase();
};

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);
  const [yearInfo, setYearInfo] = useState({ tenNamHoc: "", hocKy: 1 });
  const [namHocList, setNamHocList] = useState([]);

  const getTeacherWeekDates = (tuan) => {
    const year = namHocList.find((y) => y.tenNamHoc === yearInfo.tenNamHoc);
    const { monday } = getWeekDates(tuan, year);
    const dates = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getTeacherWeekDates(selectedTuan);
  const weekLabel = `${weekDates[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – ${weekDates[5].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate()
      && date.getMonth() === today.getMonth()
      && date.getFullYear() === today.getFullYear();
  };

  const todayDayOfWeek = new Date().getDay();
  // JS: 0=CN, 1=T2...6=T7 → map to our format: 2=T2...7=T7
  const todayThu = todayDayOfWeek === 0 ? 8 : todayDayOfWeek + 1;

  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [data, setData] = useState({
    notices: [],
    classes: [],
    subjects: [],
    timetable: [],
    teachers: [],
    assignments: [],
    phanCong: []
  });
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [noticesRes, classesRes, subjectsRes, teachersRes, chuNhiemRes, phanCongRes, namHocRes] =
          await Promise.all([
            getThongBao(),
            getLop(),
            getMonHoc(),
            getCurrentGiaoVien(),
            getChuNhiem(),
            getPhanCongDay(),
            getNamHoc()
          ]);
        if (!active) return;

        const years = namHocRes?.data?.data || [];
        setNamHocList(years);
        const currentYear = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[years.length - 1];
        const tenNamHoc = currentYear?.tenNamHoc || "";
        let hocKy = 1;
        if (currentYear?.ngayBatDauHk2) {
          const today = new Date().toISOString().slice(0, 10);
          if (today >= currentYear.ngayBatDauHk2) hocKy = 2;
        }

        let defaultTuan = getCurrentSemesterWeek(currentYear);
        if (!active) return;
        setSelectedTuan(defaultTuan);
        setYearInfo({ tenNamHoc, hocKy });

        const timetableRes = await getGiaoVienThoiKhoaBieu({ namHoc: tenNamHoc, hocKy, tuan: defaultTuan });
        const tkbData = timetableRes?.data?.data || [];

        // (removed unused fetch for all timetable weeks)

        if (!active) return;

        setData({
          notices: noticesRes?.data?.data || [],
          classes: classesRes?.data?.data || [],
          subjects: subjectsRes?.data?.data || [],
          timetable: tkbData,
          teachers: teachersRes?.data?.data ? [teachersRes.data.data] : [],
          assignments: chuNhiemRes?.data?.data || [],
          phanCong: phanCongRes?.data?.data || []
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!yearInfo.tenNamHoc || selectedTuan < 1 || !namHocList.length) return;
    let active = true;

    const currentYearData = namHocList.find(y => y.tenNamHoc === yearInfo.tenNamHoc);
    let actualHk = yearInfo.hocKy;
    if (currentYearData && currentYearData.ngayBatDauHk2) {
      const schoolStart = currentYearData.ngayBatDauHk1 ? new Date(currentYearData.ngayBatDauHk1 + "T00:00:00") : new Date(new Date().getFullYear(), 8, 5);
      const dow = schoolStart.getDay();
      const monday = new Date(schoolStart);
      monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
      monday.setDate(monday.getDate() + (selectedTuan - 1) * 7);
      
      const hk2Start = new Date(currentYearData.ngayBatDauHk2 + "T00:00:00");
      actualHk = (monday >= hk2Start) ? 2 : 1;
      
      if (actualHk !== yearInfo.hocKy) {
        setYearInfo(prev => ({ ...prev, hocKy: actualHk }));
        return; // Let the re-render trigger the effect with the new hocKy
      }
    }

    const refetchTkb = async () => {
      try {
        const res = await getGiaoVienThoiKhoaBieu({ namHoc: yearInfo.tenNamHoc, hocKy: actualHk, tuan: selectedTuan });
        if (!active) return;
        setData((prev) => ({ ...prev, timetable: res?.data?.data || [] }));
      } catch {
        // ignore
      }
    };
    refetchTkb();
    return () => { active = false; };
  }, [selectedTuan, yearInfo.tenNamHoc, yearInfo.hocKy, namHocList]);

  const [apiTeacher, setApiTeacher] = useState(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const dateInputRef = useRef(null);

  const handleDateChange = (e) => {
    const selectedDateStr = e.target.value; // "YYYY-MM-DD"
    if (!selectedDateStr || !namHocList.length) return;

    const selectedDate = new Date(selectedDateStr + "T00:00:00");
    setDisplayedDate(selectedDate);

    const sortedYears = [...namHocList].sort((a, b) => 
      new Date(b.ngayBatDauHk1 + "T00:00:00") - new Date(a.ngayBatDauHk1 + "T00:00:00")
    );

    const matchedYear = sortedYears.find(y => 
      selectedDate >= new Date(y.ngayBatDauHk1 + "T00:00:00")
    ) || sortedYears[sortedYears.length - 1];

    if (!matchedYear) return;

    let calculatedHocKy = 1;
    if (matchedYear.ngayBatDauHk2) {
      if (selectedDateStr >= matchedYear.ngayBatDauHk2) {
        calculatedHocKy = 2;
      }
    }

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

  const handleEntryClick = (item) => {
    setEditingEntry(item);
    setNoteText(item.ghiChu || "");
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    try {
      await updateTkbNote(editingEntry.id, noteText);
      notifySuccess("Lưu thông báo cho lớp thành công.");
      setData((prev) => ({
        ...prev,
        timetable: prev.timetable.map((t) =>
          t.id === editingEntry.id ? { ...t, ghiChu: noteText } : t
        )
      }));
      setNoteModalOpen(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi lưu thông báo.");
    }
  };

  useEffect(() => {
    getCurrentGiaoVien()
      .then((res) => setApiTeacher(res?.data?.data || null))
      .catch(() => {});
  }, []);

  const currentTeacher = useMemo(() => {
    if (apiTeacher) return apiTeacher;
    return findTeacherByUsername(data.teachers, currentUsername);
  }, [apiTeacher, data.teachers, currentUsername]);

  const homeroomAssignment = useMemo(() => {
    return getHomeroomAssignment(currentTeacher, data.assignments);
  }, [currentTeacher, data.assignments]);

  const teacherSubjectLabels = useMemo(() => {
    const subjectLabel = getTeacherSubjectLabel(currentTeacher);
    if (subjectLabel !== "Giáo viên") {
      return subjectLabel.split(",").map((item) => item.trim()).filter(Boolean);
    }

    const fallbackSubjects = new Set();
    data.timetable.forEach((item) => {
      const teacherMatches =
        currentTeacher &&
        [item?.giaoVienId, item?.giaoVien?.id, item?.teacherId, item?.gvId]
          .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
          .some((v) => Number(v) === Number(currentTeacher.id));
      if (!teacherMatches) return;
      const label = getSubjectLabel(item);
      if (label && label !== "--") fallbackSubjects.add(label);
    });
    return Array.from(fallbackSubjects);
  }, [currentTeacher, data.timetable]);

  const teacherClasses = useMemo(() => {
    const classIds = new Set();
    (data.phanCong || []).forEach((entry) => {
      const teacherMatches =
        currentTeacher &&
        [entry?.giaoVienId, entry?.giaoVien?.id]
          .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
          .some((v) => Number(v) === Number(currentTeacher?.id));
      if (!teacherMatches) return;
      const classId = entry?.lopId ?? entry?.lop?.id ?? entry?.lopHocId ?? entry?.lopHoc?.id;
      if (classId != null) classIds.add(String(classId));
    });
    const matched = data.classes.filter((c) => classIds.has(String(c.id)));
    if (matched.length > 0) return matched;

    if (homeroomAssignment?.lopId != null) classIds.add(String(homeroomAssignment.lopId));
    data.timetable.forEach((item) => {
      const teacherMatches =
        currentTeacher &&
        [item?.giaoVienId, item?.giaoVien?.id, item?.teacherId, item?.gvId]
          .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
          .some((v) => Number(v) === Number(currentTeacher.id));
      if (!teacherMatches) return;
      const classId = item?.lopId ?? item?.lopHocId ?? item?.lop?.id ?? item?.lopHoc?.id;
      if (classId != null) classIds.add(String(classId));
    });
    return data.classes.filter((c) => classIds.has(String(c.id)));
  }, [currentTeacher, data.classes, data.timetable, homeroomAssignment, data.phanCong]);

  const teacherTimetable = useMemo(() => {
    return data.timetable || [];
  }, [data.timetable]);

  const timetableSorted = useMemo(() => {
    return [...teacherTimetable].sort(
      (a, b) => (Number(a.thu) || 0) - (Number(b.thu) || 0) || (Number(a.tietBatDau) || 0) - (Number(b.tietBatDau) || 0)
    );
  }, [teacherTimetable]);

  const weekRangeText = useMemo(() => {
    if (!yearInfo.tenNamHoc || !namHocList.length) return `Tuần ${selectedTuan}`;
    const year = namHocList.find((y) => y.tenNamHoc === yearInfo.tenNamHoc);
    const startStr = year?.ngayBatDauHk1 || `${parseInt(yearInfo.tenNamHoc.split("-")[0])}-09-05`;
    
    const schoolStart = new Date(startStr + "T00:00:00");
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setDate(monday.getDate() + (selectedTuan - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `Tuần ${selectedTuan} (${formatShort(monday)} – ${formatShort(sunday)})`;
  }, [selectedTuan, yearInfo.tenNamHoc, namHocList]);

  const teacherNotices = useMemo(() => {
    return [...data.notices]
      .filter((item) => item.doiTuong === "GIAO_VIEN" || item.doiTuong === "ALL")
      .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang));
  }, [data.notices]);

  const latestNotices = useMemo(() => teacherNotices.slice(0, 5), [teacherNotices]);

  const stats = useMemo(() => ({
    classes: teacherClasses.length,
    subjects: teacherSubjectLabels.length,
    timetable: teacherTimetable.length,
    notices: teacherNotices.length
  }), [teacherClasses.length, teacherSubjectLabels.length, teacherTimetable.length, teacherNotices.length]);

  const timetableGrid = useMemo(() => {
    const grid = {};
    [2, 3, 4, 5, 6, 7].forEach((d) => { grid[d] = {}; });
    timetableSorted.forEach((item) => {
      const day = Number(item.thu);
      const start = Number(item.tietBatDau);
      const count = Math.max(1, Number(item.soTiet || 1));
      if (!grid[day]) grid[day] = {};
      for (let p = start; p < start + count; p++) {
        if (!grid[day][p]) grid[day][p] = [];
        grid[day][p].push(item);
      }
    });
    return grid;
  }, [timetableSorted]);

  const isCurrentWeek = useMemo(() => {
    return weekDates.some((d) => isToday(d));
  }, [weekDates]);

  return (
    <div style={{ maxWidth: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Teacher strip header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 24, borderBottom: "1px solid #e2e8f0" }}>
        <CachedAvatar
          username={currentUsername}
          role="teacher"
          fallback={getInitials(currentTeacher?.hoTen)}
          className="teacher-strip-avatar"
          fallbackClassName="teacher-strip-avatar"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="teacher-strip-name">
            {currentTeacher?.hoTen || "Giáo viên"}
            {homeroomAssignment && <span className="teacher-strip-badge">GVCN</span>}
          </div>
          <div className="teacher-strip-subject">
            {getTeacherSubjectLabel(currentTeacher)} · {formatDate(new Date())}
          </div>
          <div className="teacher-strip-stats">
            <span className="teacher-strip-stat">
              <strong>{loading ? "…" : stats.classes}</strong> lớp
            </span>
            <span className="teacher-strip-dot">·</span>
            <span className="teacher-strip-stat">
              <strong>{loading ? "…" : stats.timetable}</strong> tiết/tuần
            </span>
            <span className="teacher-strip-dot">·</span>
            <span className="teacher-strip-stat">
              <strong>{loading ? "…" : stats.notices}</strong> thông báo
            </span>
          </div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && (
        <>
          {/* Timetable */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#00236f", marginLeft: "16px" }}>Thời khóa biểu</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#00236f", marginLeft: 16 }}>
                  Năm học {yearInfo.tenNamHoc} - Học kỳ {yearInfo.hocKy === 1 ? 'I' : 'II'}
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#f8fafc", padding: "4px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <button
                  className="tkb-btn"
                  onClick={() => setSelectedTuan((w) => Math.max(1, w - 1))}
                  disabled={selectedTuan <= 1}
                  title="Tuần trước"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", minWidth: 160, textAlign: "center" }}>
                  {weekRangeText}
                </span>
                <button
                  className="tkb-btn"
                  onClick={() => setSelectedTuan((w) => Math.min(getCurrentSemesterWeek(yearInfo.tenNamHoc) + 2, w + 1))}
                  disabled={selectedTuan >= getCurrentSemesterWeek(yearInfo.tenNamHoc) + 2}
                  title="Tuần sau"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                </button>
                <span 
                  className="tkb-today-text" 
                  onClick={() => dateInputRef.current?.showPicker()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, cursor: "pointer", position: "relative" }}
                  title="Bấm để chọn ngày nhảy đến tuần tương ứng"
                >
                  <MaterialIcon name="calendar_month" style={{ fontSize: 18, color: "#4b5563" }} />
                  {`${String(displayedDate.getDate()).padStart(2, "0")}/${String(displayedDate.getMonth() + 1).padStart(2, "0")}/${displayedDate.getFullYear()}`}
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
                  style={{ color: "#2563eb", fontWeight: 600 }}
                  onClick={() => {
                    const today = new Date();
                    setDisplayedDate(today);
                    if (yearInfo.tenNamHoc && namHocList.length) {
                      const year = namHocList.find((y) => y.tenNamHoc === yearInfo.tenNamHoc);
                      if (year?.ngayBatDauHk1) {
                        const schoolStart = new Date(year.ngayBatDauHk1 + "T00:00:00");
                        const dow = schoolStart.getDay();
                        const monday = new Date(schoolStart);
                        monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
                        const diff = Math.floor((today - monday) / 86400000);
                        if (diff >= 0) setSelectedTuan(Math.max(1, Math.floor(diff / 7) + 1));
                      }
                    }
                  }}
                >
                  Hôm nay
                </button>
              </div>
            </div>

            <div className="tkb-table-wrap">
              <table className="tkb-table">
                <thead>
                  <tr>
                    <th className="tkb-header-ca">Ca học</th>
                    <th className="tkb-header-tiet">Tiết</th>
                    {[2, 3, 4, 5, 6, 7].map((day, idx) => (
                      <th
                        key={day}
                        className={day === todayThu && isCurrentWeek ? "tkb-today-header" : ""}
                      >
                        {getDayLabel(day)}
                        <div className="tkb-date">{weekDates[idx].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Buổi sáng — 5 hàng */}
                  {[1, 2, 3, 4, 5].map((period, idx) => (
                    <tr key={`s-${period}`}>
                      {idx === 0 && (
                        <td rowSpan={5} className="tkb-ca-hoc tkb-sang">Sáng</td>
                      )}
                      <td className="tkb-period">{period}</td>
                      {[2, 3, 4, 5, 6, 7].map((day) => {
                        const entries = timetableGrid[day]?.[period] || [];
                        const isTodayCell = day === todayThu && isCurrentWeek;
                        return (
                          <td
                            key={day}
                            className={isTodayCell ? "tkb-today-col" : ""}
                          >
                            {entries.map((item) => (
                              <div 
                                key={item.id} 
                                className="tkb-entry tkb-entry-sang"
                                onClick={() => handleEntryClick(item)}
                                style={{ cursor: "pointer" }}
                                title="Bấm để viết thông báo / ghi chú"
                              >
                                <div className="tkb-subject">{getSubjectLabel(item)}</div>
                                <div className="tkb-class">{getClassLabel(item)}</div>
                                {item.ghiChu && (
                                  <div style={{ marginTop: 4, padding: "2px 4px", borderRadius: 4, backgroundColor: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 600 }}>
                                    📝 {item.ghiChu}
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Buổi chiều — 5 hàng */}
                  {[6, 7, 8, 9, 10].map((period, idx) => (
                    <tr key={`c-${period}`}>
                      {idx === 0 && (
                        <td rowSpan={5} className="tkb-ca-hoc tkb-chieu">Chiều</td>
                      )}
                      <td className="tkb-period">{period}</td>
                      {[2, 3, 4, 5, 6, 7].map((day) => {
                        const entries = timetableGrid[day]?.[period] || [];
                        const isTodayCell = day === todayThu && isCurrentWeek;
                        return (
                          <td
                            key={day}
                            className={isTodayCell ? "tkb-today-col" : ""}
                          >
                            {entries.map((item) => (
                              <div 
                                key={item.id} 
                                className="tkb-entry tkb-entry-chieu"
                                onClick={() => handleEntryClick(item)}
                                style={{ cursor: "pointer" }}
                                title="Bấm để viết thông báo / ghi chú"
                              >
                                <div className="tkb-subject">{getSubjectLabel(item)}</div>
                                <div className="tkb-class">{getClassLabel(item)}</div>
                                {item.ghiChu && (
                                  <div style={{ marginTop: 4, padding: "2px 4px", borderRadius: 4, backgroundColor: "#fef3c7", color: "#d97706", fontSize: 10, fontWeight: 600 }}>
                                    📝 {item.ghiChu}
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 24, fontSize: 13, marginTop: 12, color: "#64748b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #e2e8f0", background: "#fff" }} />
                Lịch dạy buổi sáng
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #f59e0b", background: "#fef9c3" }} />
                Lịch dạy buổi chiều
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #38bdf8", background: "#f0f9ff" }} />
                Ngày hôm nay
              </div>
            </div>
          </div>

          <SimpleModal
            open={noteModalOpen}
            title={`Ghi chú tiết học lớp ${editingEntry?.lop?.tenLop || editingEntry?.lopHoc?.tenLop || "--"} - môn ${editingEntry?.monHoc?.tenMon || "--"}`}
            onClose={() => setNoteModalOpen(false)}
          >
            <form onSubmit={handleSaveNote} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>
                Nhập ghi chú / Thông báo cho lớp học của tiết này:
              </span>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Ví dụ: Kiểm tra 15p, Nay học thực hành, Mang theo sách bài tập..."
                rows={3}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13, resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setNoteModalOpen(false)}
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  Lưu ghi chú
                </button>
              </div>
            </form>
          </SimpleModal>
        </>
      )}
    </div>
  );
}
