import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";

const STORAGE_KEY = "teacher_attendance_records_v1";
const AUTO_NOTE = "Nghỉ quá 45 ngày - cần xử lý theo quy định.";

const getToday = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const getRecordKey = (date, studentId) => `${date}_${studentId}`;

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
  const [records, setRecords] = useState({});
  const [draftRecords, setDraftRecords] = useState({});
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
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
        setStudents(studentRes?.data?.data || []);
        setClasses(classRes?.data?.data || []);
      } catch (err) {
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
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setRecords(parsed);
        setDraftRecords(parsed);
      }
    } catch {
      setRecords({});
      setDraftRecords({});
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    setSelectedClass("all");
  }, [selectedGrade]);

  const availableGrades = useMemo(() => {
    const gradeSet = new Set(
      classes
        .map((item) => item?.khoi)
        .filter((item) => item !== null && item !== undefined && String(item).trim() !== "")
    );
    return Array.from(gradeSet).sort((a, b) => Number(a) - Number(b));
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (selectedGrade === "all") return classes;
    return classes.filter((item) => String(item?.khoi || "") === selectedGrade);
  }, [classes, selectedGrade]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (selectedGrade !== "all") {
      result = result.filter((student) => String(student?.lopHoc?.khoi || "") === selectedGrade);
    }

    if (selectedClass !== "all") {
      result = result.filter((student) => String(student?.lopHoc?.id || "") === selectedClass);
    }

    return result;
  }, [selectedClass, selectedGrade, students]);

  const stats = useMemo(() => {
    let present = 0;
    let absentAllowed = 0;
    let absentUnallowed = 0;
    let over45 = 0;

    filteredStudents.forEach((student) => {
      const key = getRecordKey(selectedDate, student.id);
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
  }, [draftRecords, filteredStudents, selectedDate]);

  const updateRecord = (studentId, patch) => {
    const key = getRecordKey(selectedDate, studentId);
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
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      setRecords(draftRecords);
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      setError("");
      setSaveMessage("Cập nhật thành công.");
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
          <div className="users-title">Điểm danh theo ngày</div>
          <div className="users-subtitle">
            Theo dõi có phép, không phép, tổng ngày vắng và ghi chú
            {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
          </div>
        </div>
        <div className="users-actions">
          <label className="form-field">
            <span>Ngày</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Khối</span>
            <select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
              <option value="all">Tất cả khối</option>
              {availableGrades.map((grade) => (
                <option key={String(grade)} value={String(grade)}>
                  Khối {grade}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Lớp</span>
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
              <option value="all">Tất cả lớp</option>
              {filteredClasses.map((lop) => (
                <option key={lop.id} value={String(lop.id)}>
                  {lop.tenLop}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!isDirty}>
            Cập nhật
          </button>
        </div>
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
            <div className="panel-title">Bảng điểm danh</div>
            <div className="panel-subtitle">
              Hàng ngang là học sinh, cột dọc là thông tin điểm danh
            </div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
        {!error && !loading && filteredStudents.length === 0 && (
          <div className="table-empty">Không có học sinh phù hợp.</div>
        )}

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
                const key = getRecordKey(selectedDate, student.id);
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
                        onChange={(event) =>
                          updateRecord(student.id, { soNgayVang: Number(event.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <input
                        className="attendance-note"
                        value={record.ghiChu || ""}
                        onChange={(event) => updateRecord(student.id, { ghiChu: event.target.value })}
                        placeholder="Nhập ghi chú"
                      />
                    </div>
                    <div>
                      <span
                        className={`status-pill ${
                          record.khongPhep ? "status-locked" : record.coPhep ? "status-active" : ""
                        }`}
                      >
                        {getStatusLabel(record)}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
