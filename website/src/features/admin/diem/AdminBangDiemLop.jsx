import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getClassScoreboard } from "../../../api/diemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx-js-style";

/* ── Hàm format ─────────────────────────────────────────── */
const fmt = (score) => {
  if (score === null || score === undefined) return "--";
  if (score === "DAT") return "Đạt";
  if (score === "CHUA_DAT") return "Không đạt";
  if (typeof score === "number") return score.toFixed(1);
  return score;
};

/* ── Xuất Excel (Sử dụng xlsx-js-style để định dạng chuyên nghiệp) ── */
function exportExcel(classInfo, namHoc, hocKy, subjects, students) {
  const tenLop = classInfo?.tenLop || "Lop";
  const titleText = `BẢNG ĐIỂM LỚP ${tenLop.toUpperCase()} - NĂM HỌC ${namHoc} - HỌC KỲ ${hocKy}`;
  const headers = ["STT", "Mã HS", "Họ và tên", ...subjects.map((s) => s.tenMon), "ĐTB Học kỳ"];
  
  const dataRows = students.map((st, idx) => [
    idx + 1,
    st.maHs || "",
    st.hoTen || "",
    ...subjects.map((s) => fmt(st.scores[s.id])),
    fmt(st.dtbHk),
  ]);

  const aoa = [
    [titleText],
    [], // Dòng trống cách biệt
    headers,
    ...dataRows
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const numCols = headers.length;

  // 1. Merge tiêu đề bảng điểm
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }
  ];

  // 2. Định dạng Title Cell
  const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[titleCellRef]) {
    ws[titleCellRef].s = {
      font: { name: "Arial", size: 16, bold: true, color: { rgb: "1E293B" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }

  // 3. Cấu hình độ cao hàng
  ws["!rows"] = [
    { hpt: 35 }, // Tiêu đề chính
    { hpt: 10 }, // Dòng trống
    { hpt: 28 }, // Headers
    ...students.map(() => ({ hpt: 20 })) // Học sinh rows
  ];

  // 4. Cấu hình chiều rộng cột (STT: 6, Mã HS: 14, Họ tên: 25, Môn học: 18, ĐTB: 14)
  const colWidths = [
    { wch: 6 },
    { wch: 14 },
    { wch: 25 },
    ...subjects.map(() => ({ wch: 18 })),
    { wch: 14 }
  ];
  ws["!cols"] = colWidths;

  // 5. Định dạng đường viền (Border)
  const borderThin = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } }
  };

  // 6. Định dạng Headers Style
  const headerStyle = {
    fill: { fgColor: { rgb: "F1F5F9" } },
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "334155" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "94A3B8" } },
      bottom: { style: "medium", color: { rgb: "475569" } },
      left: { style: "thin", color: { rgb: "94A3B8" } },
      right: { style: "thin", color: { rgb: "94A3B8" } }
    }
  };

  const headerLeftStyle = {
    ...headerStyle,
    alignment: { horizontal: "left", vertical: "center", wrapText: true }
  };

  // Apply header styles
  for (let c = 0; c < numCols; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c });
    if (ws[cellRef]) {
      ws[cellRef].s = (c === 1 || c === 2) ? headerLeftStyle : headerStyle;
    }
  }

  // 7. Định dạng Data Style
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

  const boldLeftStyle = {
    ...leftStyle,
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "1E293B" } }
  };

  const dtbStyle = {
    fill: { fgColor: { rgb: "EFF6FF" } },
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "1D4ED8" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      ...borderThin,
      left: { style: "thin", color: { rgb: "BFDBFE" } },
      right: { style: "thin", color: { rgb: "BFDBFE" } }
    }
  };

  const passStyle = {
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "16A34A" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin
  };

  const failStyle = {
    font: { name: "Arial", size: 10, bold: true, color: { rgb: "DC2626" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin
  };

  // Loop qua các học sinh và áp dụng style dữ liệu
  for (let r = 0; r < dataRows.length; r++) {
    const rowIdx = r + 3; // header bắt đầu từ row 2
    for (let c = 0; c < numCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (ws[cellRef]) {
        if (c === 0) {
          ws[cellRef].s = centerStyle;
        } else if (c === 1) {
          ws[cellRef].s = leftStyle;
        } else if (c === 2) {
          ws[cellRef].s = boldLeftStyle;
        } else if (c === numCols - 1) {
          ws[cellRef].s = dtbStyle;
        } else {
          // Các cột môn học
          const val = dataRows[r][c];
          if (val === "Đạt") {
            ws[cellRef].s = passStyle;
          } else if (val === "Chưa đạt") {
            ws[cellRef].s = failStyle;
          } else {
            ws[cellRef].s = centerStyle;
          }
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "BangDiemLop");
  XLSX.writeFile(wb, `BangDiem_${tenLop}_${namHoc}_HK${hocKy}.xlsx`);
}

/* ── Component ─────────────────────────────────────────── */
export default function AdminBangDiemLop() {
  const { lopId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [namHocList, setNamHocList] = useState([]);
  const [namHoc, setNamHoc] = useState("");
  const [hocKy, setHocKy] = useState("1");
  
  const [classInfo, setClassInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // Load danh sách năm học lần đầu tiên
  useEffect(() => {
    const fetchNamHoc = async () => {
      try {
        const res = await getNamHoc();
        const list = res?.data?.data || [];
        setNamHocList(list);
        
        let selectedNh = "";
        const active = list.find((nh) => nh.trangThai === "DANG_MO");
        if (active) {
          selectedNh = active.tenNamHoc;
        } else if (list.length > 0) {
          selectedNh = list[0].tenNamHoc; // Chọn cái đầu tiên nếu không có cái nào active
        }
        
        if (selectedNh) {
          setNamHoc(selectedNh);
          setHocKy("1"); // Mặc định học kỳ 1
        }
      } catch (err) {
        console.error("Lỗi tải danh sách năm học:", err);
      }
    };
    fetchNamHoc();
  }, []);

  // Fetch dữ liệu bảng điểm khi namHoc, hocKy, lopId thay đổi
  const fetchScoreboard = async () => {
    if (!lopId || !namHoc || !hocKy) return;
    setLoading(true);
    setError("");
    try {
      const res = await getClassScoreboard({ lopId, namHoc, hocKy: Number(hocKy) });
      const data = res?.data?.data;
      if (data) {
        setClassInfo(data.classInfo);
        const filteredSubjects = (data.subjects || []).filter(s => {
          const name = (s.tenMon || "").toLowerCase();
          return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
        });
        setSubjects(filteredSubjects);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Lỗi tải bảng điểm:", err);
      setError("Không thể tải dữ liệu bảng điểm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, [lopId, namHoc, hocKy]);

  /* ── Loading / Error ───────────────────────────────── */
  if (loading && students.length === 0 && !error) {
    return (
      <div className="flex justify-center items-center h-64 gap-3">
        <div className="w-7 h-7 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-slate-600 font-medium">Đang tải bảng điểm...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/admin/diem")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="text-red-600 bg-red-50 border border-red-200 p-5 rounded-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/diem")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 flex-shrink-0"
            title="Quay lại danh sách lớp"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Bảng điểm lớp {classInfo?.tenLop || ""}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
              <span>GVCN: <span className="font-medium text-slate-700">{classInfo?.tenGvcn || "Chưa gán"}</span></span>
              <span>Sĩ số: <span className="font-medium text-slate-700">{students.length} học sinh</span></span>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={namHoc}
            onChange={(e) => setNamHoc(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {namHocList.map((nh) => (
              <option key={nh.id} value={nh.tenNamHoc}>{nh.tenNamHoc}</option>
            ))}
          </select>
          <select
            value={hocKy}
            onChange={(e) => setHocKy(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </select>

          <button
            onClick={fetchScoreboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-500" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={() => exportExcel(classInfo, namHoc, hocKy, subjects, students)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* ── Bảng điểm ───────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: "600px" }}
          >
            {/* Sticky thead */}
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ ...thFixed(50), position: "sticky", top: 0, left: 0, zIndex: 30, background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>STT</th>
                <th style={{ ...thFixed(100, "left"), position: "sticky", top: 0, left: 50, zIndex: 30, background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>Mã HS</th>
                <th style={{ ...thFixed(200, "left"), position: "sticky", top: 0, left: 150, zIndex: 30, background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>Họ và tên</th>
                {subjects.map((s) => (
                  <th key={s.id} style={{ ...thFixed(120), position: "sticky", top: 0, zIndex: 20, whiteSpace: "normal", verticalAlign: "middle", lineHeight: "1.2" }} title={s.tenMon}>
                    {s.tenMon}
                  </th>
                ))}
                <th
                  style={{
                    ...thFixed(100),
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    position: "sticky",
                    top: 0,
                    right: 0,
                    zIndex: 30,
                    borderLeft: "1px solid #bfdbfe",
                  }}
                >
                  ĐTB HK
                </th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={subjects.length + 4}
                    style={{ padding: "48px 16px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}
                  >
                    Chưa có dữ liệu bảng điểm.
                  </td>
                </tr>
              ) : (
                students.map((st, idx) => (
                  <tr
                    key={st.id}
                    className="bg-white hover:bg-slate-50 transition-colors"
                  >
                    <td style={{ ...tdC(), position: "sticky", left: 0, zIndex: 10, background: "inherit", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>{idx + 1}</td>
                    <td style={{ ...tdL(), position: "sticky", left: 50, zIndex: 10, background: "inherit", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>{st.maHs || "--"}</td>
                    <td style={{ ...tdL(), position: "sticky", left: 150, zIndex: 10, background: "inherit", fontWeight: 600, borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>{st.hoTen}</td>
                    {subjects.map((s) => {
                      const score = st.scores[s.id];
                      return (
                        <td key={s.id} style={{ ...tdC(), borderBottom: "1px solid #f1f5f9" }}>
                          {s.nhomDanhGia === "NHAN_XET" ? (
                            score === "Đạt" ? (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#dcfce7",
                                color: "#16a34a",
                                display: "inline-block"
                              }}>Đạt</span>
                            ) : score === "Chưa đạt" ? (
                              <span style={{
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#fee2e2",
                                color: "#dc2626",
                                display: "inline-block"
                              }}>Chưa đạt</span>
                            ) : (
                              "--"
                            )
                          ) : (
                            fmt(score)
                          )}
                        </td>
                      );
                    })}
                    <td
                      style={{
                        ...tdC(),
                        background: "#eff6ff",
                        fontWeight: 700,
                        color: "#1d4ed8",
                        position: "sticky",
                        right: 0,
                        zIndex: 10,
                        borderBottom: "1px solid #bfdbfe",
                        borderLeft: "1px solid #bfdbfe",
                      }}
                    >
                      {fmt(st.dtbHk)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500 text-right">
          Tổng: {students.length} học sinh &nbsp;·&nbsp; {subjects.length} môn học
        </div>
      </div>
    </div>
  );
}

/* ── Style helpers ─────────────────────────────────────── */
const thFixed = (width, align = "center") => ({
  padding: "11px 12px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#475569",
  background: "#f1f5f9",
  borderBottom: "2px solid #e2e8f0",
  textAlign: align,
  whiteSpace: "nowrap",
  minWidth: width,
  maxWidth: width,
});

const tdC = () => ({
  padding: "9px 12px",
  textAlign: "center",
  whiteSpace: "nowrap",
  color: "#1e293b",
  fontSize: 14,
});

const tdL = () => ({
  padding: "9px 12px",
  textAlign: "left",
  whiteSpace: "nowrap",
  color: "#1e293b",
  fontSize: 14,
});
