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
import Pagination from "../../../components/common/Pagination.jsx";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";
import { useDragScroll } from "../../../hooks/useDragScroll.js";

const TERM_MAP = { KI1: 1, KI2: 2, CA_NAM: 0 };

export default function HanhKiemPage() {
  const dragScroll = useDragScroll();
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
    selectedClassObj: selectedClass,
    setSelectedClassId
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load existing records from backend when class or term changes
  useEffect(() => {
    if (!selectedClassId || !selectedNamHoc) return;
    let active = true;

    const loadRecords = async () => {
      try {
        setLoading(true);
        const hocKy = TERM_MAP[selectedTerm];
        const currentNamHocObj = (filters.allNamHoc || []).find(
          (y) => y.tenNamHoc === selectedNamHoc
        );
        const namHocId = currentNamHocObj?.id;

        const res = namHocId
          ? await getHanhKiem({ lopId: selectedClassId, namHocId })
          : await getHanhKiem({ lopId: selectedClassId });
        if (!active) return;

        const records = res?.data?.data || [];
        // Filter strictly by hocKy and namHoc (never leak data from other years)
        const filtered = records.filter((r) => {
          const rHocKy = r.hocKy ?? r.hoc_ky;
          const matchHocKy = hocKy === 0 || Number(rHocKy) === Number(hocKy);
          const rNamHocId = r?.namHoc?.id ?? r?.idNamHoc ?? r?.id_namhoc;
          const rNamHocTen = r?.namHoc?.tenNamHoc ?? r?.namHoc?.ten_nam_hoc;
          const matchNamHoc = (namHocId && Number(rNamHocId) === Number(namHocId)) || (selectedNamHoc && rNamHocTen === selectedNamHoc);
          return matchHocKy && matchNamHoc;
        });

        // Build lookup: { studentId: { id, xepLoai, nhanXet, status } }
        const lookup = {};
        filtered.forEach((r) => {
          const sid = r?.hocSinh?.id ?? r?.idHocSinh ?? r?.id_hocsinh;
          if (sid) {
            lookup[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });
        setServerRecords(lookup);
        setDraftRecords(lookup);
        setIsDirty(false);
      } catch {
        setServerRecords({});
        setDraftRecords({});
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecords();
    return () => { active = false; };
  }, [selectedClassId, selectedTerm, selectedNamHoc, filters.allNamHoc]);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timer = window.setTimeout(() => setSaveMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const showNoHomeroom = (!filterLoading && !loading) && (!selectedClassId || classes.length === 0);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    if (filters.classStudents && filters.classStudents.length > 0) {
      return sortStudentsByGivenName(filters.classStudents);
    }
    const classStudents = students.filter(
      (s) => s.trangThai === 1 && String(getStudentClassId(s) || "") === selectedClassId
    );
    return sortStudentsByGivenName(classStudents);
  }, [filters.classStudents, students, selectedClassId]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, selectedTerm, selectedNamHoc]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const stats = useMemo(() => {
    let tot = 0;
    let kha = 0;
    let trungBinh = 0;
    let yeu = 0;
    let chuaDanhGia = 0;

    filteredStudents.forEach((student) => {
      const record = draftRecords[student.id];
      if (!record || !record.xepLoai) {
        chuaDanhGia += 1;
        return;
      }
      const rank = record.xepLoai;
      if (rank === "TOT") tot += 1;
      else if (rank === "KHA") kha += 1;
      else if (rank === "TRUNG_BINH") trungBinh += 1;
      else if (rank === "YEU") yeu += 1;
      else chuaDanhGia += 1;
    });

    return { tot, kha, trungBinh, yeu, chuaDanhGia };
  }, [filteredStudents, draftRecords]);

  const updateRecord = (studentId, patch) => {
    if (!selectedClassId) return;

    setDraftRecords((prev) => {
      const current = prev[studentId] || { xepLoai: "", nhanXet: "" };
      return {
        ...prev,
        [studentId]: { ...current, ...patch }
      };
    });

    setIsDirty(true);
    setSaveMessage("");
  };

  const handleSave = async () => {
    const currentNamHocObj = (filters.allNamHoc || []).find((n) => n.tenNamHoc === selectedNamHoc);
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
          if (!draft || !draft.xepLoai) return null;

          const server = serverRecords[student.id];
          const record = {
            hocSinh: { id: student.id },
            giaoVien: { id: currentTeacher.id },
            namHoc: { id: currentNamHocObj.id },
            hocKy: hocKy === 0 ? null : hocKy,
            xepLoai: draft.xepLoai,
            nhanXet: draft.nhanXet || "",
            status: server?.status || "DRAFT"
          };

          // Include id for update if record already exists on server
          if (server?.id) {
            record.id = server.id;
          }

          return record;
        })
        .filter(Boolean);

      if (payload.length === 0) {
        setSaveMessage("Chưa có đánh giá hạnh kiểm nào để lưu.");
        setSaving(false);
        return;
      }

      const res = await saveAllHanhKiem(payload);
      if (res?.data?.success) {
        // Update server records with saved data
        const saved = res.data.data || [];
        const newServer = { ...serverRecords };
        saved.forEach((r) => {
          const sid = r?.hocSinh?.id ?? r?.idHocSinh ?? r?.id_hocsinh;
          if (sid) {
            newServer[sid] = {
              id: r.id,
              xepLoai: r.xepLoai || "",
              nhanXet: r.nhanXet || "",
              status: r.status || "DRAFT"
            };
          }
        });
        setServerRecords(newServer);
        setDraftRecords(newServer);
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
              <TeacherFilter filters={filters} showGrade={false} showSubject={false} showClass={false} showSemester={false} align="right" />
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
          {classes.length > 1 && (
            <div 
              ref={dragScroll.ref}
              {...dragScroll.events}
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 4,
                cursor: dragScroll.isDragging ? "grabbing" : "grab",
                userSelect: dragScroll.isDragging ? "none" : "auto"
              }}
            >
              {classes.map((item) => {
                const isActive = String(item.id) === selectedClassId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    style={{
                      padding: "8px 16px", borderRadius: 20, fontSize: 14, fontWeight: 600, border: "none", cursor: dragScroll.isDragging ? "grabbing" : "pointer",
                      whiteSpace: "nowrap", transition: "all 0.2s",
                      background: isActive ? "#2563eb" : "#f1f5f9",
                      color: isActive ? "#fff" : "#475569",
                      userSelect: "none"
                    }}
                    onClick={() => { setSelectedClassId(String(item.id)); setSaveMessage(""); }}
                  >
                    {item.tenLop}
                  </button>
                );
              })}
            </div>
          )}

          {/* Table Container */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            {/* Table Header with Inline Stats */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Danh sách học sinh lớp {selectedClass?.tenLop || ""}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {filteredStudents.length} học sinh · {selectedTerm === "KI1" ? "Học kỳ I" : "Học kỳ II"} · Năm học {selectedNamHoc}
                </div>
              </div>

              {/* Inline Stats Badges */}
              <div style={{ display: "flex", gap: 16, background: "#f8fafc", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>● Tốt: {loading ? "..." : stats.tot}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>● Khá: {loading ? "..." : stats.kha}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#ca8a04" }}>● Trung bình: {loading ? "..." : stats.trungBinh}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>● Yếu: {loading ? "..." : stats.yeu}</span>
                {stats.chuaDanhGia > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>● Chưa đánh giá: {loading ? "..." : stats.chuaDanhGia}</span>
                )}
              </div>
            </div>

            {error && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626" }}>{error}</div>}
            {!error && saveMessage && <div style={{ padding: 16, background: "#dcfce7", color: "#16a34a", fontWeight: 500 }}>{saveMessage}</div>}
            {!error && !loading && filteredStudents.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Lớp này chưa có học sinh.</div>
            )}

            {!!selectedClassId && filteredStudents.length > 0 && (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 60 }}>STT</th>
                        <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 240 }}>Học sinh</th>
                        <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", width: 200 }}>Hạnh kiểm</th>
                        <th style={{ padding: "12px 24px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={`skel-${i}`}>
                              <td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>Đang tải...</td>
                            </tr>
                          ))
                        : paginatedStudents.map((student, idx) => {
                            const record = draftRecords[student.id] || { xepLoai: "", nhanXet: "" };
                            const isEven = idx % 2 === 0;
                            return (
                              <tr key={student.id} style={{ background: isEven ? "#fff" : "#f8fafc", transition: "background 0.15s" }}>
                                <td style={{ padding: "16px 16px", textAlign: "center", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#475569" }}>
                                  {(currentPage - 1) * pageSize + idx + 1}
                                </td>
                                <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{student.hoTen}</div>
                                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{filters.selectedClassObj?.tenLop || getStudentClass(student)?.tenLop || "--"}</div>
                                </td>
                                <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                  <select
                                    value={record.xepLoai || ""}
                                    disabled={record.status === "APPROVED" || saving}
                                    onChange={(event) => updateRecord(student.id, { xepLoai: event.target.value })}
                                    style={{
                                      width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                                      fontSize: 14, background: (record.status === "APPROVED" || saving) ? "#f1f5f9" : "#fff",
                                      fontWeight: 600,
                                      color: record.xepLoai === "YEU" ? "#dc2626" : record.xepLoai === "TRUNG_BINH" ? "#ca8a04" : record.xepLoai === "KHA" ? "#2563eb" : record.xepLoai === "TOT" ? "#16a34a" : "#64748b"
                                    }}
                                  >
                                    <option value="">-- Chưa đánh giá --</option>
                                    <option value="TOT">Tốt</option>
                                    <option value="KHA">Khá</option>
                                    <option value="TRUNG_BINH">Trung bình</option>
                                    <option value="YEU">Yếu</option>
                                  </select>
                                </td>
                                <td style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9" }}>
                                  <input
                                    value={record.nhanXet || ""}
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

                {/* Pagination */}
                {!loading && filteredStudents.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredStudents.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                    pageSizeOptions={[10, 20, 30, 50]}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

