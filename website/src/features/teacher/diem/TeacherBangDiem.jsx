import { useEffect, useMemo, useState, useRef } from "react";
import { getDiem } from "../../../api/diemApi.js";
import { getStudentClass, sortStudentsByGivenName } from "../../../utils/helpers.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";
import * as XLSX from "xlsx-js-style";

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
  return Number(((sumTx + 2 * gkVal + 3 * ckVal) / (txScores.length + 5)).toFixed(1));
};

const calcYearAvg = (hk1, hk2) => {
  if (hk1 === null || hk2 === null) return null;
  return Number(((hk1 + 2 * hk2) / 3).toFixed(1));
};

const formatCmt = (val) => {
  if (val === "DAT") return "Đạt";
  if (val === "CHUA_DAT") return "Không đạt";
  return val || "";
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
  const filters = useTeacherFilters({ homeroomOnly: true });
  const {
    loading: filterLoading,
    error: filterError,
    currentTeacher,
    selectedNamHoc,
    selectedSemester,
    selectedClassId,
    selectedSubjectObj: selectedSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    allStudents: students,
    filteredClasses,
    allowedSubjects
  } = filters;

  const [allScores, setAllScores] = useState([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  const tabsRef = useRef(null);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [allowedSubjects]);

  // Load scores when filters change
  useEffect(() => {
    if (!selectedNamHoc || !currentTeacher?.id || !selectedClassId || !selectedSemester) return;
    let active = true;
    const loadScores = async () => {
      try {
        setScoreLoading(true);
        setScoreError("");
        
        const hocKy = selectedSemester === "HK1" ? 1 : 2;
        const params = { namHoc: selectedNamHoc, lopId: selectedClassId, hocKy, skipCache: true };
        if (!filters.isHomeroomTeacherOfSelected) {
           params.giaoVienId = currentTeacher.id;
        }

        const res = await getDiem(params);
        if (!active) return;
        setAllScores(res?.data?.data || []);
      } catch (err) {
        console.error("Lỗi khi tải bảng điểm:", err);
        if (!active) return;
        setAllScores([]);
        setScoreError("Không thể tải bảng điểm");
      } finally {
        if (active) setScoreLoading(false);
      }
    };
    loadScores();
    return () => { active = false; };
  }, [selectedNamHoc, currentTeacher?.id, selectedClassId, selectedSemester, filters.isHomeroomTeacherOfSelected]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return sortStudentsByGivenName(
      students.filter((s) => s.trangThai === 1 && String(getStudentClass(s)?.id) === selectedClassId)
    );
  }, [students, selectedClassId]);

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
    if (!filteredStudents.length) return;
    
    // Determine which subjects to export
    const subjectsToExport = filters.isHomeroomTeacherOfSelected 
      ? filters.allowedSubjects 
      : filters.allowedSubjects.filter(s => String(s.id) === selectedSubjectId);
      
    if (subjectsToExport.length === 0) return;

    const sem = selectedSemester;
    const wb = XLSX.utils.book_new();
    const tenLop = filters.selectedClassObj?.tenLop || "Lop";
    const hocKyStr = sem === "HK1" ? "Học kỳ 1" : "Học kỳ 2";

    subjectsToExport.forEach(subject => {
      const isCmt = subject.nhomDanhGia === "NHAN_XET";
      const txCnt = isCmt ? 0 : (subject.soDtxHocKy || 3);
      
      // Build score map for this subject
      const map = {};
      const subjectScores = allScores.filter(s => String(s?.monHoc?.id ?? s?.monHocId) === String(subject.id));
      subjectScores.forEach(s => {
        const sid = s?.hocSinh?.id ?? s?.hocSinhId;
        if (!sid) return;
        if (!map[sid]) map[sid] = { tx: Array(txCnt).fill(""), gk: "", ck: "", nhanXet: "" };
        const val = s.giaTriDiem != null ? String(s.giaTriDiem) : "";
        const loai = String(s.loaiDiem || "").toUpperCase();
        if (loai === "TX") {
          const idx = Number(s.soThuTu || 1) - 1;
          if (idx >= 0 && idx < txCnt) map[sid].tx[idx] = val;
        } else if (loai === "GK") {
          map[sid].gk = val;
        } else if (loai === "CK") {
          map[sid].ck = val;
        }
        if (s.nhanXet) map[sid].nhanXet = s.nhanXet;
      });

      // Headers
      const txHeaders = Array.from({ length: txCnt }, (_, i) => `TX${i + 1}`);
      const headers = isCmt 
        ? ["STT", "Họ tên", "Lớp", "Nhận xét", "Đánh giá"] 
        : ["STT", "Họ tên", "Lớp", ...txHeaders, "GK", "CK", "ĐTB"];

      const titleText = `BẢNG ĐIỂM MÔN ${subject.tenMon.toUpperCase()} - LỚP ${tenLop.toUpperCase()} - ${hocKyStr.toUpperCase()} - NĂM HỌC ${selectedNamHoc}`;
      const dataRows = filteredStudents.map((st, idx) => {
        const data = map[st.id] || { tx: Array(txCnt).fill(""), gk: "", ck: "", nhanXet: "" };
        if (isCmt) {
           return [idx + 1, st.hoTen, tenLop, formatCmt(data.nhanXet), formatCmt(data.ck)];
        } else {
           const avg = calcSemesterAvg(data.tx, data.gk, data.ck);
           return [idx + 1, st.hoTen, tenLop, ...data.tx, data.gk, data.ck, avg !== null ? avg : ""];
        }
      });

      const aoa = [
        [titleText],
        [],
        headers,
        ...dataRows
      ];

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const numCols = headers.length;

      // Merge title
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];

      // Styles
      const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[titleCellRef]) {
        ws[titleCellRef].s = {
          font: { name: "Arial", size: 16, bold: true, color: { rgb: "1E293B" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }

      ws["!rows"] = [
        { hpt: 35 },
        { hpt: 10 },
        { hpt: 28 },
        ...filteredStudents.map(() => ({ hpt: 20 }))
      ];

      const colWidths = isCmt 
        ? [{ wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 40 }, { wch: 15 }]
        : [{ wch: 6 }, { wch: 25 }, { wch: 10 }, ...txHeaders.map(() => ({ wch: 8 })), { wch: 8 }, { wch: 8 }, { wch: 10 }];
      ws["!cols"] = colWidths;

      const borderThin = {
        top: { style: "thin", color: { rgb: "CBD5E1" } },
        bottom: { style: "thin", color: { rgb: "CBD5E1" } },
        left: { style: "thin", color: { rgb: "CBD5E1" } },
        right: { style: "thin", color: { rgb: "CBD5E1" } }
      };

      const headerStyle = {
        fill: { fgColor: { rgb: "F1F5F9" } },
        font: { name: "Arial", size: 10, bold: true, color: { rgb: "334155" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderThin
      };

      const centerStyle = {
        font: { name: "Arial", size: 10, color: { rgb: "1E293B" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: borderThin
      };

      const leftStyle = {
        font: { name: "Arial", size: 10, color: { rgb: "1E293B" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderThin
      };

      for (let c = 0; c < numCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 2, c });
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }

      for (let r = 0; r < dataRows.length; r++) {
        for (let c = 0; c < numCols; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r + 3, c });
          if (ws[cellRef]) {
            ws[cellRef].s = (c === 1 || (isCmt && c === 3)) ? leftStyle : centerStyle;
            
            if (c === numCols - 1) {
              const val = dataRows[r][c];
              if (!isCmt && val !== "") {
                 const num = Number(val);
                 let color = "1E293B";
                 if (num < 5) color = "DC2626";
                 else if (num >= 8) color = "16A34A";
                 else if (num >= 6.5) color = "2563EB";
                 ws[cellRef].s = { ...centerStyle, font: { ...centerStyle.font, bold: true, color: { rgb: color } }, fill: { fgColor: { rgb: "F8FAFC" } } };
              } else if (isCmt && val !== "") {
                 let color = "1E293B";
                 if (val === "Đạt") color = "16A34A";
                 else if (val === "Chưa đạt") color = "DC2626";
                 ws[cellRef].s = { ...centerStyle, font: { ...centerStyle.font, bold: true, color: { rgb: color } }, fill: { fgColor: { rgb: "F8FAFC" } } };
              }
            }
          }
        }
      }

      let sheetName = subject.tenMon.replace(/[\\/?*\[\]]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `BangDiem_${tenLop}_${sem}_${selectedNamHoc.replace("-", "_")}.xlsx`);
  };

  return (
    <div style={{ maxWidth: 1600, margin: "0 auto", width: "100%", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header & Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", letterSpacing: "-0.025em", margin: 0 }}>Xem bảng điểm lớp học</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>Xem và xuất bảng điểm chi tiết theo môn học</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <TeacherFilter filters={filters} showClass={false} showGrade={false} showSubject={false} />
          <button 
            onClick={handleExportCsv} 
            disabled={!filteredStudents.length || !selectedSubject}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", height: 42,
              background: (!filteredStudents.length || !selectedSubject) ? "#e2e8f0" : "#16a34a",
              color: (!filteredStudents.length || !selectedSubject) ? "#94a3b8" : "#fff",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 6, verticalAlign: "middle" }}>download</span>
            <span style={{ verticalAlign: "middle" }}>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs chọn môn học ngang */}
      <style>{`.hide-scroll-tabs::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; } .hide-scroll-tabs { scrollbar-width: none !important; -ms-overflow-style: none !important; }`}</style>
      {allowedSubjects && allowedSubjects.length > 0 && (
        <div 
          ref={tabsRef}
          className="hide-scroll-tabs" 
          style={{ display: "flex", gap: 32, overflowX: "auto", borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}
        >
          {allowedSubjects.map(s => {
            const isActive = String(selectedSubjectId) === String(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(String(s.id))}
                style={{
                  padding: "12px 4px",
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: "nowrap",
                  border: "none",
                  borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                  background: "transparent",
                  color: isActive ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "-1px"
                }}
              >
                {s.tenMon}
              </button>
            );
          })}
        </div>
      )}

      {(filterError || scoreError) && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>{filterError || scoreError}</div>}

      {!(filterError || scoreError) && !(filterLoading || scoreLoading) && !selectedClassId && (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1" }}>
          Vui lòng chọn lớp và môn học để xem bảng điểm.
        </div>
      )}

      {!(filterError || scoreError) && !(filterLoading || scoreLoading) && selectedClassId && selectedSubject && (() => {
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
        const classAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : "--";
        const gioi = allAvgs.filter(v => v >= 8).length;
        const khac = allAvgs.filter(v => v >= 6.5 && v < 8).length;
        const dat = allAvgs.filter(v => v >= 5 && v < 6.5).length;
        const yeu = allAvgs.filter(v => v < 5).length;

        return (
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            {/* Table Header Info */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Lớp {filters.selectedClassObj?.tenLop || ""} · {selectedSubject.tenMon} · {selectedSemester === "HK1" ? "Học kỳ I" : "Học kỳ II"} · {selectedNamHoc}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{filteredStudents.length} học sinh · Điểm TB lớp: <strong style={{ color: "#2563eb" }}>{classAvg}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 16, background: "#f8fafc", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>● Tốt: {gioi}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>● Khá: {khac}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#ca8a04" }}>● Đạt: {dat}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#dc2626" }}>● Chưa đạt: {yeu}</span>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#f8fafc" }}>
                  <tr>
                    <th style={{ ...thStl(50), position: "sticky", left: 0, zIndex: 11, background: "#f8fafc" }}>STT</th>
                    <th style={{ ...thStl(180, "left"), position: "sticky", left: 50, zIndex: 11, background: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>Họ và tên</th>
                    <th style={thStl(80)}>Lớp</th>
                    {!isComment && Array.from({ length: txCount }, (_, i) => (
                      <th key={i} style={thStl(60)}>TX{i + 1}</th>
                    ))}
                    {!isComment && <th style={thStl(60)}>GK</th>}
                    {!isComment && <th style={thStl(60)}>CK</th>}
                    {!isComment && <th style={thStl(80)}>TBHK</th>}
                    {isComment && <th style={thStl(120)}>Đánh giá</th>}
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
                        <td style={{ ...tdStl("center"), position: "sticky", left: 0, background: isEven ? "#fff" : "#f9fafb" }}>{idx + 1}</td>
                        <td style={{ ...tdStl("left", true), position: "sticky", left: 50, background: isEven ? "#fff" : "#f9fafb", borderRight: "1px solid #f1f5f9" }}>{s.hoTen}</td>
                        <td style={tdStl("center")}>{getStudentClass(s)?.tenLop || "--"}</td>
                        {!isComment && data.tx.map((v, i) => (
                          <td key={i} style={{ ...tdStl("center"), color: getScoreColor(v), fontWeight: 600 }}>{v || "--"}</td>
                        ))}
                        {!isComment && <td style={{ ...tdStl("center"), color: getScoreColor(data.gk), fontWeight: 600 }}>{data.gk || "--"}</td>}
                        {!isComment && <td style={{ ...tdStl("center"), color: getScoreColor(data.ck), fontWeight: 600 }}>{data.ck || "--"}</td>}
                        {!isComment && <td style={{ ...tdStl("center"), ...getAvgStyle(avg) }}>{avg ?? "--"}</td>}
                        {isComment && <td style={tdStl("center")}>
                          <span style={{
                            padding: "4px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
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

