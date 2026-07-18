import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

const STATUS_MAP = {
  CO_MAT: { label: "Có mặt", color: "text-green-700 bg-green-50" },
  CO_PHEP: { label: "Vắng có phép", color: "text-yellow-700 bg-yellow-50" },
  KHONG_PHEP: { label: "Vắng không phép", color: "text-red-700 bg-red-50" },
};

export default function ParentDiemDanh() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [statistics, setStatistics] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Set default date range
  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setFromDate(from.toISOString().slice(0, 10));
    setToDate(now.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!currentStudent?.id || !fromDate || !toDate) return;
    let active = true;

    const fetchStats = async () => {
      try {
        setDataLoading(true);
        setError("");
        const statsRes = await getStudentStatistics(currentStudent.id, fromDate, toDate);
        if (!active) return;
        setStatistics(statsRes?.data?.data || null);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu điểm danh.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchStats();
    return () => { active = false; };
  }, [currentStudent?.id, fromDate, toDate]);

  const loading = studentsLoading || dataLoading;

  const stats = useMemo(() => {
    if (!statistics) return { total: 0, coMat: 0, vangCoPhep: 0, vangKhongPhep: 0, diTre: 0 };
    return {
      total: statistics.totalDays ?? statistics.total ?? 0,
      coMat: statistics.present ?? statistics.coMat ?? 0,
      vangCoPhep: statistics.excusedAbsent ?? statistics.vangCoPhep ?? 0,
      vangKhongPhep: statistics.unexcusedAbsent ?? statistics.vangKhongPhep ?? 0,
      diTre: statistics.late ?? statistics.diTre ?? 0
    };
  }, [statistics]);

  const attendanceRate = stats.total > 0 ? ((stats.coMat / stats.total) * 100).toFixed(1) : "--";

  return (
    <div className="page users-page student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Điểm danh con em</h2>
          <p className="student-hero-subtitle">Theo dõi tình hình đi học của con.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : attendanceRate}% đi học</div>
        </div>
      </section>

      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      <div className="card users-toolbar">
        <div className="users-actions">
          <label className="form-field">
            <span>Từ ngày</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="form-field">
            <span>Đến ngày</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
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
              <div className="stat-value">{stats.total}</div>
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
            <div className="panel-title" style={{ marginBottom: 16 }}>Tỷ lệ đi học</div>
            <div style={{ background: "#e5e7eb", borderRadius: 8, height: 32, overflow: "hidden" }}>
              <div
                style={{
                  background: "#10b981",
                  height: "100%",
                  width: `${attendanceRate}%`,
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
                {attendanceRate}%
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
              {stats.coMat}/{stats.total} ngày đi học trong khoảng thời gian đã chọn
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
