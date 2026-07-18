import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getGiaoVien, getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";
import {
  getStudentClassId,
  getStudentClassName,
  sortStudentsByGivenName
} from "../../../utils/helpers.js";
import { getCurrentUsernameFromToken, findTeacherByUsername } from "../../../utils/teacherProfile.js";

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
  const currentUsername = useMemo(() => getCurrentUsernameFromToken(), []);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [homeroomAssignments, setHomeroomAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Combobox states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [parents, setParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState("");

  const [apiTeacher, setApiTeacher] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [hsRes, lopRes, gvRes, cnRes, meRes] = await Promise.all([
          getHocSinh(),
          getLop(),
          getGiaoVien(),
          getChuNhiem(),
          getCurrentGiaoVien().catch(() => null)
        ]);
        if (!active) return;
        setStudents(hsRes?.data?.data || []);
        setClasses(lopRes?.data?.data || []);
        setTeachers(gvRes?.data?.data || []);
        setHomeroomAssignments(cnRes?.data?.data || []);
        setApiTeacher(meRes?.data?.data || null);
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

  const currentTeacher = useMemo(() => {
    if (apiTeacher) return apiTeacher;
    return findTeacherByUsername(teachers, currentUsername);
  }, [apiTeacher, teachers, currentUsername]);

  const homeroomAssignment = useMemo(() => {
    if (!currentTeacher?.id) return null;
    return homeroomAssignments.find((item) => Number(item?.giaoVienId) === Number(currentTeacher.id)) || null;
  }, [homeroomAssignments, currentTeacher]);

  const homeroomClassId = homeroomAssignment?.lopId ? String(homeroomAssignment.lopId) : "";

  const homeroomClass = useMemo(() => {
    if (!homeroomClassId) return null;
    return classes.find((item) => String(item.id) === homeroomClassId) || null;
  }, [classes, homeroomClassId]);

  const homeroomStudents = useMemo(() => {
    if (!homeroomClassId) return [];
    return sortStudentsByGivenName(
      students.filter((item) => String(getStudentClassId(item) || "") === homeroomClassId)
    );
  }, [students, homeroomClassId]);

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

  if (!loading && !homeroomClassId) {
    return (
      <div className="page users-page teacher-page">
        <div className="card table-empty">Bạn chưa được phân công lớp chủ nhiệm.</div>
      </div>
    );
  }

  return (
    <div className="page users-page teacher-page">
      <Header title="Lớp chủ nhiệm" />

      {/* Thông tin lớp */}
      <div className="card users-toolbar">
        <div>
          <div className="users-title">
            {homeroomClass ? `Lớp ${homeroomClass.tenLop}` : "Lớp chủ nhiệm"}
          </div>
          <div className="users-subtitle">
            {homeroomClass?.khoi ? `Khối ${homeroomClass.khoi}` : ""}
            {homeroomClass ? ` · ${homeroomStudents.length} học sinh` : ""}
          </div>
        </div>
      </div>

      {/* Combobox chọn học sinh và phụ huynh */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Combobox học sinh */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>
              Chọn học sinh
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 8,
                background: "#fafafa",
                color: "#1a1a1a",
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
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>
              Phụ huynh
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              disabled={!selectedStudentId || loadingParents}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 8,
                background: !selectedStudentId || loadingParents ? "#f0f0f0" : "#fafafa",
                color: "#1a1a1a",
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
          <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "#1a1a1a" }}>
              Thông tin học sinh
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 14, color: "#444" }}>
              <div><span style={{ color: "#888" }}>Họ tên:</span> {selectedStudent.hoTen}</div>
              <div><span style={{ color: "#888" }}>Lớp:</span> {getStudentClassName(selectedStudent) || "--"}</div>
              <div><span style={{ color: "#888" }}>Ngày sinh:</span> {formatBirthDate(selectedStudent.ngaySinh)}</div>
              <div><span style={{ color: "#888" }}>Giới tính:</span> {getGenderLabel(selectedStudent.gioiTinh)}</div>
              <div><span style={{ color: "#888" }}>SĐT:</span> {selectedStudent.sdt || "--"}</div>
              <div><span style={{ color: "#888" }}>Email:</span> {selectedStudent.email || "--"}</div>
            </div>
          </div>
        )}

        {/* Thông tin phụ huynh được chọn */}
        {selectedParent && (
          <div style={{ marginTop: 12, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: "#1a1a1a" }}>
              Thông tin phụ huynh
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 14, color: "#444" }}>
              <div><span style={{ color: "#888" }}>Họ tên:</span> {selectedParent.hoTen}</div>
              <div><span style={{ color: "#888" }}>Quan hệ:</span> {selectedParent.quanHe || "--"}</div>
              <div><span style={{ color: "#888" }}>SĐT:</span> {selectedParent.sdt || "--"}</div>
              <div><span style={{ color: "#888" }}>Email:</span> {selectedParent.email || "--"}</div>
              <div><span style={{ color: "#888" }}>Địa chỉ:</span> {selectedParent.diaChi || "--"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bảng danh sách học sinh */}
      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách học sinh</div>
            <div className="panel-subtitle">Lớp chủ nhiệm được phân công</div>
          </div>
          <div className="panel-pill">{homeroomStudents.length} học sinh</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && homeroomStudents.length === 0 && (
          <div className="table-empty">Không có học sinh trong lớp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Học sinh</div>
            <div>Liên hệ</div>
            <div>Trạng thái</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div className="table-row" key={`skeleton-${i}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : homeroomStudents.map((student, i) => (
                <div className="table-row" key={student.id}>
                  <div className="table-id">{i + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{student.hoTen}</div>
                    <div className="table-meta">
                      {formatBirthDate(student.ngaySinh)} · {getGenderLabel(student.gioiTinh)}
                    </div>
                  </div>
                  <div className="table-email">
                    {student.sdt || "--"}
                    <div className="table-meta">{student.email || ""}</div>
                  </div>
                  <div>
                    <span className={`status-pill ${student.trangThai === 1 ? "status-active" : "status-locked"}`}>
                      {student.trangThai === 1 ? "Đang học" : "Ngừng học"}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
