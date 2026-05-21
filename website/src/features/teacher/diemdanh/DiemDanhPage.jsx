import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";

const STORAGE_KEY = "teacher_attendance_records_v2";
const LOCKS_KEY = "teacher_attendance_locks_v1";
const AUTO_NOTE = "Nghỉ quá 45 ngày - cần xử lý theo quy định.";

const getToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const getRecordKey = (date, classId, studentId) => `${date}_${classId}_${studentId}`;
const getLockKey = (date, classId) => `${date}_${classId}`;

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

const getStatusLabel = (record) => {
  if (record.khongPhep) return "Vắng không phép";
  if (record.coPhep) return "Vắng có phép";
  return "Có mặt";
};

export default function DiemDanhPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [draftRecords, setDraftRecords] = useState({});
  const [locks, setLocks] = useState({});
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentRes, classRes] = await Promise.all([getHocSinh(), getLop()]);
        if (!active) return;

        const classData = (classRes?.data?.data || []).slice().sort((a, b) =>
          String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
            sensitivity: "base",
            numeric: true
          })
        );

        setStudents(studentRes?.data?.data || []);
        setClasses(classData);

        if (classData.length > 0) {
          setSelectedClassId(String(classData[0].id));
        }
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const rawRecords = window.localStorage.getItem(STORAGE_KEY);
      if (rawRecords) {
        const parsedRecords = JSON.parse(rawRecords);
        if (parsedRecords && typeof parsedRecords === "object") {
          setDraftRecords(parsedRecords);
        }
      }

      const rawLocks = window.localStorage.getItem(LOCKS_KEY);
      if (rawLocks) {
        const parsedLocks = JSON.parse(rawLocks);
        if (parsedLocks && typeof parsedLocks === "object") {
          setLocks(parsedLocks);
        }
      }
    } catch {
      setDraftRecords({});
      setLocks({});
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((student) => String(student?.lopHoc?.id || "") === selectedClassId);
  }, [students, selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const attendanceLocked = useMemo(() => {
    if (!selectedDate || !selectedClassId) return false;
    return Boolean(locks[getLockKey(selectedDate, selectedClassId)]);
  }, [locks, selectedDate, selectedClassId]);

  const stats = useMemo(() => {
    let present = 0;
    let absentAllowed = 0;
    let absentUnallowed = 0;
    let over45 = 0;

    filteredStudents.forEach((student) => {
      const key = getRecordKey(selectedDate, selectedClassId, student.id);
      const record = draftRecords[key] || {
        coPhep: false,
        khongPhep: false,
        soNgayVang: 0,
        ghiChu: ""
      };

      if (record.khongPhep) absentUnallowed += 1;
      else if (record.coPhep) absentAllowed += 1;
      else present += 1;
      if ((record.soNgayVang || 0) > 45) over45 += 1;
    });

    return { present, absentAllowed, absentUnallowed, over45 };
  }, [draftRecords, filteredStudents, selectedDate, selectedClassId]);

  const updateRecord = (studentId, patch) => {
    if (!selectedClassId || attendanceLocked) return;

    const key = getRecordKey(selectedDate, selectedClassId, studentId);
    setDraftRecords((prev) => {
      const current = prev[key] || {
        coPhep: false,
        khongPhep: false,
        soNgayVang: 0,
        ghiChu: ""
      };
      const merged = { ...current, ...patch };
      merged.soNgayVang = Number.isFinite(Number(merged.soNgayVang))
        ? Math.max(0, Number(merged.soNgayVang))
        : 0;
      merged.ghiChu = upsertAutoNote(merged.ghiChu, merged.soNgayVang);
      return { ...prev, [key]: merged };
    });

    setSaveMessage("");
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!selectedClassId || attendanceLocked) return;

    try {
      const nextLocks = {
        ...locks,
        [getLockKey(selectedDate, selectedClassId)]: true
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      window.localStorage.setItem(LOCKS_KEY, JSON.stringify(nextLocks));
      setLocks(nextLocks);
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      setError("");
      setSaveMessage("Đã lưu điểm danh cho lớp và ngày này. Không thể điểm danh lại.");
    } catch {
      setError("Không thể lưu điểm danh. Vui lòng thử lại.");
      setSaveMessage("");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Điểm danh học sinh" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Điểm danh theo lớp</div>
          <div className="users-subtitle">
            Chọn lớp ở đầu trang, sau khi lưu sẽ khóa điểm danh theo ngày
            {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
          </div>
        </div>
        <div className="users-actions">
          <label className="form-field">
            <span>Ngày điểm danh</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setIsDirty(false);
              }}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={!isDirty || !selectedClassId || attendanceLocked}
          >
            Cập nhật
          </button>
        </div>
      </div>

      <div className="card subject-tabs-wrap">
        <div className="subject-tabs">
          {classes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`subject-tab ${String(item.id) === selectedClassId ? "active" : ""}`}
              onClick={() => {
                setSelectedClassId(String(item.id));
                setIsDirty(false);
              }}
            >
              {item.tenLop}
            </button>
          ))}
        </div>
        {!selectedClassId && <div className="table-empty">Vui lòng chọn lớp để điểm danh.</div>}
        {selectedClassId && attendanceLocked && (
          <div className="table-success">
            Lớp {selectedClass?.tenLop || "--"} đã được điểm danh ngày {selectedDate}.
          </div>
        )}
      </div>

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

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Bảng điểm danh {selectedClass?.tenLop || ""}</div>
            <div className="panel-subtitle">Mỗi ngày mỗi lớp chỉ điểm danh một lần</div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
        {!error && !loading && selectedClassId && filteredStudents.length === 0 && (
          <div className="table-empty">Lớp này chưa có học sinh.</div>
        )}

        {!!selectedClassId && (
          <div className="attendance-grid">
            <div className="attendance-row attendance-head">
              <div>Học sinh</div>
              <div>Có phép</div>
              <div>Không phép</div>
              <div>Số ngày vắng</div>
              <div>Ghi chú</div>
              <div>Trạng thái</div>
            </div>

            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div className="attendance-row" key={`attendance-skeleton-${index}`}>
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                    <div className="skeleton" />
                  </div>
                ))
              : filteredStudents.map((student) => {
                  const key = getRecordKey(selectedDate, selectedClassId, student.id);
                  const record = draftRecords[key] || {
                    coPhep: false,
                    khongPhep: false,
                    soNgayVang: 0,
                    ghiChu: ""
                  };

                  return (
                    <div className="attendance-row" key={student.id}>
                      <div className="table-main">
                        <div className="table-title">{student.hoTen}</div>
                        <div className="table-meta">{student?.lopHoc?.tenLop || "--"}</div>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={Boolean(record.coPhep)}
                          disabled={attendanceLocked}
                          onChange={(event) =>
                            updateRecord(student.id, {
                              coPhep: event.target.checked,
                              khongPhep: event.target.checked ? false : record.khongPhep
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={Boolean(record.khongPhep)}
                          disabled={attendanceLocked}
                          onChange={(event) =>
                            updateRecord(student.id, {
                              khongPhep: event.target.checked,
                              coPhep: event.target.checked ? false : record.coPhep
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          className="attendance-input"
                          type="number"
                          min="0"
                          value={record.soNgayVang}
                          disabled={attendanceLocked}
                          onChange={(event) =>
                            updateRecord(student.id, {
                              soNgayVang: event.target.value
                            })
                          }
                        />
                      </div>
                      <div>
                        <input
                          className="attendance-note"
                          value={record.ghiChu}
                          disabled={attendanceLocked}
                          onChange={(event) =>
                            updateRecord(student.id, {
                              ghiChu: event.target.value
                            })
                          }
                          placeholder="Nhận xét điểm danh"
                        />
                      </div>
                      <div>
                        <span
                          className={`status-pill ${
                            record.khongPhep ? "status-locked" : record.coPhep ? "status-warning" : "status-active"
                          }`}
                        >
                          {getStatusLabel(record)}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
