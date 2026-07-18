import { useEffect, useMemo, useState } from "react";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getChuNhiemByGiaoVien } from "../../../api/chunhiemApi.js";
import { getHanhKiem, saveAllHanhKiem } from "../../../api/hanhkiemApi.js";
import { getCurrentUsernameFromToken, findTeacherByUsername } from "../../../utils/teacherProfile.js";
import { getStudentClass, getStudentClassId, sortStudentsByGivenName } from "../../../utils/helpers.js";

const TERM_MAP = { KI1: 1, KI2: 2, CA_NAM: 0 };

export default function HanhKiemPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("KI1");
  const [draftRecords, setDraftRecords] = useState({});
  const [serverRecords, setServerRecords] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [currentNamHoc, setCurrentNamHoc] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [classesRes, teachersRes, namHocRes, currentGvRes] = await Promise.all([
          getLop(),
          getGiaoVien(),
          getNamHoc(),
          getCurrentGiaoVien()
        ]);
        if (!active) return;

        const allClasses = (classesRes?.data?.data || []).slice();
        const allTeachers = teachersRes?.data?.data || [];
        const allNamHoc = namHocRes?.data?.data || [];

        // Determine current teacher — prefer API /me, fallback to fuzzy matching
        const currentUsername = getCurrentUsernameFromToken();
        const teacher = currentGvRes?.data?.data || findTeacherByUsername(allTeachers, currentUsername);
        setCurrentTeacher(teacher || null);

        // Get latest nam hoc
        if (allNamHoc.length > 0) {
          const sorted = [...allNamHoc].sort((a, b) => {
            const yearA = parseInt(a.tenNamHoc?.split("-")[0] || "0", 10);
            const yearB = parseInt(b.tenNamHoc?.split("-")[0] || "0", 10);
            return yearB - yearA;
          });
          setCurrentNamHoc(sorted[0]);
        }

        // Homeroom classes
        let visibleClasses = [];
        if (teacher) {
          const chuNhiemRes = await getChuNhiemByGiaoVien(teacher.id);
          const lopId = chuNhiemRes?.data?.data?.lopId;
          visibleClasses = allClasses
            .filter((c) => String(c?.id || "") === String(lopId || ""))
            .sort((a, b) =>
              String(a?.tenLop || "").localeCompare(String(b?.tenLop || ""), "vi", {
                sensitivity: "base",
                numeric: true
              })
            );
        }

        setClasses(visibleClasses);

        if (visibleClasses.length > 0) {
          const classId = String(visibleClasses[0].id);
          setSelectedClassId(classId);
          try {
            const studentsRes = await getHocSinh({ lopId: classId });
            if (!active) return;
            setStudents(studentsRes?.data?.data || []);
          } catch {
            const studentsResAll = await getHocSinh();
            if (!active) return;
            setStudents(studentsResAll?.data?.data || []);
          }
        } else {
          setStudents([]);
        }
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu hạnh kiểm.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []);

  // Load existing records from backend when class or term changes
  useEffect(() => {
    if (!selectedClassId || !currentNamHoc) return;
    let active = true;

    const loadRecords = async () => {
      try {
        const hocKy = TERM_MAP[selectedTerm];
        const params = { lopId: selectedClassId, namHocId: currentNamHoc.id };
        const res = await getHanhKiem(params);
        if (!active) return;

        const records = res?.data?.data || [];
        // Filter by hocKy if not CA_NAM
        const filtered = hocKy === 0
          ? records
          : records.filter((r) => r.hocKy === hocKy);

        // Build lookup: { studentId: { id, xepLoai, nhanXet } }
        const lookup = {};
        filtered.forEach((r) => {
          const sid = r?.hocSinh?.id;
          if (sid) {
            lookup[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "TOT",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });
        setServerRecords(lookup);
        // Initialize draft from server records
        setDraftRecords((prev) => {
          const merged = { ...lookup };
          // Overlay any unsaved local changes
          Object.keys(prev).forEach((key) => {
            if (merged[key]) {
              merged[key] = { ...merged[key], ...prev[key] };
            }
          });
          return merged;
        });
      } catch {
        // ignore - will show empty
      }
    };

    loadRecords();
    return () => { active = false; };
  }, [selectedClassId, selectedTerm, currentNamHoc]);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );
  const showNoHomeroom = !loading && (!selectedClassId || classes.length === 0);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const classStudents = students.filter(
      (student) => String(getStudentClassId(student) || "") === selectedClassId
    );
    return sortStudentsByGivenName(classStudents);
  }, [students, selectedClassId]);

  const stats = useMemo(() => {
    let tot = 0;
    let kha = 0;
    let trungBinh = 0;
    let yeu = 0;

    filteredStudents.forEach((student) => {
      const record = draftRecords[student.id] || { xepLoai: "TOT" };
      const rank = record?.xepLoai || "TOT";
      if (rank === "TOT") tot += 1;
      if (rank === "KHA") kha += 1;
      if (rank === "TRUNG_BINH") trungBinh += 1;
      if (rank === "YEU") yeu += 1;
    });

    return { tot, kha, trungBinh, yeu };
  }, [filteredStudents, draftRecords]);

  const updateRecord = (studentId, patch) => {
    if (!selectedClassId) return;

    setDraftRecords((prev) => {
      const current = prev[studentId] || { xepLoai: "TOT", nhanXet: "" };
      return {
        ...prev,
        [studentId]: { ...current, ...patch }
      };
    });

    setIsDirty(true);
    setSaveMessage("");
  };

  const handleSave = async () => {
    if (!currentTeacher || !currentNamHoc || !selectedClassId) {
      setError("Thiếu thông tin giáo viên hoặc năm học.");
      return;
    }

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const hocKy = TERM_MAP[selectedTerm];
      const payload = filteredStudents
        .map((student) => {
          const draft = draftRecords[student.id];
          if (!draft) return null;

          const server = serverRecords[student.id];
          const record = {
            hocSinh: { id: student.id },
            giaoVien: { id: currentTeacher.id },
            namHoc: { id: currentNamHoc.id },
            hocKy: hocKy === 0 ? null : hocKy,
            xepLoai: draft.xepLoai || "TOT",
            nhanXet: draft.nhanXet || "",
            ngayDanhGia: new Date().toISOString().split("T")[0]
          };

          // Include id for update if record already exists on server
          if (server?.id) {
            record.id = server.id;
          }

          return record;
        })
        .filter(Boolean);

      if (payload.length === 0) {
        setSaveMessage("Không có dữ liệu để lưu.");
        setSaving(false);
        return;
      }

      const res = await saveAllHanhKiem(payload);
      if (res?.data?.success) {
        // Update server records with saved data
        const saved = res.data.data || [];
        const newServer = {};
        saved.forEach((r) => {
          const sid = r?.hocSinh?.id;
          if (sid) {
            newServer[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "TOT",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });
        setServerRecords(newServer);
        setIsDirty(false);
        setLastSavedAt(new Date().toLocaleString("vi-VN"));
        setSaveMessage("Đã lưu đánh giá hạnh kiểm.");
      } else {
        setError(res?.data?.message || "Lưu thất bại.");
      }
    } catch {
      setError("Không thể lưu đánh giá hạnh kiểm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page users-page teacher-page">
      {showNoHomeroom ? (
        <div className="card table-empty">Bạn chưa được phân công lớp chủ nhiệm.</div>
      ) : (
        <>
          <div className="card users-toolbar">
            <div>
              <div className="users-title">Đánh giá hạnh kiểm theo lớp</div>
              <div className="users-subtitle">
                Chọn lớp để hiển thị danh sách học sinh và đánh giá bằng combobox
                {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
              </div>
            </div>
            <div className="users-actions">
              <label className="form-field" style={{ marginRight: 12 }}>
                <span>Chọn học kì</span>
                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                  <option value="KI1">Kì 1</option>
                  <option value="KI2">Kì 2</option>
                </select>
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={!isDirty || saving}
              >
                {saving ? "Đang lưu..." : "Cập nhật"}
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
                <div className="panel-subtitle">
                  Đánh giá hạnh kiểm: Tốt, Khá, Trung bình, Yếu ·{" "}
                  {selectedTerm === "KI1" ? "Kì 1" : "Kì 2"}
                </div>
              </div>
              <div className="panel-pill">{filteredStudents.length} học sinh</div>
            </div>

            {error && <div className="table-empty">{error}</div>}
            {!error && saveMessage && <div className="table-success">{saveMessage}</div>}
            {!error && !loading && filteredStudents.length === 0 && (
              <div className="table-empty">Lớp này chưa có học sinh.</div>
            )}

            <div className="attendance-grid">
              <div
                className="attendance-row attendance-head"
                style={{ gridTemplateColumns: "220px 200px 1.6fr" }}
              >
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
                    const record = draftRecords[student.id] || {
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
                          <div className="table-meta">
                            {getStudentClass(student)?.tenLop || "--"}
                          </div>
                        </div>
                        <div>
                          <select
                            className="attendance-input"
                            value={record.xepLoai}
                            disabled={record.status === "APPROVED" || saving}
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
                            disabled={record.status === "APPROVED" || saving}
                            onChange={(event) =>
                              updateRecord(student.id, { nhanXet: event.target.value })
                            }
                            placeholder={record.status === "APPROVED" ? "Đã duyệt & khóa" : "Nhận xét hạnh kiểm"}
                          />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
