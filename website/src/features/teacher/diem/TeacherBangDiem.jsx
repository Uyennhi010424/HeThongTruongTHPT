import { useEffect, useMemo, useState } from "react";
import { getDiem } from "../../../api/diemApi.js";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getPhanCongDay } from "../../../api/phancongDayApi.js";
import { getStudentClass, sortStudentsByGivenName } from "../../../utils/helpers.js";

const toScore = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const score = Number(value);
  return Number.isNaN(score) ? null : Math.max(0, Math.min(10, score));
};

const calcSemesterAvg = (tx, gk, ck) => {
  const txScores = (tx || []).map(toScore).filter((v) => v !== null);
  const gkVal = toScore(gk);
  const ckVal = toScore(ck);
  if (txScores.length === 0 || gkVal === null || ckVal === null) return null;
  const sumTx = txScores.reduce((a, b) => a + b, 0);
  return Number(((sumTx + 2 * gkVal + 3 * ckVal) / (txScores.length + 5)).toFixed(2));
};

const calcYearAvg = (hk1, hk2) => {
  if (hk1 === null || hk2 === null) return null;
  return Number(((hk1 + 2 * hk2) / 3).toFixed(2));
};

const thStl = (width, align = "center") => ({
  padding: "10px 12px", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "#475569", background: "#f1f5f9",
  borderBottom: "2px solid #e2e8f0", textAlign: align,
  whiteSpace: "nowrap", width: width || undefined, minWidth: width || undefined
});

const tdStl = (align = "center", bold = false) => ({
  padding: "8px 12px", borderBottom: "1px solid #f1f5f9",
  textAlign: align, whiteSpace: "nowrap",
  fontWeight: bold ? 600 : 400, color: "#1e293b"
});

export default function TeacherBangDiem() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [namHocList, setNamHocList] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [allScores, setAllScores] = useState([]);
  const [phanCong, setPhanCong] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hsRes, lopRes, monRes, namRes, pcRes, meRes] = await Promise.all([
          getHocSinh(),
          getLop(),
          getMonHoc(),
          getNamHoc(),
          getPhanCongDay(),
          getCurrentGiaoVien().catch(() => null)
        ]);
        if (!active) return;

        const teacher = meRes?.data?.data || null;
        setCurrentTeacher(teacher);

        const years = (namRes?.data?.data || [])
          .map((i) => i?.tenNamHoc || "").filter(Boolean)
          .sort((a, b) => Number(b.match(/(\d{4})/)?.[1] || 0) - Number(a.match(/(\d{4})/)?.[1] || 0));
        setNamHocList(years);
        const currentYear = years[0] || "";
        setSelectedNamHoc(currentYear);

        const allClasses = lopRes?.data?.data || [];
        const allSubjects = monRes?.data?.data || [];
        const allPhanCong = pcRes?.data?.data || [];
        setPhanCong(allPhanCong);

        if (teacher) {
          const assignedClassIds = new Set(
            allPhanCong
              .filter((p) => Number(p?.giaoVienId ?? p?.giaoVien?.id) === Number(teacher.id))
              .map((p) => String(p?.lopId ?? p?.lop?.id ?? ""))
              .filter(Boolean)
          );
          const teacherClasses = allClasses.filter((c) => assignedClassIds.has(String(c.id)));
          setClasses(teacherClasses.length > 0 ? teacherClasses : allClasses);

          const assignedSubjectIds = new Set(
            allPhanCong
              .filter((p) => Number(p?.giaoVienId ?? p?.giaoVien?.id) === Number(teacher.id))
              .map((p) => String(p?.monHocId ?? p?.monHoc?.id ?? ""))
              .filter(Boolean)
          );
          const teacherSubjects = allSubjects.filter((s) => assignedSubjectIds.has(String(s.id)));
          setSubjects(teacherSubjects.length > 0 ? teacherSubjects : allSubjects);
        } else {
          setClasses(allClasses);
          setSubjects(allSubjects);
        }

        setStudents(hsRes?.data?.data || []);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  // Load scores when filters change
  useEffect(() => {
    if (!selectedNamHoc || !currentTeacher?.id) return;
    let active = true;
    const loadScores = async () => {
      try {
        const res = await getDiem({ giaoVienId: currentTeacher.id, namHoc: selectedNamHoc, skipCache: true });
        if (!active) return;
        setAllScores(res?.data?.data || []);
      } catch {
        if (!active) return;
        setAllScores([]);
      }
    };
    loadScores();
    return () => { active = false; };
  }, [selectedNamHoc, currentTeacher?.id]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return sortStudentsByGivenName(
      students.filter((s) => String(getStudentClass(s)?.id) === selectedClassId)
    );
  }, [students, selectedClassId]);

  const selectedSubject = useMemo(
    () => subjects.find((s) => String(s.id) === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  const txCount = useMemo(() => {
    if (!selectedSubject) return 3;
    if (selectedSubject.nhomDanhGia === "NHAN_XET") return 0;
    return selectedSubject.soDtxHocKy || 3;
  }, [selectedSubject]);

  const isComment = selectedSubject?.nhomDanhGia === "NHAN_XET";

  // Build score map: { studentId: { HK1: {tx:[], gk, ck}, HK2: {...} } }
  const scoreMap = useMemo(() => {
    const map = {};
    const filtered = allScores.filter((s) => {
      const mid = s?.monHoc?.id ?? s?.monHocId;
      return String(mid) === selectedSubjectId;
    });
    filtered.forEach((s) => {
      const sid = s?.hocSinh?.id ?? s?.hocSinhId;
      if (!sid) return;
      if (!map[sid]) map[sid] = { HK1: { tx: Array(txCount).fill(""), gk: "", ck: "", nhanXet: "" }, HK2: { tx: Array(txCount).fill(""), gk: "", ck: "", nhanXet: "" } };
      const sem = s.hocKy === 2 ? "HK2" : "HK1";
      const val = s.giaTriDiem != null ? String(s.giaTriDiem) : "";
      const loai = String(s.loaiDiem || "").toUpperCase();
      if (loai === "TX") {
        const idx = Number(s.soThuTu || 1) - 1;
        if (idx >= 0 && idx < txCount) map[sid][sem].tx[idx] = val;
      } else if (loai === "GK") {
        map[sid][sem].gk = val;
      } else if (loai === "CK") {
        map[sid][sem].ck = val;
      }
      if (s.nhanXet) map[sid][sem].nhanXet = s.nhanXet;
    });
    return map;
  }, [allScores, selectedSubjectId, txCount]);

  const handleExportCsv = () => {
    if (!filteredStudents.length || !selectedSubject) return;
    const sem = selectedSemester;
    const rows = [["STT", "Họ tên", "Lớp", ...Array.from({ length: txCount }, (_, i) => `TX${i + 1}`), "GK", "CK", "TBHK"]];
    filteredStudents.forEach((s, idx) => {
      const data = scoreMap[s.id]?.[sem] || { tx: Array(txCount).fill(""), gk: "", ck: "" };
      const avg = isComment ? "" : (calcSemesterAvg(data.tx, data.gk, data.ck) ?? "");
      rows.push([idx + 1, s.hoTen, getStudentClass(s)?.tenLop || "", ...data.tx, data.gk, data.ck, avg]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bangdiem_${selectedSubject.tenMon}_${sem}_${selectedNamHoc}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page users-page teacher-page">

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Xem bảng điểm lớp học</div>
          <div className="users-subtitle">Xem và xuất bảng điểm chi tiết theo môn học</div>
        </div>
        <div className="users-actions">
          <button className="btn-primary" onClick={handleExportCsv} disabled={!filteredStudents.length || !selectedSubject}>
            Xuất CSV
          </button>
        </div>
      </div>

      <div className="card users-toolbar">
        <div className="users-actions" style={{ flexWrap: "wrap" }}>
          <label className="form-field">
            <span>Năm học</span>
            <select value={selectedNamHoc} onChange={(e) => setSelectedNamHoc(e.target.value)}>
              {namHocList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Học kỳ</span>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
              <option value="HK1">Học kỳ I</option>
              <option value="HK2">Học kỳ II</option>
            </select>
          </label>
          <label className="form-field">
            <span>Lớp</span>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classes.map((c) => <option key={c.id} value={String(c.id)}>{c.tenLop}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Môn học</span>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
              <option value="">-- Chọn môn --</option>
              {subjects.map((s) => <option key={s.id} value={String(s.id)}>{s.tenMon}</option>)}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && !selectedClassId && (
        <div className="card table-empty">Vui lòng chọn lớp và môn học để xem bảng điểm.</div>
      )}

      {!error && !loading && selectedClassId && selectedSubject && (() => {
        const getScoreColor = (val) => {
          const n = Number(val);
          if (Number.isNaN(n) || val === "" || val === null) return "#6b7280";
          if (n < 3.5) return "#dc2626";
          if (n < 5) return "#ea580c";
          if (n < 6.5) return "#ca8a04";
          if (n < 8) return "#2563eb";
          return "#16a34a";
        };
        const getAvgStyle = (avg) => {
          if (avg === null || avg === undefined) return { color: "#9ca3af" };
          if (avg >= 8) return { color: "#16a34a", fontWeight: 700, background: "#dcfce7", borderRadius: 6, padding: "2px 8px" };
          if (avg >= 6.5) return { color: "#2563eb", fontWeight: 700 };
          if (avg >= 5) return { color: "#ca8a04", fontWeight: 700 };
          return { color: "#dc2626", fontWeight: 700, background: "#fee2e2", borderRadius: 6, padding: "2px 8px" };
        };

        // Stats
        const allAvgs = filteredStudents.map(s => {
          const d = scoreMap[s.id]?.[selectedSemester];
          if (!d) return null;
          return calcSemesterAvg(d.tx, d.gk, d.ck);
        }).filter(v => v !== null);
        const classAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : "--";
        const gioi = allAvgs.filter(v => v >= 8).length;
        const khac = allAvgs.filter(v => v >= 6.5 && v < 8).length;
        const dat = allAvgs.filter(v => v >= 5 && v < 6.5).length;
        const yeu = allAvgs.filter(v => v < 5).length;

        return (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{selectedSubject.tenMon} · {selectedSemester === "HK1" ? "Học kỳ I" : "Học kỳ II"} · {selectedNamHoc}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{filteredStudents.length} học sinh · Điểm TB lớp: <strong style={{ color: "#2563eb" }}>{classAvg}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#16a34a" }}>● Tốt: {gioi}</span>
                <span style={{ fontSize: 12, color: "#2563eb" }}>● Khá: {khac}</span>
                <span style={{ fontSize: 12, color: "#ca8a04" }}>● Đạt: {dat}</span>
                <span style={{ fontSize: 12, color: "#dc2626" }}>● Chưa đạt: {yeu}</span>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStl(40)}>STT</th>
                    <th style={thStl(160, "left")}>Họ và tên</th>
                    <th style={thStl(60)}>Lớp</th>
                    {!isComment && Array.from({ length: txCount }, (_, i) => (
                      <th key={i} style={thStl(50)}>TX{i + 1}</th>
                    ))}
                    {!isComment && <th style={thStl(50)}>GK</th>}
                    {!isComment && <th style={thStl(50)}>CK</th>}
                    {!isComment && <th style={thStl(70)}>TBHK</th>}
                    {isComment && <th style={thStl(100)}>Đánh giá</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const data = scoreMap[s.id]?.[selectedSemester] || { tx: Array(txCount).fill(""), gk: "", ck: "", nhanXet: "" };
                    const avg = isComment ? null : calcSemesterAvg(data.tx, data.gk, data.ck);
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={s.id} style={{ background: isEven ? "#fff" : "#f9fafb", transition: "background 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={(e) => e.currentTarget.style.background = isEven ? "#fff" : "#f9fafb"}
                      >
                        <td style={tdStl("center")}>{idx + 1}</td>
                        <td style={tdStl("left", true)}>{s.hoTen}</td>
                        <td style={tdStl("center")}>{getStudentClass(s)?.tenLop || "--"}</td>
                        {!isComment && data.tx.map((v, i) => (
                          <td key={i} style={{ ...tdStl("center"), color: getScoreColor(v) }}>{v || "--"}</td>
                        ))}
                        {!isComment && <td style={{ ...tdStl("center"), color: getScoreColor(data.gk) }}>{data.gk || "--"}</td>}
                        {!isComment && <td style={{ ...tdStl("center"), color: getScoreColor(data.ck) }}>{data.ck || "--"}</td>}
                        {!isComment && <td style={{ ...tdStl("center"), ...getAvgStyle(avg) }}>{avg ?? "--"}</td>}
                        {isComment && <td style={tdStl("center")}>
                          <span style={{
                            padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                            background: data.nhanXet === "CHUA_DAT" ? "#fee2e2" : "#dcfce7",
                            color: data.nhanXet === "CHUA_DAT" ? "#dc2626" : "#16a34a"
                          }}>
                            {data.nhanXet === "CHUA_DAT" ? "Chưa đạt" : "Đạt"}
                          </span>
                        </td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
