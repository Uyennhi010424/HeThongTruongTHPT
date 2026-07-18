import { useEffect, useMemo, useState } from "react";
import { getCurrentGiaoVien } from "../../api/giaovienApi.js";
import { getPhanCongDay } from "../../api/phancongDayApi.js";
import { getDiemSummary } from "../../api/diemApi.js";
import { getLop } from "../../api/lopApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getNamHoc } from "../../api/namhocApi.js";

export default function TeacherReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [diemSummary, setDiemSummary] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [namHocList, setNamHocList] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [teacherRes, phanCongRes, lopRes, monHocRes, namHocRes] = await Promise.all([
          getCurrentGiaoVien(),
          getPhanCongDay(),
          getLop(),
          getMonHoc(),
          getNamHoc().catch(() => null)
        ]);

        if (!active) return;

        const gv = teacherRes?.data?.data;
        setTeacher(gv);
        setClasses(lopRes?.data?.data || []);
        setSubjects(monHocRes?.data?.data || []);

        const allNamHoc = namHocRes?.data?.data || [];
        const years = allNamHoc
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        setNamHocList(years);
        const activeYear = allNamHoc.find((y) => y.trangThai === "DANG_MO");
        const currentNamHoc = activeYear?.tenNamHoc || years[0] || "";
        setSelectedNamHoc((prev) => prev || currentNamHoc);

        // Lọc phân công của giáo viên hiện tại
        const allPhanCong = phanCongRes?.data?.data || [];
        const myAssignments = gv?.id
          ? allPhanCong.filter((pc) => {
              const pcTeacherId = pc?.giaoVienId ?? pc?.giaoVien?.id;
              return Number(pcTeacherId) === Number(gv.id);
            })
          : [];
        setAssignments(myAssignments);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu thống kê.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  // Load điểm theo năm học
  useEffect(() => {
    if (!selectedNamHoc) return;
    let active = true;
    const loadDiem = async () => {
      try {
        const res = await getDiemSummary({ namHoc: selectedNamHoc });
        if (!active) return;
        setDiemSummary(res?.data?.data || []);
      } catch { /* ignore */ }
    };
    loadDiem();
    return () => { active = false; };
  }, [selectedNamHoc]);

  // Thống kê theo lớp mà giáo viên được phân công
  const classStats = useMemo(() => {
    const myClassIds = new Set(
      assignments
        .filter((pc) => pc.namHoc === selectedNamHoc)
        .map((pc) => String(pc?.lopId ?? pc?.lop?.id))
        .filter(Boolean)
    );

    const mySubjectIds = new Set(
      assignments
        .filter((pc) => pc.namHoc === selectedNamHoc)
        .map((pc) => String(pc?.monHocId ?? pc?.monHoc?.id))
        .filter(Boolean)
    );

    const stats = [];
    myClassIds.forEach((classId) => {
      const lop = classes.find((c) => String(c.id) === classId);
      if (!lop) return;

      const classDiem = diemSummary.filter((d) => {
        const dClassId = String(d?.lopId ?? d?.lop?.id ?? "");
        return dClassId === classId;
      });

      const scores = classDiem
        .map((d) => Number(d.giaTriDiem))
        .filter((s) => !Number.isNaN(s) && s >= 0 && s <= 10);

      const avg = scores.length > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        : "--";

      const above8 = scores.filter((s) => s >= 8).length;
      const above65 = scores.filter((s) => s >= 6.5).length;
      const above5 = scores.filter((s) => s >= 5).length;
      const below5 = scores.filter((s) => s < 5).length;

      stats.push({
        classId,
        tenLop: lop.tenLop,
        khoi: lop.khoi,
        siSo: lop.siSo || 0,
        totalScores: scores.length,
        avg,
        above8,
        above65,
        above5,
        below5
      });
    });

    return stats.sort((a, b) => String(a.tenLop).localeCompare(String(b.tenLop), "vi", { numeric: true }));
  }, [assignments, classes, diemSummary, selectedNamHoc]);

  // Tổng hợp
  const overview = useMemo(() => {
    const totalScores = classStats.reduce((sum, c) => sum + c.totalScores, 0);
    const allAvgs = classStats.map((c) => Number(c.avg)).filter((a) => !Number.isNaN(a));
    const overallAvg = allAvgs.length > 0
      ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2)
      : "--";
    const totalAbove8 = classStats.reduce((sum, c) => sum + c.above8, 0);
    const totalBelow5 = classStats.reduce((sum, c) => sum + c.below5, 0);

    return { totalScores, overallAvg, totalAbove8, totalBelow5, classCount: classStats.length };
  }, [classStats]);

  return (
    <div className="page users-page teacher-page">

      <div className="card users-toolbar">
        <div>
          <div className="users-title">Thống kê kết quả học tập</div>
          <div className="users-subtitle">
            {teacher ? `GV: ${teacher.hoTen} · Bộ môn: ${teacher.boMon || "--"}` : ""}
          </div>
        </div>
        <div className="users-actions">
          <label className="form-field">
            <span>Năm học</span>
            <select value={selectedNamHoc} onChange={(e) => setSelectedNamHoc(e.target.value)}>
              {namHocList.length > 0 ? (
                namHocList.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value="">Đang tải...</option>
              )}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && (
        <div className="users-stats">
          <div className="stat-card stat-blue">
            <div className="stat-label">Số lớp phụ trách</div>
            <div className="stat-value">{loading ? "..." : overview.classCount}</div>
          </div>
          <div className="stat-card stat-sky">
            <div className="stat-label">Tổng bài điểm</div>
            <div className="stat-value">{loading ? "..." : overview.totalScores}</div>
          </div>
          <div className="stat-card stat-ice">
            <div className="stat-label">Điểm TB chung</div>
            <div className="stat-value">{loading ? "..." : overview.overallAvg}</div>
          </div>
          <div className="stat-card stat-navy">
            <div className="stat-label">Tốt (≥8.0)</div>
            <div className="stat-value" style={{ color: "#10b981" }}>{loading ? "..." : overview.totalAbove8}</div>
          </div>
        </div>
      )}

      {!error && !loading && classStats.length === 0 && (
        <div className="card table-empty">Chưa có dữ liệu phân công hoặc điểm cho năm học này.</div>
      )}

      {!error && classStats.length > 0 && (
        <div className="card users-table">
          <div className="table-header">
            <div>
              <div className="panel-title">Thống kê theo lớp</div>
              <div className="panel-subtitle">Kết quả học tập các lớp phụ trách</div>
            </div>
            <div className="panel-pill">{classStats.length} lớp</div>
          </div>
          <div className="table-grid">
            <div className="table-row table-head">
              <div>Lớp</div>
              <div>Khối</div>
              <div>Sĩ số</div>
              <div>Tổng điểm</div>
              <div>TB lớp</div>
              <div>Tốt (≥8.0)</div>
              <div>Khá (≥6.5)</div>
              <div>Đạt (≥5.0)</div>
              <div>Chưa đạt (&lt;5.0)</div>
            </div>
            {classStats.map((item) => (
              <div className="table-row" key={item.classId}>
                <div className="table-title">{item.tenLop}</div>
                <div>{item.khoi}</div>
                <div>{item.siSo}</div>
                <div>{item.totalScores}</div>
                <div>
                  <span className="status-pill status-active">{item.avg}</span>
                </div>
                <div style={{ color: "#10b981" }}>{item.above8}</div>
                <div style={{ color: "#3b82f6" }}>{item.above65}</div>
                <div style={{ color: "#f59e0b" }}>{item.above5}</div>
                <div style={{ color: "#ef4444" }}>{item.below5}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
