import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../../api/axiosClient.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getDiemDanh, saveAllDiemDanh, checkDiemDanhLock, getDiemDanhStatistics } from "../../../api/diemdanhApi.js";
import { getThoiKhoaBieu } from "../../../api/thoikhoabieuApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getStudentClass, getStudentClassId, formatDate, sortStudentsByGivenName } from "../../../utils/helpers.js";
import { getCurrentUsernameFromToken, findTeacherByUsername } from "../../../utils/teacherProfile.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";
import { getHolidays } from "../../../api/lichnamhocApi.js";
import Pagination from "../../../components/common/Pagination.jsx";

const STORAGE_KEY = "teacher_attendance_records_v3";
const LOCKS_KEY = "teacher_attendance_locks_v2";
const AUTO_NOTE = "Nghỉ quá 45 ngày - cần xử lý theo quy định.";

const DAY_LABELS = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7" };
const WEEK_DAYS = [2, 3, 4, 5, 6, 7];

const getWeekDates = (offset, anchorDate = new Date()) => {
  const now = new Date(anchorDate.getTime());
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const dates = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const thu = i + 2; // 2=Mon..7=Sat
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    dates[thu] = `${d.getFullYear()}-${month}-${dayStr}`;
  }
  return dates;
};

const LOAI_VANG_OPTIONS = [
  { value: "CO_MAT", label: "Có mặt", color: "status-active" },
  { value: "CO_PHEP", label: "Vắng có phép", color: "status-warning" },
  { value: "KHONG_PHEP", label: "Vắng không phép", color: "status-locked" },
];

const getToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};


const getRecordKey = (date, classId, tietHoc, studentId) => `${date}_${classId}_${tietHoc}_${studentId}`;
const getLockKey = (date, classId, tietHoc) => `${date}_${classId}_${tietHoc}`;

const normalizeNote = (note) => (note || "").replace(/\s+/g, " ").trim();

const upsertAutoNote = (note, absenceDays) => {
  const normalized = normalizeNote(note);
  if (absenceDays > 45) {
    if (!normalized) return AUTO_NOTE;
    if (normalized.includes(AUTO_NOTE)) return normalized;
    return `${normalized} ${AUTO_NOTE}`;
  }
  return normalizeNote(normalized.replace(AUTO_NOTE, ""));
};

export default function DiemDanhPage() {
  const filters = useTeacherFilters({ showSubject: false, showGrade: false });
  const {
    loading: filterLoading,
    error: filterError,
    currentTeacher,
    selectedNamHoc,
    selectedSemester,
    selectedClassId,
    allStudents: students,
    filteredClasses: classes,
    selectedClassObj: selectedClass
  } = filters;

  const [draftRecords, setDraftRecords] = useState({});
  const [locks, setLocks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedTiet, setSelectedTiet] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | statistics
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState([]); // TKB cua giao vien
  const [weekOffset, setWeekOffset] = useState(0);
  const [holidays, setHolidays] = useState([]);

  const anchorDate = useMemo(() => {
    if (!filters.allNamHoc || !filters.selectedNamHoc) return new Date();
    const currentYear = filters.allNamHoc.find(y => y.tenNamHoc === filters.selectedNamHoc);
    if (!currentYear) return new Date();

    const startHk1 = new Date(currentYear.ngayBatDauHk1 + "T00:00:00");
    const endHk1 = new Date(currentYear.ngayKetThucHk1 + "T00:00:00");
    const startHk2 = new Date(currentYear.ngayBatDauHk2 + "T00:00:00");
    const endHk2 = new Date(currentYear.ngayKetThucHk2 + "T00:00:00");
    
    let endYear = endHk2;
    if (isNaN(endYear.getTime())) {
      endYear = new Date(startHk1);
      endYear.setFullYear(startHk1.getFullYear() + 1);
      endYear.setMonth(4); // May
      endYear.setDate(31);
    }

    const now = new Date();
    if (now >= startHk1 && now <= endYear) return now;

    if (filters.selectedSemester === "HK2" && !isNaN(startHk2.getTime())) {
       return startHk2;
    }
    return startHk1;
  }, [filters.allNamHoc, filters.selectedNamHoc, filters.selectedSemester]);

  useEffect(() => {
    const month = String(anchorDate.getMonth() + 1).padStart(2, "0");
    const day = String(anchorDate.getDate()).padStart(2, "0");
    const ymd = `${anchorDate.getFullYear()}-${month}-${day}`;
    setSelectedDate(ymd);
    setWeekOffset(0);
  }, [anchorDate]);

  useEffect(() => {
    if (!currentTeacher?.id || !selectedNamHoc) return;
    let active = true;
    const fetchTkb = async () => {
      try {
        const hocKy = selectedSemester === "HK1" ? 1 : 2;
        const tkbRes = await getThoiKhoaBieu({ namHoc: selectedNamHoc, hocKy });
        if (!active) return;
        const allTkb = tkbRes?.data?.data || [];
        const scheduleData = allTkb.filter((item) => {
          const entryTeacherId = item?.giaoVienId ?? item?.giaoVien?.id;
          return entryTeacherId != null && Number(entryTeacherId) === Number(currentTeacher.id);
        });
        setTeacherSchedule(scheduleData);
        
        try {
          const holRes = await getHolidays();
          if (active) setHolidays(holRes?.data?.data?.map(h => h.ngay) || []);
        } catch { /* ignore */ }
      } catch { /* ignore */ }
    };
    fetchTkb();
    return () => { active = false; };
  }, [currentTeacher?.id, selectedNamHoc, selectedSemester]);

  // Load locks from localStorage
  useEffect(() => {
    try {
      const rawLocks = window.localStorage.getItem(LOCKS_KEY);
      if (rawLocks) {
        const parsedLocks = JSON.parse(rawLocks);
        if (parsedLocks && typeof parsedLocks === "object") setLocks(parsedLocks);
      }
    } catch { /* ignore */ }
  }, []);

  // Load attendance from DB when date/class/tiet changes
  useEffect(() => {
    if (!selectedDate || !selectedClassId || !selectedTiet) return;
    let active = true;

    const loadFromDb = async () => {
      try {
        const res = await getDiemDanh({ ngay: selectedDate, lopHocId: Number(selectedClassId), tietHoc: selectedTiet });
        if (!active) return;
        const records = res?.data?.data || [];

        if (records.length > 0) {
          setDraftRecords((prev) => {
            const merged = { ...prev };
            records.forEach((r) => {
              const studentId = r?.hocSinh?.id ?? r?.hocSinhId;
              if (!studentId) return;
              const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, studentId);
              merged[key] = {
                loaiVang: r.loaiVang || (r.khongPhep ? "KHONG_PHEP" : r.coPhep ? "CO_PHEP" : "CO_MAT"),
                soNgayVang: r.soNgayVang || 0,
                ghiChu: r.ghiChu || ""
              };
            });
            return merged;
          });
          const lockKey = getLockKey(selectedDate, selectedClassId, selectedTiet);
          setLocks((prev) => ({ ...prev, [lockKey]: true }));
        }

        try {
          const lockRes = await checkDiemDanhLock({ ngay: selectedDate, lopHocId: Number(selectedClassId), tietHoc: selectedTiet });
          if (lockRes?.data?.data?.locked) {
            const lockKey = getLockKey(selectedDate, selectedClassId, selectedTiet);
            setLocks((prev) => ({ ...prev, [lockKey]: true }));
          }
        } catch { /* ignore */ }
      } catch {
        try {
          const rawRecords = window.localStorage.getItem(STORAGE_KEY);
          if (rawRecords) {
            const parsedRecords = JSON.parse(rawRecords);
            if (parsedRecords && typeof parsedRecords === "object") setDraftRecords((prev) => ({ ...prev, ...parsedRecords }));
          }
        } catch { /* ignore */ }
      }
    };
    loadFromDb();
    return () => { active = false; };
  }, [selectedDate, selectedClassId, selectedTiet]);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    setIsDirty(false);
  }, [selectedClassId]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const classStudents = students.filter((s) => s.trangThai === 1 && String(getStudentClassId(s) || "") === selectedClassId);
    return sortStudentsByGivenName(classStudents);
  }, [students, selectedClassId]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when class / date / tiet / semester / year change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, selectedDate, selectedTiet, selectedNamHoc, selectedSemester]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Statistics pagination
  const [statsCurrentPage, setStatsCurrentPage] = useState(1);
  const [statsPageSize, setStatsPageSize] = useState(10);

  useEffect(() => {
    setStatsCurrentPage(1);
  }, [selectedClassId, selectedNamHoc, selectedSemester]);

  const statsList = useMemo(() => statsData?.hocSinh || [], [statsData]);
  const statsTotalPages = Math.max(1, Math.ceil(statsList.length / statsPageSize));
  const paginatedStatsList = useMemo(() => {
    const start = (statsCurrentPage - 1) * statsPageSize;
    return statsList.slice(start, start + statsPageSize);
  }, [statsList, statsCurrentPage, statsPageSize]);

  const selectedClassInternal = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // Tinh ngay trong tuan hien tai
  const weekDates = useMemo(() => getWeekDates(weekOffset, anchorDate), [weekOffset, anchorDate]);

  const currentYearObj = useMemo(() => {
    if (!filters.allNamHoc || !filters.selectedNamHoc) return null;
    return filters.allNamHoc.find(y => y.tenNamHoc === filters.selectedNamHoc);
  }, [filters.allNamHoc, filters.selectedNamHoc]);

  // Cac ngay giao vien co lich day (theo lop dang chon)
  const availableDays = useMemo(() => {
    if (!teacherSchedule.length) return [];
    const days = new Set();
    teacherSchedule.forEach((item) => {
      if (selectedClassId && String(item?.lop?.id ?? item?.lopId) !== selectedClassId) return;
      const thu = Number(item.thu);
      if (thu >= 2 && thu <= 7) days.add(thu);
    });
    return WEEK_DAYS.filter((d) => {
      if (!days.has(d)) return false;
      const dateStr = weekDates[d];
      if (holidays.includes(dateStr)) return false;
      
      if (currentYearObj) {
        if (selectedSemester === "HK1") {
          if (currentYearObj.ngayBatDauHk1 && dateStr < currentYearObj.ngayBatDauHk1) return false;
          if (currentYearObj.ngayKetThucHk1 && dateStr > currentYearObj.ngayKetThucHk1) return false;
        } else if (selectedSemester === "HK2") {
          if (currentYearObj.ngayBatDauHk2 && dateStr < currentYearObj.ngayBatDauHk2) return false;
          if (currentYearObj.ngayKetThucHk2 && dateStr > currentYearObj.ngayKetThucHk2) return false;
        }
      }
      return true;
    });
  }, [teacherSchedule, selectedClassId, weekDates, holidays, currentYearObj, selectedSemester]);

  // Cac tiet giao vien co lich day ngay dang chon (theo lop dang chon)
  const availablePeriods = useMemo(() => {
    if (!teacherSchedule.length || !selectedDate) return [];
    // Tim thu tuong ung voi selectedDate
    const thuOfDate = Object.entries(weekDates).find(([, dateStr]) => dateStr === selectedDate);
    if (!thuOfDate) return [];
    const thu = Number(thuOfDate[0]);
    const periods = new Set();
    teacherSchedule.forEach((item) => {
      if (selectedClassId && String(item?.lop?.id ?? item?.lopId) !== selectedClassId) return;
      if (Number(item.thu) !== thu) return;
      const start = Number(item.tietBatDau);
      const count = Math.max(1, Number(item.soTiet || 1));
      for (let p = start; p < start + count; p++) periods.add(p);
    });
    return Array.from(periods).sort((a, b) => a - b);
  }, [teacherSchedule, selectedClassId, selectedDate, weekDates]);

  // Tu dong chon ngay va tiet phu hop khi doi lop hoac tuan
  useEffect(() => {
    if (!availableDays.length) return;
    const firstDay = availableDays[0];
    const dateForDay = weekDates[firstDay];
    if (dateForDay && dateForDay !== selectedDate) {
      setSelectedDate(dateForDay);
      setIsDirty(false);
    }
  }, [availableDays, weekDates]);

  useEffect(() => {
    if (!availablePeriods.length) return;
    if (!availablePeriods.includes(selectedTiet)) {
      setSelectedTiet(availablePeriods[0]);
      setIsDirty(false);
    }
  }, [availablePeriods, selectedTiet]);

  const isAlreadySaved = useMemo(() => {
    if (!selectedDate || !selectedClassId || !selectedTiet) return false;
    return Boolean(locks[getLockKey(selectedDate, selectedClassId, selectedTiet)]);
  }, [locks, selectedDate, selectedClassId, selectedTiet]);

  const isNotToday = selectedDate !== getToday();
  const attendanceLocked = isNotToday || isAlreadySaved;

  const stats = useMemo(() => {
    let present = 0, absentAllowed = 0, absentUnallowed = 0, over45 = 0;
    filteredStudents.forEach((student) => {
      const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, student.id);
      const record = draftRecords[key] || { loaiVang: "CO_MAT", soNgayVang: 0, ghiChu: "" };
      if (record.loaiVang === "KHONG_PHEP") absentUnallowed++;
      else if (record.loaiVang === "CO_PHEP") absentAllowed++;
      else present++;
      if ((record.soNgayVang || 0) > 45) over45++;
    });
    return { present, absentAllowed, absentUnallowed, over45 };
  }, [draftRecords, filteredStudents, selectedDate, selectedClassId, selectedTiet]);

  const updateRecord = (studentId, patch) => {
    if (!selectedClassId || attendanceLocked) return;
    const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, studentId);
    setDraftRecords((prev) => {
      const current = prev[key] || { loaiVang: "CO_MAT", soNgayVang: 0, ghiChu: "" };
      const merged = { ...current, ...patch };
      merged.soNgayVang = Number.isFinite(Number(merged.soNgayVang)) ? Math.max(0, Number(merged.soNgayVang)) : 0;
      merged.ghiChu = upsertAutoNote(merged.ghiChu, merged.soNgayVang);
      return { ...prev, [key]: merged };
    });
    setSaveMessage("");
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedClassId || attendanceLocked || !currentTeacher?.id) return;
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const records = [];
      filteredStudents.forEach((student) => {
        const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, student.id);
        const draft = draftRecords[key] || { loaiVang: "CO_MAT", soNgayVang: 0, ghiChu: "" };
        records.push({
          ngay: selectedDate,
          lopHoc: { id: Number(selectedClassId) },
          hocSinh: { id: student.id },
          tietHoc: selectedTiet,
          loaiVang: draft.loaiVang || "CO_MAT",
          coPhep: draft.loaiVang === "CO_PHEP",
          khongPhep: draft.loaiVang === "KHONG_PHEP",
          soNgayVang: Number(draft.soNgayVang) || 0,
          ghiChu: draft.ghiChu || "",
          giaoVien: { id: currentTeacher.id }
        });
      });
      if (records.length === 0) {
        setSaveMessage("Không có dữ liệu điểm danh để lưu.");
        setSaving(false);
        return;
      }
      await saveAllDiemDanh(records);
      // Invalidate diemdanh cache so student/parent pages see updated data
      axiosClient.invalidateCache("/diemdanh");
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords)); } catch { /* ignore */ }
      const lockKey = getLockKey(selectedDate, selectedClassId, selectedTiet);
      const nextLocks = { ...locks, [lockKey]: true };
      setLocks(nextLocks);
      try { window.localStorage.setItem(LOCKS_KEY, JSON.stringify(nextLocks)); } catch { /* ignore */ }
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      notifySuccess(`Đã lưu ${records.length} bản ghi điểm danh.`);
      setSaveMessage(`Đã lưu ${records.length} bản ghi điểm danh.`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể lưu điểm danh.";
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const loadStatistics = async () => {
    if (!selectedClassId) return;
    setStatsLoading(true);
    try {
      const namHoc = filters.selectedNamHoc || "2025-2026";
      const year = parseInt(namHoc.split("-")[0]);
      const from = `${year}-09-01`;
      const to = `${year + 1}-06-30`;
      const res = await getDiemDanhStatistics(Number(selectedClassId), from, to);
      setStatsData(res?.data?.data || null);
    } catch {
      setStatsData(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "statistics" && selectedClassId) loadStatistics();
  }, [activeTab, selectedClassId]);

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", width: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", letterSpacing: "-0.025em", margin: 0 }}>Điểm danh</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>Quản lý điểm danh và thống kê chuyên cần</p>
        </div>
        
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
            <button
              type="button"
              style={{
                padding: "8px 16px", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: activeTab === "attendance" ? "#fff" : "transparent",
                color: activeTab === "attendance" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "attendance" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s"
              }}
              onClick={() => setActiveTab("attendance")}
            >
              Điểm danh
            </button>
            <button
              type="button"
              style={{
                padding: "8px 16px", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: activeTab === "statistics" ? "#fff" : "transparent",
                color: activeTab === "statistics" ? "#0f172a" : "#64748b",
                boxShadow: activeTab === "statistics" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s"
              }}
              onClick={() => setActiveTab("statistics")}
            >
              Thống kê chuyên cần
            </button>
          </div>
          
          <TeacherFilter filters={filters} showSubject={false} showGrade={false} showClass={false} />
        </div>
      </div>

      {/* Tabs chọn lớp ngang */}
      {filters.filteredClasses && filters.filteredClasses.length > 0 && (
        <div className="flex gap-6 overflow-x-auto border-b border-slate-200 hide-scrollbar bg-white px-2 rounded-t-xl mb-4">
          {filters.filteredClasses.map(c => {
            const isSelected = String(filters.selectedClassId) === String(c.id);
            return (
              <button
                key={c.id}
                onClick={() => filters.setSelectedClassId(String(c.id))}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-semibold text-[14px] transition-all border-b-2 ${
                  isSelected
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                Lớp {c.tenLop}
              </button>
            );
          })}
        </div>
      )}



      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: "1px solid #e5e7eb", width: "100%" }}>
            
            {/* Nhóm trái */}
            <div style={{ flexShrink: 0 }}>
              <button type="button" onClick={() => setWeekOffset(0)} style={{ padding: "0 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, cursor: "pointer", color: "#0f172a", fontWeight: 600, height: 40, display: "flex", alignItems: "center", transition: "background 0.15s", whiteSpace: "nowrap" }}>Hôm nay</button>
            </div>

            {/* Nhóm giữa (Co giãn) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, justifyContent: "center" }}>
              <button type="button" onClick={() => setWeekOffset((p) => p - 1)} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid transparent", background: "transparent", cursor: "pointer", color: "#64748b", transition: "all 0.15s", flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span></button>
              
              <div style={{ display: "flex", gap: 4, alignItems: "center", overflowX: "auto", minWidth: 0 }}>
                {availableDays.map((thu) => {
                  const dateStr = weekDates[thu];
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={thu}
                      type="button"
                      onClick={() => { setSelectedDate(dateStr); setIsDirty(false); }}
                      style={{
                        height: 40, padding: "0 12px", borderRadius: 8, border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                        background: isSelected ? "#eff6ff" : "transparent", color: isSelected ? "#1d4ed8" : "#475569",
                        fontWeight: isSelected ? 600 : 500, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0
                      }}
                    >
                      {DAY_LABELS[thu]}
                      <span style={{ fontSize: 13, fontWeight: 400, color: isSelected ? "#3b82f6" : "#94a3b8" }}>
                        {dateStr ? formatDate(dateStr) : ""}
                      </span>
                    </button>
                  );
                })}
                {availableDays.length === 0 && !loading && (
                  <span style={{ fontSize: 14, color: "#9ca3af", fontStyle: "italic", whiteSpace: "nowrap" }}>Không có lịch dạy</span>
                )}
              </div>

              <button type="button" onClick={() => setWeekOffset((p) => p + 1)} style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid transparent", background: "transparent", cursor: "pointer", color: "#64748b", transition: "all 0.15s", flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span></button>
            </div>

            {/* Nhóm phải */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Tiết:</span>
                <select value={selectedTiet} onChange={(e) => { setSelectedTiet(Number(e.target.value)); setIsDirty(false); }} style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", outline: "none", cursor: "pointer", color: "#0f172a" }}>
                  {availablePeriods.map((p) => <option key={p} value={p}>Tiết {p}</option>)}
                </select>
              </label>

              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || !selectedClassId || attendanceLocked || saving || !availablePeriods.length}
                style={{
                  height: 40, padding: "0 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                  background: (!isDirty || !selectedClassId || attendanceLocked || saving || !availablePeriods.length) ? "#f1f5f9" : "#2563eb",
                  color: (!isDirty || !selectedClassId || attendanceLocked || saving || !availablePeriods.length) ? "#94a3b8" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", whiteSpace: "nowrap"
                }}
              >
                {saving ? "Đang lưu..." : attendanceLocked ? "Đã khóa" : "Cập nhật"}
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, padding: "8px 0 24px 0" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Có mặt:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>{loading ? "..." : stats.present}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Vắng có phép:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#ca8a04" }}>{loading ? "..." : stats.absentAllowed}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Vắng không phép:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#dc2626" }}>{loading ? "..." : stats.absentUnallowed}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>Nghỉ quá 45 ngày:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>{loading ? "..." : stats.over45}</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#F8FAFC", borderTop: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Bảng điểm danh {selectedClass?.tenLop || ""} · {formatDate(selectedDate)} · Tiết {selectedTiet}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Chọn trạng thái: Có mặt / Vắng có phép / Vắng không phép</div>
              </div>
              <div style={{ background: "#e2e8f0", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#475569" }}>
                {filteredStudents.length} học sinh
              </div>
            </div>

            {error && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626" }}>{error}</div>}
            {!error && saveMessage && <div style={{ padding: 16, background: "#dcfce7", color: "#16a34a", fontWeight: 500 }}>{saveMessage}</div>}
            {!error && !loading && selectedClassId && filteredStudents.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Lớp này chưa có học sinh.</div>
            )}
            {selectedClassId && attendanceLocked && (
              <div style={{ padding: "12px 0", color: "#1d4ed8", fontWeight: 500, fontSize: 14 }}>
                {isAlreadySaved 
                  ? `Lớp ${selectedClass?.tenLop || "--"} đã được điểm danh tiết ${selectedTiet} ngày ${formatDate(selectedDate)} và không thể sửa lại.`
                  : "Chỉ được phép điểm danh cho ngày hôm nay."}
              </div>
            )}

            {!!selectedClassId && filteredStudents.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead style={{ background: "#F8FAFC", position: "sticky", top: 0, zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Học sinh</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Trạng thái</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb", width: 140 }}>Số ngày vắng</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`skel-${i}`}>
                            <td colSpan={4} style={{ padding: 16 }}>Đang tải...</td>
                          </tr>
                        ))
                      : paginatedStudents.map((student, idx) => {
                          const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, student.id);
                          const record = draftRecords[key] || { loaiVang: "CO_MAT", soNgayVang: 0, ghiChu: "" };
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={student.id} style={{ background: isEven ? "#fff" : "#f8fafc", transition: "background 0.15s" }}>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{student.hoTen}</div>
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{getStudentClass(student)?.tenLop || "--"}</div>
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                                  {LOAI_VANG_OPTIONS.map((opt) => {
                                    const isSelected = record.loaiVang === opt.value;
                                    return (
                                      <label
                                        key={opt.value}
                                        style={{
                                          display: "flex", alignItems: "center", gap: 6, cursor: attendanceLocked ? "default" : "pointer",
                                          color: isSelected ? (opt.value === "CO_MAT" ? "#16a34a" : opt.value === "CO_PHEP" ? "#ca8a04" : "#dc2626") : "#64748b",
                                          fontWeight: isSelected ? 600 : 400, fontSize: 13, transition: "color 0.15s"
                                        }}
                                      >
                                        <input
                                          type="radio"
                                          name={`loaiVang_${student.id}`}
                                          value={opt.value}
                                          checked={isSelected}
                                          disabled={attendanceLocked}
                                          onChange={() => updateRecord(student.id, { loaiVang: opt.value, soNgayVang: opt.value === "CO_MAT" ? 0 : record.soNgayVang || 1 })}
                                          style={{ cursor: attendanceLocked ? "default" : "pointer", accentColor: opt.value === "CO_MAT" ? "#16a34a" : opt.value === "CO_PHEP" ? "#ca8a04" : "#dc2626", width: 14, height: 14 }}
                                        />
                                        {opt.label}
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={record.soNgayVang}
                                  disabled={attendanceLocked || record.loaiVang === "CO_MAT"}
                                  onChange={(e) => updateRecord(student.id, { soNgayVang: e.target.value })}
                                  style={{
                                    width: 60, padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd5e1",
                                    textAlign: "center", fontSize: 13, background: (attendanceLocked || record.loaiVang === "CO_MAT") ? "#f1f5f9" : "#fff",
                                    color: (attendanceLocked || record.loaiVang === "CO_MAT") ? "#94a3b8" : "#0f172a"
                                  }}
                                />
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                                <input
                                  value={record.ghiChu}
                                  disabled={attendanceLocked}
                                  onChange={(e) => updateRecord(student.id, { ghiChu: e.target.value })}
                                  placeholder="Nhận xét / Lý do..."
                                  style={{
                                    width: "100%", padding: "6px 12px", borderRadius: 6, border: "1px solid #cbd5e1",
                                    fontSize: 13, background: attendanceLocked ? "#f1f5f9" : "#fff"
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attendance Pagination */}
            {!loading && filteredStudents.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredStudents.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                  pageSizeOptions={[10, 20, 30, 50, 100]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "statistics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {statsLoading && <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu thống kê...</div>}
          {!statsLoading && !statsData && <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Không có dữ liệu.</div>}
          
          {!statsLoading && statsData && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "8px 0" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Tổng số ngày học:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1d4ed8" }}>{statsData.tongNgayHoc}</span>
              </div>
              
              <div style={{ background: "#F8FAFC", borderTop: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div style={{ padding: "16px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Thống kê chuyên cần {selectedClass?.tenLop || ""}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Năm học {filters.selectedNamHoc || "2025-2026"}</div>
                  </div>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead style={{ background: "#F8FAFC", position: "sticky", top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Học sinh</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Có phép</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Không phép</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Tổng vắng</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Tỷ lệ vắng</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e5e7eb" }}>Chuyên cần</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStatsList.map((hs, idx) => {
                        const tongNgay = hs.tongNgayHoc || statsData.tongNgayHoc || 1;
                        const tyLeVang = tongNgay > 0 ? Math.round((hs.tongVang / tongNgay) * 10000) / 100 : 0;
                        const tyLeVangCoPhep = tongNgay > 0 ? Math.round((hs.coPhep / tongNgay) * 10000) / 100 : 0;
                        const tyLeVangKhongPhep = tongNgay > 0 ? Math.round((hs.khongPhep / tongNgay) * 10000) / 100 : 0;
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={hs.hocSinhId} style={{ background: isEven ? "#fff" : "#f8fafc" }}>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#0f172a" }}>{hs.hoTen}</td>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center", color: "#64748b" }}>
                              {hs.coPhep} <span style={{ fontSize: 12 }}>({tyLeVangCoPhep}%)</span>
                            </td>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center", color: hs.khongPhep > 0 ? "#ef4444" : "#64748b", fontWeight: hs.khongPhep > 0 ? 600 : 400 }}>
                              {hs.khongPhep} <span style={{ fontSize: 12 }}>({tyLeVangKhongPhep}%)</span>
                            </td>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center", fontWeight: 600, color: "#0f172a" }}>{hs.tongVang}</td>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: tyLeVang <= 10 ? "#16a34a" : tyLeVang <= 30 ? "#ca8a04" : "#dc2626" }}>
                                {tyLeVang}%
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", textAlign: "center" }}>
                              <span style={{ fontWeight: 600, fontSize: 13, color: tyLeVang <= 10 ? "#16a34a" : tyLeVang <= 30 ? "#ca8a04" : "#dc2626" }}>
                                {tyLeVang <= 10 ? "Tốt" : tyLeVang <= 30 ? "Đạt" : "Kém"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Statistics Pagination */}
                {!statsLoading && statsList.length > 0 && (
                  <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <Pagination
                      currentPage={statsCurrentPage}
                      totalPages={statsTotalPages}
                      totalItems={statsList.length}
                      pageSize={statsPageSize}
                      onPageChange={setStatsCurrentPage}
                      onPageSizeChange={(sz) => { setStatsPageSize(sz); setStatsCurrentPage(1); }}
                      pageSizeOptions={[10, 20, 30, 50, 100]}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

