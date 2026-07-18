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

const STORAGE_KEY = "teacher_attendance_records_v3";
const LOCKS_KEY = "teacher_attendance_locks_v2";
const AUTO_NOTE = "Nghỉ quá 45 ngày - cần xử lý theo quy định.";

const DAY_LABELS = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7" };
const WEEK_DAYS = [2, 3, 4, 5, 6, 7];

const getWeekDates = (offset) => {
  const now = new Date();
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

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
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
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [draftRecords, setDraftRecords] = useState({});
  const [locks, setLocks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTiet, setSelectedTiet] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | statistics
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState([]); // TKB cua giao vien
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentRes, classRes, phanCongRes, gvRes, currentGvRes, namHocRes] = await Promise.all([
          getHocSinh(), getLop(), getPhanCongDay(), getGiaoVien(), getCurrentGiaoVien(), getNamHoc()
        ]);
        if (!active) return;
        const allClasses = (classRes?.data?.data || []).slice();
        const classData = allClasses.sort((a, b) =>
          String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", { sensitivity: "base", numeric: true })
        );
        const studentsList = studentRes?.data?.data || [];
        const phanCong = phanCongRes?.data?.data || [];
        const currentUsername = getCurrentUsernameFromToken();
        const teacherData = currentGvRes?.data?.data || findTeacherByUsername(gvRes?.data?.data || [], currentUsername);
        setCurrentTeacher(teacherData);

        let visibleClasses = classData;
        if (teacherData) {
          const assignedClassIds = new Set(
            phanCong
              .filter((p) => {
                const entryTeacherId = p?.giaoVienId ?? p?.giaoVien?.id;
                return entryTeacherId != null && Number(entryTeacherId) === Number(teacherData.id);
              })
              .map((p) => String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? ""))
              .filter(Boolean)
          );
          if (assignedClassIds.size > 0) {
            visibleClasses = classData.filter((c) => assignedClassIds.has(String(c.id)));
          }
        }

        // Lay TKB cua giao vien
        let scheduleData = [];
        if (teacherData) {
          const years = namHocRes?.data?.data || [];
          const currentYear = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[years.length - 1];
          const tenNamHoc = currentYear?.tenNamHoc || "";
          let hocKy = 1;
          if (currentYear?.ngayBatDauHk2) {
            const today = new Date().toISOString().slice(0, 10);
            if (today >= currentYear.ngayBatDauHk2) hocKy = 2;
          }
          try {
            const tkbRes = await getThoiKhoaBieu({ namHoc: tenNamHoc, hocKy });
            if (!active) return;
            const allTkb = tkbRes?.data?.data || [];
            scheduleData = allTkb.filter((item) => {
              const entryTeacherId = item?.giaoVienId ?? item?.giaoVien?.id;
              return entryTeacherId != null && Number(entryTeacherId) === Number(teacherData.id);
            });
          } catch { /* ignore */ }
        }

        if (!active) return;
        setStudents(studentsList);
        setClasses(visibleClasses);
        setTeacherSchedule(scheduleData);
        if (visibleClasses.length > 0) setSelectedClassId(String(visibleClasses[0].id));
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

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

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const classStudents = students.filter((s) => String(getStudentClassId(s) || "") === selectedClassId);
    return sortStudentsByGivenName(classStudents);
  }, [students, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // Tinh ngay trong tuan hien tai
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Cac ngay giao vien co lich day (theo lop dang chon)
  const availableDays = useMemo(() => {
    if (!teacherSchedule.length) return [];
    const days = new Set();
    teacherSchedule.forEach((item) => {
      if (selectedClassId && String(item?.lop?.id ?? item?.lopId) !== selectedClassId) return;
      const thu = Number(item.thu);
      if (thu >= 2 && thu <= 7) days.add(thu);
    });
    return WEEK_DAYS.filter((d) => days.has(d));
  }, [teacherSchedule, selectedClassId]);

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

  const attendanceLocked = useMemo(() => {
    if (!selectedDate || !selectedClassId || !selectedTiet) return false;
    return Boolean(locks[getLockKey(selectedDate, selectedClassId, selectedTiet)]);
  }, [locks, selectedDate, selectedClassId, selectedTiet]);

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
        const draft = draftRecords[key];
        if (!draft) return;
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
      const namHoc = getCurrentAcademicYear();
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
    <div className="page users-page teacher-page">

      {/* Tabs */}
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          <button
            type="button"
            style={{
              flex: 1, padding: "12px 16px", border: "none", background: activeTab === "attendance" ? "#3b82f6" : "transparent",
              color: activeTab === "attendance" ? "#fff" : "#374151", fontWeight: 600, cursor: "pointer"
            }}
            onClick={() => setActiveTab("attendance")}
          >
            Điểm danh
          </button>
          <button
            type="button"
            style={{
              flex: 1, padding: "12px 16px", border: "none", background: activeTab === "statistics" ? "#3b82f6" : "transparent",
              color: activeTab === "statistics" ? "#fff" : "#374151", fontWeight: 600, cursor: "pointer"
            }}
            onClick={() => setActiveTab("statistics")}
          >
            Thống kê chuyên cần
          </button>
        </div>
      </div>

      {/* Class tabs */}
      <div className="card subject-tabs-wrap">
        <div className="subject-tabs">
          {classes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`subject-tab ${String(item.id) === selectedClassId ? "active" : ""}`}
              onClick={() => { setSelectedClassId(String(item.id)); setIsDirty(false); }}
            >
              {item.tenLop}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "attendance" && (
        <>
          {/* Toolbar */}
          <div className="card users-toolbar" style={{ flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="users-title">Điểm danh theo tiết</div>
                <div className="users-subtitle">
                  Chọn ngày và tiết từ thời khóa biểu
                  {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-outline btn-sm" onClick={() => setWeekOffset((p) => p - 1)}>← Tuần trước</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => setWeekOffset(0)}>Hôm nay</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => setWeekOffset((p) => p + 1)}>Tuần sau →</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {availableDays.map((thu) => {
                  const dateStr = weekDates[thu];
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={thu}
                      type="button"
                      onClick={() => { setSelectedDate(dateStr); setIsDirty(false); }}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        background: isSelected ? "#eff6ff" : "#fff", color: isSelected ? "#1d4ed8" : "#374151",
                        fontWeight: isSelected ? 700 : 500, fontSize: 13, cursor: "pointer"
                      }}
                    >
                      {DAY_LABELS[thu]}
                      <div style={{ fontSize: 11, fontWeight: 400, color: "#6b7280" }}>
                        {dateStr ? formatDate(dateStr) : ""}
                      </div>
                    </button>
                  );
                })}
                {availableDays.length === 0 && !loading && (
                  <span style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Không có lịch dạy trong tuần này</span>
                )}
              </div>
              <span style={{ color: "#d1d5db" }}>|</span>
              <label className="form-field" style={{ marginBottom: 0 }}>
                <span>Tiết</span>
                <select value={selectedTiet} onChange={(e) => { setSelectedTiet(Number(e.target.value)); setIsDirty(false); }}>
                  {availablePeriods.map((p) => <option key={p} value={p}>Tiết {p}</option>)}
                </select>
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={!isDirty || !selectedClassId || attendanceLocked || saving || !availablePeriods.length}
              >
                {saving ? "Đang lưu..." : attendanceLocked ? "Đã khóa" : "Cập nhật"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="users-stats">
            <div className="stat-card stat-blue">
              <div className="stat-label">Có mặt</div>
              <div className="stat-value">{loading ? "..." : stats.present}</div>
            </div>
            <div className="stat-card stat-sky">
              <div className="stat-label">Vắng có phép</div>
              <div className="stat-value">{loading ? "..." : stats.absentAllowed}</div>
            </div>
            <div className="stat-card stat-ice">
              <div className="stat-label">Vắng không phép</div>
              <div className="stat-value">{loading ? "..." : stats.absentUnallowed}</div>
            </div>
            <div className="stat-card stat-navy">
              <div className="stat-label">Nghỉ quá 45 ngày</div>
              <div className="stat-value">{loading ? "..." : stats.over45}</div>
            </div>
          </div>

          {/* Attendance table */}
          <div className="card users-table">
            <div className="table-header">
              <div>
                <div className="panel-title">Bảng điểm danh {selectedClass?.tenLop || ""} · {formatDate(selectedDate)} · Tiết {selectedTiet}</div>
                <div className="panel-subtitle">Chọn trạng thái: Có mặt / Vắng có phép / Vắng không phép</div>
              </div>
              <div className="panel-pill">{filteredStudents.length} học sinh</div>
            </div>
            {error && <div className="table-empty">{error}</div>}
            {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
            {!error && !loading && selectedClassId && filteredStudents.length === 0 && (
              <div className="table-empty">Lớp này chưa có học sinh.</div>
            )}
            {selectedClassId && attendanceLocked && (
              <div className="table-success">
                Lớp {selectedClass?.tenLop || "--"} đã được điểm danh tiết {selectedTiet} ngày {formatDate(selectedDate)}.
              </div>
            )}

            {!!selectedClassId && (
              <div className="attendance-grid">
                <div className="attendance-row attendance-head">
                  <div>Học sinh</div>
                  <div style={{ textAlign: "center" }}>Trạng thái</div>
                  <div>Số ngày vắng</div>
                  <div>Ghi chú</div>
                </div>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div className="attendance-row" key={`skeleton-${i}`}>
                        <div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
                      </div>
                    ))
                  : filteredStudents.map((student) => {
                      const key = getRecordKey(selectedDate, selectedClassId, selectedTiet, student.id);
                      const record = draftRecords[key] || { loaiVang: "CO_MAT", soNgayVang: 0, ghiChu: "" };
                      return (
                        <div className="attendance-row" key={student.id}>
                          <div className="table-main">
                            <div className="table-title">{student.hoTen}</div>
                            <div className="table-meta">{getStudentClass(student)?.tenLop || "--"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            {LOAI_VANG_OPTIONS.map((opt) => (
                              <label
                                key={opt.value}
                                style={{
                                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                                  borderRadius: 8, cursor: attendanceLocked ? "default" : "pointer",
                                  background: record.loaiVang === opt.value ? (opt.value === "CO_MAT" ? "#dcfce7" : opt.value === "CO_PHEP" ? "#fef9c3" : "#fee2e2") : "#f3f4f6",
                                  border: record.loaiVang === opt.value ? `2px solid ${opt.value === "CO_MAT" ? "#22c55e" : opt.value === "CO_PHEP" ? "#eab308" : "#ef4444"}` : "2px solid transparent",
                                  fontWeight: record.loaiVang === opt.value ? 600 : 400, fontSize: 13
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`loaiVang_${student.id}`}
                                  value={opt.value}
                                  checked={record.loaiVang === opt.value}
                                  disabled={attendanceLocked}
                                  onChange={() => updateRecord(student.id, { loaiVang: opt.value, soNgayVang: opt.value === "CO_MAT" ? 0 : record.soNgayVang || 1 })}
                                  style={{ display: "none" }}
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                          <div>
                            <input
                              className="attendance-input"
                              type="number"
                              min="0"
                              value={record.soNgayVang}
                              disabled={attendanceLocked || record.loaiVang === "CO_MAT"}
                              onChange={(e) => updateRecord(student.id, { soNgayVang: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              className="attendance-note"
                              value={record.ghiChu}
                              disabled={attendanceLocked}
                              onChange={(e) => updateRecord(student.id, { ghiChu: e.target.value })}
                              placeholder="Nhận xét"
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "statistics" && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">Thống kê chuyên cần {selectedClass?.tenLop || ""}</div>
              <div className="panel-subtitle">Năm học {getCurrentAcademicYear()}</div>
            </div>
          </div>
          {statsLoading && <div className="table-empty">Đang tải...</div>}
          {!statsLoading && !statsData && <div className="table-empty">Không có dữ liệu.</div>}
          {!statsLoading && statsData && (
            <>
              <div className="users-stats" style={{ marginBottom: 16 }}>
                <div className="stat-card stat-blue">
                  <div className="stat-label">Tổng ngày học</div>
                  <div className="stat-value">{statsData.tongNgayHoc}</div>
                </div>
              </div>
              <div className="attendance-grid">
                <div className="attendance-row attendance-head">
                  <div>Học sinh</div>
                  <div style={{ textAlign: "center" }}>Có phép</div>
                  <div style={{ textAlign: "center" }}>Không phép</div>
                  <div style={{ textAlign: "center" }}>Tổng vắng</div>
                  <div style={{ textAlign: "center" }}>Tỷ lệ vắng</div>
                  <div style={{ textAlign: "center" }}>Chuyên cần</div>
                </div>
                {(statsData.hocSinh || []).map((hs) => {
                  const tongNgay = hs.tongNgayHoc || statsData.tongNgayHoc || 1;
                  const tyLeVang = tongNgay > 0 ? Math.round((hs.tongVang / tongNgay) * 10000) / 100 : 0;
                  const tyLeVangCoPhep = tongNgay > 0 ? Math.round((hs.coPhep / tongNgay) * 10000) / 100 : 0;
                  const tyLeVangKhongPhep = tongNgay > 0 ? Math.round((hs.khongPhep / tongNgay) * 10000) / 100 : 0;
                  return (
                    <div className="attendance-row" key={hs.hocSinhId}>
                      <div className="table-main">
                        <div className="table-title">{hs.hoTen}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>{hs.coPhep} <span style={{ fontSize: 11, color: "#9ca3af" }}>({tyLeVangCoPhep}%)</span></div>
                      <div style={{ textAlign: "center", color: hs.khongPhep > 0 ? "#ef4444" : undefined }}>
                        {hs.khongPhep} <span style={{ fontSize: 11, color: hs.khongPhep > 0 ? "#f87171" : "#9ca3af" }}>({tyLeVangKhongPhep}%)</span>
                      </div>
                      <div style={{ textAlign: "center" }}>{hs.tongVang}</div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontWeight: 600, fontSize: 13,
                          background: tyLeVang <= 10 ? "#dcfce7" : tyLeVang <= 30 ? "#fef9c3" : "#fee2e2",
                          color: tyLeVang <= 10 ? "#16a34a" : tyLeVang <= 30 ? "#ca8a04" : "#dc2626"
                        }}>
                          {tyLeVang}%
                        </span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontWeight: 600, fontSize: 13,
                          background: hs.tyLeChuyenCan >= 80 ? "#dcfce7" : hs.tyLeChuyenCan >= 50 ? "#fef9c3" : "#fee2e2",
                          color: hs.tyLeChuyenCan >= 80 ? "#16a34a" : hs.tyLeChuyenCan >= 50 ? "#ca8a04" : "#dc2626"
                        }}>
                          {hs.tyLeChuyenCan}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
