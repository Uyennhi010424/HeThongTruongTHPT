import { useEffect, useMemo, useState } from "react";
import { getLichThi, exportLichThiPdf } from "../../../api/lichthiApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { notifyError } from "../../../utils/notify.js";
import { useTeacherFilters } from "../../../hooks/useTeacherFilters.js";
import TeacherFilter from "../../../components/common/TeacherFilter.jsx";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
  });
};

export default function TeacherLichThi() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lichThi, setLichThi] = useState([]);

  const filters = useTeacherFilters({ showSubject: false, showGrade: false, showClass: false });
  const { selectedNamHoc, selectedSemester } = filters;

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ltRes, meRes] = await Promise.all([
          getLichThi(),
          getCurrentGiaoVien().catch(() => null)
        ]);
        if (!active) return;

        const teacher = meRes?.data?.data || null;

        const allLichThi = ltRes?.data?.data || [];
        const teacherLichThi = teacher ? allLichThi.filter((lt) => {
          const isGiamThi1 = Number(lt.giamThi1Id ?? lt.giamThi1?.id) === Number(teacher.id);
          const isGiamThi2 = Number(lt.giamThi2Id ?? lt.giamThi2?.id) === Number(teacher.id);
          return isGiamThi1 || isGiamThi2;
        }) : allLichThi;

        setLichThi(teacherLichThi);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError("Không thể tải lịch thi: " + (err.message || "Lỗi không xác định"));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const getLopName = (lt) => lt.lop?.tenLop || "--";
  const getMonName = (lt) => lt.monHoc?.tenMon || "--";

  const filteredLichThi = useMemo(() => {
    return lichThi.filter((lt) => {
      if (selectedNamHoc && lt.namHoc !== selectedNamHoc) return false;
      const hocKyLichThi = `HK${lt.hocKy}`;
      if (selectedSemester && hocKyLichThi !== selectedSemester) return false;
      return true;
    }).sort((a, b) => new Date(a.ngayThi + "T" + (a.gioBatDau || "00:00")) - new Date(b.ngayThi + "T" + (b.gioBatDau || "00:00")));
  }, [lichThi, selectedNamHoc, selectedSemester]);

  const handleExportPdf = async () => {
    if (!filteredLichThi.length) {
      notifyError("Không có dữ liệu để xuất.");
      return;
    }
    try {
      const hocKyNum = selectedSemester ? selectedSemester.replace("HK", "") : "";
      const res = await exportLichThiPdf(selectedNamHoc || "", hocKyNum);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lichthi_${selectedNamHoc || "tatca"}_${hocKyNum || "all"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notifyError("Không thể xuất PDF lịch thi.");
    }
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      total: filteredLichThi.length,
      upcoming: filteredLichThi.filter((lt) => lt.ngayThi > todayStr).length,
      today: filteredLichThi.filter((lt) => lt.ngayThi === todayStr).length,
      completed: filteredLichThi.filter((lt) => lt.ngayThi < todayStr).length
    };
  }, [filteredLichThi]);

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24, background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Lịch coi thi</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>Theo dõi lịch coi thi được phân công trong năm học.</p>
        </div>

        {/* Toolbar in Header */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <TeacherFilter filters={filters} showGrade={false} showClass={false} showSubject={false} />

          <button
            type="button"
            onClick={handleExportPdf}
            style={{ height: 40, padding: "0 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" }}
          >
            Xuất PDF
          </button>
        </div>
      </div>

      {/* Statistic Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: "16px 24px", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Tổng lịch thi</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{stats.total}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Sắp diễn ra</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{stats.upcoming}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Hôm nay</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>{stats.today}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Đã hoàn thành</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{stats.completed}</span>
        </div>
      </div>

      {/* Error */}
      {error && <div style={{ padding: 16, background: "#fee2e2", color: "#dc2626", borderRadius: 8 }}>{error}</div>}

      {/* Data Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Danh sách lịch thi</div>
          <div style={{ background: "#f1f5f9", color: "#475569", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            {filteredLichThi.length} kết quả
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800, fontSize: 14 }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Ngày thi</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Môn</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Lớp</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Thời gian</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#475569", whiteSpace: "nowrap" }}>Học kỳ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredLichThi.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Không có lịch thi nào.</td>
                </tr>
              ) : (
                filteredLichThi.map((lt, idx) => (
                  <tr 
                    key={lt.id} 
                    style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#fff" : "#fbfbfc", transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fbfbfc"}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 600, color: "#0f172a" }}>{formatDateTime(lt.ngayThi)}</td>
                    <td style={{ padding: "14px 20px", fontWeight: 500, color: "#334155" }}>{getMonName(lt)}</td>
                    <td style={{ padding: "14px 20px", color: "#334155" }}>{getLopName(lt)}</td>
                    <td style={{ padding: "14px 20px", color: "#334155" }}>
                      {(() => {
                        if (!lt.gioBatDau) return lt.thoiGianLamBai ? `${lt.thoiGianLamBai} phút` : "--";
                        const [h, m] = lt.gioBatDau.split(":").map(Number);
                        const startStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        if (!lt.thoiGianLamBai) return startStr;
                        const start = new Date();
                        start.setHours(h, m, 0);
                        const end = new Date(start.getTime() + lt.thoiGianLamBai * 60000);
                        const endStr = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{startStr} - {endStr}</span>
                            <span style={{ fontSize: 12, color: "#64748b" }}>{lt.thoiGianLamBai} phút</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: "#eff6ff", color: "#1d4ed8" }}>
                        HK{lt.hocKy || "--"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
