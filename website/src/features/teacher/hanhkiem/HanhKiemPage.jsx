import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";

const STORAGE_KEY = "teacher_conduct_records_v2";

const getRecordKey = (classId, studentId) => `${classId}_${studentId}`;

export default function HanhKiemPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [draftRecords, setDraftRecords] = useState({});
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
        const [studentsRes, classesRes] = await Promise.all([getHocSinh(), getLop()]);
        if (!active) return;

        const classData = (classesRes?.data?.data || []).slice().sort((a, b) =>
          String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
            sensitivity: "base",
            numeric: true
          })
        );

        setStudents(studentsRes?.data?.data || []);
        setClasses(classData);

        if (classData.length > 0) {
          setSelectedClassId(String(classData[0].id));
        }
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu hạnh kiểm.");
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
        setDraftRecords(parsed);
      }
    } catch {
      setDraftRecords({});
    }
  }, []);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((student) => String(student?.lopHoc?.id || "") === selectedClassId);
  }, [students, selectedClassId]);

  const stats = useMemo(() => {
    let tot = 0;
    let kha = 0;
    let trungBinh = 0;
    let yeu = 0;

    filteredStudents.forEach((student) => {
      const key = getRecordKey(selectedClassId, student.id);
      const rank = draftRecords[key]?.xepLoai || "TOT";
      if (rank === "TOT") tot += 1;
      if (rank === "KHA") kha += 1;
      if (rank === "TRUNG_BINH") trungBinh += 1;
      if (rank === "YEU") yeu += 1;
    });

    return { tot, kha, trungBinh, yeu };
  }, [filteredStudents, draftRecords, selectedClassId]);

  const updateRecord = (studentId, patch) => {
    if (!selectedClassId) return;
    const key = getRecordKey(selectedClassId, studentId);

    setDraftRecords((prev) => {
      const current = prev[key] || {
        xepLoai: "TOT",
        nhanXet: ""
      };
      return {
        ...prev,
        [key]: {
          ...current,
          ...patch
        }
      };
    });

    setIsDirty(true);
    setSaveMessage("");
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRecords));
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleString("vi-VN"));
      setError("");
      setSaveMessage("Đã lưu đánh giá hạnh kiểm.");
    } catch {
      setError("Không thể lưu đánh giá hạnh kiểm.");
      setSaveMessage("");
    }
  };

  return (
    <div className="page users-page">
      <Header title="Hạnh kiểm" />

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Đánh giá hạnh kiểm theo lớp</div>
          <div className="users-subtitle">
            Chọn lớp để hiển thị danh sách học sinh và đánh giá bằng combobox
            {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
          </div>
        </div>
        <div className="users-actions">
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!isDirty}>
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
                setSaveMessage("");
              }}
            >
              {item.tenLop}
            </button>
          ))}
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tốt</div>
          <div className="stat-value">{loading ? "..." : stats.tot}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Khá</div>
          <div className="stat-value">{loading ? "..." : stats.kha}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Trung bình</div>
          <div className="stat-value">{loading ? "..." : stats.trungBinh}</div>
        </div>
        <div className="stat-card stat-navy">
          <div className="stat-label">Yếu</div>
          <div className="stat-value">{loading ? "..." : stats.yeu}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách học sinh {selectedClass?.tenLop || ""}</div>
            <div className="panel-subtitle">Đánh giá hạnh kiểm: Tốt, Khá, Trung bình, Yếu</div>
          </div>
          <div className="panel-pill">{filteredStudents.length} học sinh</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
        {!error && !loading && filteredStudents.length === 0 && (
          <div className="table-empty">Lớp này chưa có học sinh.</div>
        )}

        <div className="attendance-grid">
          <div className="attendance-row attendance-head" style={{ gridTemplateColumns: "220px 200px 1.6fr" }}>
            <div>Học sinh</div>
            <div>Hạnh kiểm</div>
            <div>Nhận xét</div>
          </div>

          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="attendance-row"
                  style={{ gridTemplateColumns: "220px 200px 1.6fr" }}
                  key={`conduct-skeleton-${index}`}
                >
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : filteredStudents.map((student) => {
                const key = getRecordKey(selectedClassId, student.id);
                const record = draftRecords[key] || {
                  xepLoai: "TOT",
                  nhanXet: ""
                };

                return (
                  <div
                    className="attendance-row"
                    style={{ gridTemplateColumns: "220px 200px 1.6fr" }}
                    key={student.id}
                  >
                    <div className="table-main">
                      <div className="table-title">{student.hoTen}</div>
                      <div className="table-meta">{student?.lopHoc?.tenLop || "--"}</div>
                    </div>
                    <div>
                      <select
                        className="attendance-input"
                        value={record.xepLoai}
                        onChange={(event) =>
                          updateRecord(student.id, { xepLoai: event.target.value })
                        }
                      >
                        <option value="TOT">Tốt</option>
                        <option value="KHA">Khá</option>
                        <option value="TRUNG_BINH">Trung bình</option>
                        <option value="YEU">Yếu</option>
                      </select>
                    </div>
                    <div>
                      <input
                        className="attendance-note"
                        value={record.nhanXet}
                        onChange={(event) =>
                          updateRecord(student.id, { nhanXet: event.target.value })
                        }
                        placeholder="Nhận xét hạnh kiểm"
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
