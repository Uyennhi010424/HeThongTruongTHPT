import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";
import {
  getStudentClassId,
  getStudentClassName,
  sortStudentsByGivenName
} from "../../../utils/helpers.js";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";
import Pagination from "../../../components/common/Pagination.jsx";

const getGenderLabel = (value) => {
  if (value === null || value === undefined) return "--";
  if (typeof value === "boolean") return value ? "Nam" : "Nữ";
  const v = String(value).trim().toLowerCase();
  if (["true", "1", "nam", "male", "m"].includes(v)) return "Nam";
  if (["false", "0", "nu", "nữ", "female", "f"].includes(v)) return "Nữ";
  return "--";
};

const formatBirthDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN").format(date);
};

export default function LopChuNhiem() {
  const filters = useTeacherFilters({ homeroomOnly: true, showSubject: false, showGrade: false });
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Combobox states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [parents, setParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const hsRes = await getHocSinh();
        if (!active) return;
        setStudents(hsRes?.data?.data || []);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu lớp chủ nhiệm.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const homeroomClassId = filters.selectedClassId;
  const homeroomClass = filters.selectedClassObj;

  const homeroomStudents = useMemo(() => {
    if (!homeroomClassId) return [];
    return sortStudentsByGivenName(
      students.filter((item) => String(getStudentClassId(item) || "") === String(homeroomClassId))
    );
  }, [students, homeroomClassId]);

  // Reset page on class or year change
  useEffect(() => {
    setCurrentPage(1);
  }, [homeroomClassId, filters.selectedNamHoc]);

  const totalPages = Math.ceil(homeroomStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return homeroomStudents.slice(start, start + pageSize);
  }, [homeroomStudents, currentPage, pageSize]);

  // Khi chọn học sinh -> tải danh sách phụ huynh
  useEffect(() => {
    if (!selectedStudentId) {
      setParents([]);
      setSelectedParentId("");
      return;
    }
    let active = true;
    const fetchParents = async () => {
      setLoadingParents(true);
      setSelectedParentId("");
      try {
        const res = await getParentsForStudent(selectedStudentId);
        if (!active) return;
        setParents(res?.data?.data || []);
      } catch {
        if (!active) return;
        setParents([]);
      } finally {
        if (active) setLoadingParents(false);
      }
    };
    fetchParents();
    return () => { active = false; };
  }, [selectedStudentId]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return homeroomStudents.find((s) => String(s.id) === String(selectedStudentId)) || null;
  }, [homeroomStudents, selectedStudentId]);

  const selectedParent = useMemo(() => {
    if (!selectedParentId) return null;
    return parents.find((p) => String(p.id) === String(selectedParentId)) || null;
  }, [parents, selectedParentId]);

  if (!loading && !homeroomClassId && !filters.loading) {
    return (
      <div style={{ maxWidth: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", letterSpacing: "-0.025em" }}>Lớp chủ nhiệm</div>
            <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Quản lý thông tin học sinh và phụ huynh lớp chủ nhiệm</div>
          </div>
          <TeacherFilter filters={filters} showGrade={false} showSubject={false} showClass={false} showSemester={false} align="right" />
        </div>
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
          Bạn chưa chọn lớp chủ nhiệm hoặc không được phân công chủ nhiệm trong năm học này.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 28 }}>
      
      {/* Header & Filter */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, paddingBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", letterSpacing: "-0.025em" }}>
            {homeroomClass ? `Lớp ${homeroomClass.tenLop}` : "Lớp chủ nhiệm"}
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>
            {homeroomClass?.khoi ? `Khối ${homeroomClass.khoi}` : ""}
            {homeroomClass ? ` · ${homeroomStudents.length} học sinh` : ""}
            {filters.selectedNamHoc ? ` · Năm học ${filters.selectedNamHoc}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <TeacherFilter filters={filters} showGrade={false} showSubject={false} showClass={false} showSemester={false} align="right" />
        </div>
      </div>

      {/* Combobox chọn học sinh và phụ huynh */}
      <div style={{ padding: 24, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Combobox học sinh */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              Chọn học sinh
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#f8fafc",
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box"
              }}
            >
              <option value="">-- Chọn học sinh --</option>
              {homeroomStudents.map((hs) => (
                <option key={hs.id} value={hs.id}>
                  {hs.hoTen}{hs.sdt ? ` - ${hs.sdt}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Combobox phụ huynh */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
              Phụ huynh
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              disabled={!selectedStudentId || loadingParents}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: 14,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                background: !selectedStudentId || loadingParents ? "#f1f5f9" : "#f8fafc",
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
                cursor: !selectedStudentId ? "not-allowed" : "pointer"
              }}
            >
              <option value="">
                {loadingParents ? "Đang tải..." : selectedStudentId ? "-- Chọn phụ huynh --" : "-- Chọn học sinh trước --"}
              </option>
              {parents.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.hoTen}{ph.sdt ? ` - ${ph.sdt}` : ""}{ph.quanHe ? ` (${ph.quanHe})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thông tin học sinh được chọn */}
        {selectedStudent && (
          <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#0f172a" }}>
              Thông tin học sinh
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: 14, color: "#334155" }}>
              <div><span style={{ color: "#64748b" }}>Họ tên:</span> {selectedStudent.hoTen}</div>
              <div><span style={{ color: "#64748b" }}>Lớp:</span> {getStudentClassName(selectedStudent) || "--"}</div>
              <div><span style={{ color: "#64748b" }}>Ngày sinh:</span> {formatBirthDate(selectedStudent.ngaySinh)}</div>
              <div><span style={{ color: "#64748b" }}>Giới tính:</span> {getGenderLabel(selectedStudent.gioiTinh)}</div>
              <div><span style={{ color: "#64748b" }}>SĐT:</span> {selectedStudent.sdt || "--"}</div>
              <div><span style={{ color: "#64748b" }}>Email:</span> {selectedStudent.email || "--"}</div>
            </div>
          </div>
        )}

        {/* Thông tin phụ huynh được chọn */}
        {selectedParent && (
          <div style={{ padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: "#0f172a" }}>
              Thông tin phụ huynh
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontSize: 14, color: "#334155" }}>
              <div><span style={{ color: "#64748b" }}>Họ tên:</span> {selectedParent.hoTen}</div>
              <div><span style={{ color: "#64748b" }}>Quan hệ:</span> {selectedParent.quanHe || "--"}</div>
              <div><span style={{ color: "#64748b" }}>SĐT:</span> {selectedParent.sdt || "--"}</div>
              <div><span style={{ color: "#64748b" }}>Email:</span> {selectedParent.email || "--"}</div>
              <div><span style={{ color: "#64748b" }}>Địa chỉ:</span> {selectedParent.diaChi || "--"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bảng danh sách học sinh */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Danh sách học sinh</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Lớp chủ nhiệm được phân công</div>
          </div>
          <div style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            {homeroomStudents.length} học sinh
          </div>
        </div>

        {error && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>{error}</div>}
        
        {!error && !loading && homeroomStudents.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
            Không có học sinh trong lớp.
          </div>
        )}

        {homeroomStudents.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600, fontSize: 14 }}>
                <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>STT</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Học sinh</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Liên hệ</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skeleton-${i}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "12px 16px" }}><div style={{ width: 20, height: 16, background: "#e2e8f0", borderRadius: 4 }}></div></td>
                          <td style={{ padding: "12px 16px" }}><div style={{ width: 150, height: 16, background: "#e2e8f0", borderRadius: 4 }}></div></td>
                          <td style={{ padding: "12px 16px" }}><div style={{ width: 100, height: 16, background: "#e2e8f0", borderRadius: 4 }}></div></td>
                          <td style={{ padding: "12px 16px" }}><div style={{ width: 60, height: 16, background: "#e2e8f0", borderRadius: 4 }}></div></td>
                        </tr>
                      ))
                    : paginatedStudents.map((student, i) => (
                        <tr key={student.id} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{(currentPage - 1) * pageSize + i + 1}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{student.hoTen}</div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                              {formatBirthDate(student.ngaySinh)} · {getGenderLabel(student.gioiTinh)}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ color: "#334155" }}>{student.sdt || "--"}</div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{student.email || ""}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              background: student.trangThai === 1 ? "#dcfce7" : "#fef2f2",
                              color: student.trangThai === 1 ? "#16a34a" : "#dc2626"
                            }}>
                              {student.trangThai === 1 ? "Đang học" : "Ngừng học"}
                            </span>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && homeroomStudents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={homeroomStudents.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                pageSizeOptions={[10, 20, 30, 50]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

