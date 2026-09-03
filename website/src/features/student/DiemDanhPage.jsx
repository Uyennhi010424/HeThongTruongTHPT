import { useEffect, useMemo, useState } from "react";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";

const STATUS_MAP = {
  CO_MAT: { label: "Có mặt", color: "text-green-700 bg-green-50" },
  CO_PHEP: { label: "Vắng có phép", color: "text-yellow-700 bg-yellow-50" },
  KHONG_PHEP: { label: "Vắng không phép", color: "text-red-700 bg-red-50" },
};

export default function StudentDiemDanhPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [namHocList, setNamHocList] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentRes, namHocRes] = await Promise.all([
          getCurrentHocSinh(),
          getNamHoc()
        ]);
        if (!active) return;
        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        if (!currentStudent) {
          setError("Không tìm thấy thông tin học sinh. Vui lòng đăng nhập lại.");
          setLoading(false);
          return;
        }

        const years = (namHocRes?.data?.data || [])
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => Number(b.match(/(\d{4})/)?.[1] || 0) - Number(a.match(/(\d{4})/)?.[1] || 0));

        setNamHocList(years);
        const curYear = currentStudent?.lop?.namHoc || years[0] || "2026-2027";
        setSelectedNamHoc(curYear);

        const match = curYear.match(/(\d{4})-(\d{4})/);
        const startY = match ? match[1] : "2026";
        const endY = match ? match[2] : "2027";
        const fromStr = `${startY}-09-01`;
        const toStr = `${endY}-06-30`;
        setFromDate(fromStr);
        setToDate(toStr);

        const statsRes = await getStudentStatistics(currentStudent.id, fromStr, toStr);
        if (!active) return;
        setStatistics(statsRes?.data?.data || null);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const handleYearChange = async (newYear) => {
    setSelectedNamHoc(newYear);
    if (!student?.id) return;
    try {
      setLoading(true);
      const match = newYear.match(/(\d{4})-(\d{4})/);
      const startY = match ? match[1] : "2026";
      const endY = match ? match[2] : "2027";
      const fromStr = `${startY}-09-01`;
      const toStr = `${endY}-06-30`;
      setFromDate(fromStr);
      setToDate(toStr);

      const statsRes = await getStudentStatistics(student.id, fromStr, toStr);
      setStatistics(statsRes?.data?.data || null);
    } catch {
      setError("Không thể tải dữ liệu điểm danh.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!student?.id || !fromDate || !toDate) return;
    try {
      setLoading(true);
      const statsRes = await getStudentStatistics(student.id, fromDate, toDate);
      setStatistics(statsRes?.data?.data || null);
    } catch {
      setError("Không thể tải dữ liệu điểm danh.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!statistics) return { tongNgayHoc: 0, coMat: 0, vangCoPhep: 0, vangKhongPhep: 0, diTre: 0 };
    const total = statistics.tongNgayHoc ?? statistics.totalDays ?? 0;
    const coPhep = statistics.excusedAbsent ?? statistics.vangCoPhep ?? 0;
    const khongPhep = statistics.unexcusedAbsent ?? statistics.vangKhongPhep ?? 0;
    const coMat = statistics.present ?? statistics.coMat ?? Math.max(0, total - coPhep - khongPhep);
    return {
      tongNgayHoc: total,
      coMat,
      vangCoPhep: coPhep,
      vangKhongPhep: khongPhep,
      diTre: statistics.late ?? statistics.diTre ?? 0
    };
  }, [statistics]);

  const total = stats.tongNgayHoc;
  const attendanceRate = total > 0 ? ((stats.coMat / total) * 100).toFixed(1) : "100.0";
  const absentRate = total > 0 ? (((stats.vangCoPhep + stats.vangKhongPhep) / total) * 100).toFixed(1) : "0.0";
  const excusedRate = total > 0 ? ((stats.vangCoPhep / total) * 100).toFixed(1) : "0.0";
  const unexcusedRate = total > 0 ? ((stats.vangKhongPhep / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Điểm danh</h2>
          <p className="student-hero-subtitle">Theo dõi tình hình đi học cả năm học {selectedNamHoc}.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : absentRate}% vắng</div>
        </div>
      </section>

      <div className="card users-toolbar">
        <div className="users-actions">
          {namHocList.length > 0 && (
            <label className="form-field">
              <span>Năm học</span>
              <select 
                value={selectedNamHoc} 
                onChange={(e) => handleYearChange(e.target.value)}
                className="font-bold text-blue-800"
              >
                {namHocList.map((y) => (
                  <option key={y} value={y}>Năm học {y}</option>
                ))}
              </select>
            </label>
          )}
          <label className="form-field">
            <span>Từ ngày</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Đến ngày</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <button className="btn-primary" onClick={handleRefresh} disabled={loading}>
            {loading ? "Đang tải..." : "Xem"}
          </button>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && !loading && !statistics && (
        <div className="card table-empty">Chưa có dữ liệu điểm danh.</div>
      )}

      {!error && statistics && (
        <>
          <div className="users-stats">
            <div className="stat-card stat-blue">
              <div className="stat-label">Tổng số ngày</div>
              <div className="stat-value">{total}</div>
            </div>
            <div className="stat-card stat-sky">
              <div className="stat-label">Có mặt</div>
              <div className="stat-value" style={{ color: "#10b981" }}>{stats.coMat}</div>
            </div>
            <div className="stat-card stat-ice">
              <div className="stat-label">Vắng có phép</div>
              <div className="stat-value" style={{ color: "#f59e0b" }}>{stats.vangCoPhep}</div>
            </div>
            <div className="stat-card stat-navy">
              <div className="stat-label">Vắng không phép</div>
              <div className="stat-value" style={{ color: "#ef4444" }}>{stats.vangKhongPhep}</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <div className="panel-title" style={{ marginBottom: 16 }}>Tỷ lệ vắng</div>
            <div style={{ background: "#e5e7eb", borderRadius: 8, height: 32, overflow: "hidden" }}>
              <div
                style={{
                  background: "#ef4444",
                  height: "100%",
                  width: `${absentRate}%`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  minWidth: 60
                }}
              >
                {absentRate}%
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
              {stats.vangCoPhep + stats.vangKhongPhep} ngày vắng / {total} ngày · Tỷ lệ đi học: {attendanceRate}%
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 24, fontSize: 13 }}>
              <span style={{ color: "#f59e0b" }}>Vắng có phép: <strong>{stats.vangCoPhep} ngày ({excusedRate}%)</strong></span>
              <span style={{ color: "#ef4444" }}>Vắng không phép: <strong>{stats.vangKhongPhep} ngày ({unexcusedRate}%)</strong></span>
            </div>
          </div>

          {statistics.details && statistics.details.length > 0 && (
            <div className="card users-table">
              <div className="table-header">
                <div>
                  <div className="panel-title">Chi tiết điểm danh</div>
                  <div className="panel-subtitle">Lịch sử điểm danh gần đây</div>
                </div>
              </div>
              <div className="table-grid">
                <div className="table-row table-head">
                  <div>Ngày</div>
                  <div>Trạng thái</div>
                  <div>Ghi chú</div>
                </div>
                {statistics.details.map((item, idx) => {
                  const status = STATUS_MAP[item.trangThai] || STATUS_MAP.CO_MAT;
                  return (
                    <div key={idx} className="table-row">
                      <div className="table-title">
                        {item.ngayDiemDanh ? new Date(item.ngayDiemDanh).toLocaleDateString("vi-VN") : "--"}
                      </div>
                      <div>
                        <span className={status.color} style={{ padding: "2px 8px", borderRadius: 4 }}>
                          {status.label}
                        </span>
                      </div>
                      <div>{item.ghiChu || "--"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
