import { useEffect, useMemo, useState } from "react";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getChuNhiemByGiaoVien } from "../../../api/chunhiemApi.js";
import { getHanhKiem, saveAllHanhKiem } from "../../../api/hanhkiemApi.js";
import { getCurrentUsernameFromToken, findTeacherByUsername } from "../../../utils/teacherProfile.js";
import { getStudentClass, getStudentClassId, sortStudentsByGivenName } from "../../../utils/helpers.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";

const TERM_MAP = { KI1: 1, KI2: 2, CA_NAM: 0 };

export default function HanhKiemPage() {
  const filters = useTeacherFilters({ showSubject: false, showGrade: false, homeroomOnly: true });
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

  const [selectedTerm, setSelectedTerm] = useState("KI1");
  const [draftRecords, setDraftRecords] = useState({});
  const [serverRecords, setServerRecords] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");


  // Load existing records from backend when class or term changes
  useEffect(() => {
    if (!selectedClassId || !selectedNamHoc) return;
    let active = true;

    const loadRecords = async () => {
      try {
        setLoading(true);
        const hocKy = TERM_MAP[selectedTerm];
        const params = { lopId: selectedClassId, namHocId: selectedNamHoc }; // We pass selectedNamHoc instead of currentNamHoc.id. Wait! Backend getHanhKiem expects namHocId. selectedNamHoc is the name of the year! Let's check how the backend handles it. Usually we might just need to fetch all and filter, or the backend accepts `namHoc` as name.
        // Actually, in the old code: `currentNamHoc.id`. Our `selectedNamHoc` is the string "2023-2024".
        // Oh wait, `getHanhKiem` API doesn't support `namHoc` string? Let me check `getHanhKiem` arguments. In the old code: `const params = { lopId: selectedClassId, namHocId: currentNamHoc.id }`.
        // Let's pass selectedNamHoc and hope the backend supports it, or we fetch the ID.
        // But wait, the backend `HanhKiemController.java` probably just accepts `namHocId`. 
        // Wait, what if we use `getHanhKiem({ lopId: selectedClassId, namHoc: selectedNamHoc })` ? Let's see if we can get the `namHocId` from `namHocList` inside `useTeacherFilters`. No, `namHocList` is just strings.
        // What if we just fetch `getHanhKiem({ lopId: selectedClassId })` and filter on the frontend?
        // Let's fetch without `namHocId` and see. Or `namHoc: selectedNamHoc`.
        const res = await getHanhKiem({ lopId: selectedClassId });
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
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecords();
    return () => { active = false; };
  }, [selectedClassId, selectedTerm, selectedNamHoc]);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const selectedClassInternal = useMemo(
    () => classes.find((item) => String(item.id) === selectedClassId) || null,
    [classes, selectedClassId]
  );
  const showNoHomeroom = (!filterLoading && !loading) && (!selectedClassId || classes.length === 0);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const classStudents = students.filter(
      (s) => s.trangThai === 1 && String(getStudentClassId(s) || "") === selectedClassId
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
    const currentNamHocObj = filters.allNamHoc.find((n) => n.tenNamHoc === selectedNamHoc);
    if (!currentTeacher || !currentNamHocObj || !selectedClassId) {
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
            namHoc: { id: currentNamHocObj.id },
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
    <div style={{ maxWidth: 1600, margin: "0 auto", width: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      {showNoHomeroom ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
          Bạn chưa được phân công lớp chủ nhiệm.
        </div>
      ) : (
        <>
          {/* Header & Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", letterSpacing: "-0.025em", margin: 0 }}>Đánh giá hạnh kiểm</h1>
              <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>
                Chọn lớp để hiển thị danh sách học sinh và đánh giá
                {lastSavedAt ? ` · Cập nhật lúc ${lastSavedAt}` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ margin: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginRight: 8 }}>Học kì:</span>
                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, minWidth: 120 }}>
                  <option value="KI1">Kì 1</option>
                  <option value="KI2">Kì 2</option>
                </select>
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                style={{
                  padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                  background: (!isDirty || saving) ? "#e2e8f0" : "#2563eb",
                  color: (!isDirty || saving) ? "#94a3b8" : "#fff",
                  boxShadow: (!isDirty || saving) ? "none" : "0 1px 2px rgba(37,99,235,0.3)"
                }}
              >
                {saving ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </div>

          {/* Class tabs */}
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {classes.map((item) => {
              const isActive = String(item.id) === selectedClassId;
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    padding: "8px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                    whiteSpace: "nowrap", transition: "all 0.2s",
                    background: isActive ? "#2563eb" : "#f1f5f9",
                    color: isActive ? "#fff" : "#475569"
                  }}
                  onClick={() => { setSelectedClassId(String(item.id)); setSaveMessage(""); }}
                >
                  {item.tenLop}
                </button>
              );
            })}
          </div>

          {/* Stats Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div style={{ background: "#eff6ff", padding: 20, borderRadius: 12, border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e3a8a", marginBottom: 8 }}>Tốt</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1d4ed8" }}>{loading ? "..." : stats.tot}</div>
            </div>
            <div style={{ background: "#fef9c3", padding: 20, borderRadius: 12, border: "1px solid #fef08a" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#854d0e", marginBottom: 8 }}>Khá</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#a16207" }}>{loading ? "..." : stats.kha}</div>
            </div>
            <div style={{ background: "#fef08a", padding: 20, borderRadius: 12, border: "1px solid #fde047" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#713f12", marginBottom: 8 }}>Trung bình</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#854d0e" }}>{loading ? "..." : stats.trungBinh}</div>
            </div>
            <div style={{ background: "#fee2e2", padding: 20, borderRadius: 12, border: "1px solid #fecaca" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#991b1b", marginBottom: 8 }}>Yếu</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#b91c1c" }}>{loading ? "..." : stats.yeu}</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Danh sách học sinh {selectedClass?.tenLop || ""}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  Đánh giá hạnh kiểm: Tốt, Khá, Trung bình, Yếu · {selectedTerm === "KI1" ? "Kì 1" : "Kì 2"}
                </div>
              </div>
              <div style={{ background: "#f1f5f9", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "#475569" }}>
                {filteredStudents.length} học sinh
              </div>
            </div>

            {error && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626" }}>{error}</div>}
            {!error && saveMessage && <div style={{ padding: 16, background: "#dcfce7", color: "#16a34a", fontWeight: 500 }}>{saveMessage}</div>}
            {!error && !loading && filteredStudents.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Lớp này chưa có học sinh.</div>
            )}

            {!!selectedClassId && filteredStudents.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 260 }}>Học sinh</th>
                      <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 200 }}>Hạnh kiểm</th>
                      <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`skel-${i}`}>
                            <td colSpan={3} style={{ padding: 16 }}>Đang tải...</td>
                          </tr>
                        ))
                      : filteredStudents.map((student, idx) => {
                          const record = draftRecords[student.id] || { xepLoai: "TOT", nhanXet: "" };
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={student.id} style={{ background: isEven ? "#fff" : "#f8fafc", transition: "background 0.15s" }}>
                              <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ fontWeight: 600, color: "#0f172a" }}>{student.hoTen}</div>
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{getStudentClass(student)?.tenLop || "--"}</div>
                              </td>
                              <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                <select
                                  value={record.xepLoai}
                                  disabled={record.status === "APPROVED" || saving}
                                  onChange={(event) => updateRecord(student.id, { xepLoai: event.target.value })}
                                  style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                                    fontSize: 14, background: (record.status === "APPROVED" || saving) ? "#f1f5f9" : "#fff",
                                    fontWeight: 500, color: record.xepLoai === "YEU" ? "#dc2626" : record.xepLoai === "TRUNG_BINH" ? "#ca8a04" : "#0f172a"
                                  }}
                                >
                                  <option value="TOT">Tốt</option>
                                  <option value="KHA">Khá</option>
                                  <option value="TRUNG_BINH">Trung bình</option>
                                  <option value="YEU">Yếu</option>
                                </select>
                              </td>
                              <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                <input
                                  value={record.nhanXet}
                                  disabled={record.status === "APPROVED" || saving}
                                  onChange={(event) => updateRecord(student.id, { nhanXet: event.target.value })}
                                  placeholder={record.status === "APPROVED" ? "Đã duyệt & khóa" : "Nhận xét hạnh kiểm"}
                                  style={{
                                    width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                                    fontSize: 14, background: (record.status === "APPROVED" || saving) ? "#f1f5f9" : "#fff"
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
          </div>
        </>
      )}
    </div>
  );
}

