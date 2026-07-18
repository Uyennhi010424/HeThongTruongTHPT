import { useEffect, useMemo, useState } from "react";
import { getThongBao } from "../../api/thongbaoApi.js";
import { getLichThiByLop } from "../../api/lichthiApi.js";
import { getMonHoc } from "../../api/monhocApi.js";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";
import { getStudentStatistics } from "../../api/diemdanhApi.js";
import { formatDate } from "../../utils/helpers.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

const HANH_KIEM_LABELS = {
  TOT: "Tốt",
  KHA: "Khá",
  TRUNG_BINH: "Trung bình",
  YEU: "Yếu",
};

export default function HomePage() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading, error: studentsError } = useParentStudents();
  const [data, setData] = useState({
    notices: [],
    exams: [],
    subjects: [],
    scores: [],
    conducts: [],
    attendanceStats: null,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!currentStudent) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const lopId = currentStudent?.lop?.id;
        const hocSinhId = currentStudent?.id;

        const fetchPromises = [];

        // Notices + Subjects
        fetchPromises.push(
          getThongBao().then(r => ({ notices: r?.data?.data || [] })).catch(() => ({ notices: [] })),
          getMonHoc().then(r => ({ subjects: r?.data?.data || [] })).catch(() => ({ subjects: [] }))
        );

        // Exams
        fetchPromises.push(
          (lopId ? getLichThiByLop(lopId) : Promise.resolve({ data: { data: [] } }))
            .then(r => ({ exams: r?.data?.data || [] }))
            .catch(() => ({ exams: [] }))
        );

        // Scores
        if (hocSinhId) {
          fetchPromises.push(
            getDiem({ hocSinhId })
              .then(r => ({ scores: r?.data?.data || [] }))
              .catch(() => ({ scores: [] }))
          );

          // Conduct
          fetchPromises.push(
            getHanhKiem({ hocSinhId })
              .then(r => ({ conducts: r?.data?.data || [] }))
              .catch(() => ({ conducts: [] }))
          );

          // Attendance stats
          const now = new Date();
          const yearStart = now.getMonth() >= 8
            ? `${now.getFullYear()}-09-01`
            : `${now.getFullYear() - 1}-09-01`;
          const today = now.toISOString().split("T")[0];
          fetchPromises.push(
            getStudentStatistics(hocSinhId, yearStart, today)
              .then(r => ({ attendanceStats: r?.data?.data || null }))
              .catch(() => ({ attendanceStats: null }))
          );
        }

        const results = await Promise.all(fetchPromises);
        if (!active) return;

        const merged = {
          notices: results[0]?.notices || [],
          subjects: results[1]?.subjects || [],
          exams: results[2]?.exams || [],
          scores: results[3]?.scores || [],
          conducts: results[4]?.conducts || [],
          attendanceStats: results[5]?.attendanceStats || null,
        };
        setData(merged);
      } catch {
        if (!active) return;
        setDataError("Không thể tải dữ liệu.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currentStudent?.id]);

  const loading = studentsLoading || dataLoading;
  const error = studentsError || dataError;

  /* -- Helpers -------------------------------------------------------- */
  const subjectMap = useMemo(() => {
    const map = {};
    for (const s of data.subjects) {
      map[s.id] = s.tenMon || s.tenMonHoc || `Môn ${s.id}`;
    }
    return map;
  }, [data.subjects]);

  const getSubjectName = (monHocId) => subjectMap[monHocId] || `Môn ${monHocId}`;

  /* -- Computed stats ------------------------------------------------- */
  const dtb = useMemo(() => {
    if (!data.scores || data.scores.length === 0) return null;
    const validScores = data.scores.filter((s) => s.giaTriDiem != null);
    if (validScores.length === 0) return null;

    let weightSum = 0;
    let weightTotal = 0;
    for (const s of validScores) {
      const loai = s.loaiDiem || "";
      const w = loai === "CK" ? 3 : loai === "GK" ? 2 : 1;
      weightSum += Number(s.giaTriDiem) * w;
      weightTotal += w;
    }
    if (weightTotal === 0) return null;
    return Math.round((weightSum / weightTotal) * 100) / 100;
  }, [data.scores]);

  const totalAbsent = useMemo(() => {
    if (!data.attendanceStats) return 0;
    const cp = Number(data.attendanceStats.coPhep || 0);
    const kp = Number(data.attendanceStats.khongPhep || 0);
    return cp + kp;
  }, [data.attendanceStats]);

  const hanhKiemLabel = useMemo(() => {
    if (!data.conducts || data.conducts.length === 0) return "--";
    // Lọc theo năm học hiện tại (tháng >= 9: năm này-năm sau; tháng < 9: năm trước-năm này)
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth() + 1;
    const curNamHoc = mo >= 9 ? `${yr}-${yr + 1}` : `${yr - 1}-${yr}`;
    const curHK = mo >= 9 || mo <= 1 ? 1 : 2;

    const filtered = data.conducts.filter((c) => {
      const matchNamHoc = c.namHoc === curNamHoc || c.tenNamHoc === curNamHoc;
      const matchHK = String(c.hocKy) === String(curHK);
      return matchNamHoc && matchHK;
    });
    const approved = filtered.find((c) => c.trangThai === "APPROVED");
    const record = approved || filtered[filtered.length - 1] || data.conducts[data.conducts.length - 1];
    const raw = record?.xepLoai || record?.hanhKiem || "";
    return HANH_KIEM_LABELS[raw] || raw || "--";
  }, [data.conducts]);

  const classifyColor = (avg) => {
    if (avg == null) return "#9ca3af";
    if (avg >= 8) return "#16a34a";
    if (avg >= 6.5) return "#2563eb";
    if (avg >= 5) return "#ca8a04";
    return "#dc2626";
  };

  const classifyLabel = (avg) => {
    if (avg == null) return "--";
    if (avg >= 8) return "Tốt";
    if (avg >= 6.5) return "Khá";
    if (avg >= 5) return "Đạt";
    return "Chưa đạt";
  };

  const latestNotices = useMemo(() => {
    return [...data.notices]
      .filter((item) => item.doiTuong === "PHU_HUYNH" || item.doiTuong === "ALL")
      .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang))
      .slice(0, 3);
  }, [data.notices]);

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return [...data.exams]
      .filter((item) => item.ngayThi && new Date(item.ngayThi) >= now)
      .sort((a, b) => new Date(a.ngayThi) - new Date(b.ngayThi))
      .slice(0, 3);
  }, [data.exams]);

  return (
    <div className="page users-page student-page">
      {/* Hero */}
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Trang chủ phụ huynh</h2>
          <p className="student-hero-subtitle">
            Theo dõi kết quả học tập, hạnh kiểm và thông tin từ nhà trường.
          </p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">
            {loading ? "..." : currentStudent?.hoTen || "Chưa chọn con"}
          </div>
          <div className="student-hero-chip">
            {loading ? "..." : currentStudent?.lop?.tenLop || "--"}
          </div>
        </div>
      </section>

      {/* Student selector */}
      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      {/* Stats cards */}
      <div className="users-stats student-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Điểm trung bình</div>
          <div className="stat-value" style={{ color: classifyColor(dtb) }}>
            {loading ? "..." : dtb != null ? dtb : "--"}
          </div>
          <div className="stat-label" style={{ fontSize: 12, marginTop: 2 }}>
            {loading ? "" : classifyLabel(dtb)}
          </div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Số ngày vắng</div>
          <div className="stat-value" style={{ color: totalAbsent > 5 ? "#dc2626" : "#16a34a" }}>
            {loading ? "..." : totalAbsent}
          </div>
          {data.attendanceStats && (
            <div className="stat-label" style={{ fontSize: 12, marginTop: 2 }}>
              Có phép: {data.attendanceStats.coPhep || 0} · Không phép: {data.attendanceStats.khongPhep || 0}
            </div>
          )}
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Hạnh kiểm</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {loading ? "..." : hanhKiemLabel}
          </div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && (
        <div className="grid-2 student-grid-2">
          {/* Student info */}
          <div className="card student-card">
            <div className="table-header">
              <div>
                <div className="panel-title">Thông tin học sinh</div>
                <div className="panel-subtitle">Theo dõi con em trong năm học</div>
              </div>
              <div className="panel-pill">Hồ sơ</div>
            </div>
            <div className="profile-summary student-profile-summary">
              <div>
                <div className="table-title">{currentStudent?.hoTen || "--"}</div>
                <div className="table-meta">Lớp: {currentStudent?.lop?.tenLop || "--"}</div>
              </div>
              <div>
                <div className="table-title">Năm nhập học</div>
                <div className="table-meta">{currentStudent?.namNhapHoc || "--"}</div>
              </div>
            </div>
          </div>

          {/* Latest notices */}
          <div className="card student-card">
            <div className="table-header">
              <div>
                <div className="panel-title">Thông báo nhà trường</div>
                <div className="panel-subtitle">Dành cho phụ huynh</div>
              </div>
              <div className="panel-pill">Tin mới</div>
            </div>
            {latestNotices.length === 0 && !loading ? (
              <div className="table-empty">Chưa có thông báo.</div>
            ) : (
              <div className="student-notice-list">
                {latestNotices.map((item) => (
                  <div className="notice-item" key={item.id}>
                    <div>
                      <div className="table-title">{item.tieuDe}</div>
                      <div className="table-meta">{item.noiDung}</div>
                    </div>
                    <div className="table-date">{formatDate(item.ngayDang) || "--"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!error && (
        <div className="grid-2 student-grid-2">
          {/* Upcoming exams */}
          <div className="card users-table student-card">
            <div className="table-header">
              <div>
                <div className="panel-title">Lịch thi sắp tới</div>
                <div className="panel-subtitle">Cập nhật theo tuần</div>
              </div>
              <div className="panel-pill">{upcomingExams.length} lịch thi</div>
            </div>
            {upcomingExams.length === 0 && !loading ? (
              <div className="table-empty">Chưa có lịch thi.</div>
            ) : (
              <div className="table-grid">
                <div className="table-row table-head">
                  <div>Ngày thi</div>
                  <div>Môn</div>
                  <div>Giờ</div>
                  <div>Phòng</div>
                </div>
                {upcomingExams.map((item) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                    <div className="table-title">{getSubjectName(item.monHocId)}</div>
                    <div className="table-title">{item.gioBatDau || "--"}</div>
                    <div className="table-meta">{item.phongThi || "--"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score summary */}
          <div className="card users-table student-card">
            <div className="table-header">
              <div>
                <div className="panel-title">Tổng quan điểm số</div>
                <div className="panel-subtitle">Điểm và hạnh kiểm gần đây</div>
              </div>
              <div className="panel-pill">{data.scores.length} điểm</div>
            </div>
            <div className="table-grid">
              <div className="table-row table-head">
                <div>Chỉ số</div>
                <div>Giá trị</div>
              </div>
              <div className="table-row">
                <div className="table-title">Điểm trung bình</div>
                <div className="table-title" style={{ color: classifyColor(dtb), fontWeight: 700 }}>
                  {loading ? "..." : dtb != null ? `${dtb} (${classifyLabel(dtb)})` : "--"}
                </div>
              </div>
              <div className="table-row">
                <div className="table-title">Số ngày vắng</div>
                <div className="table-title" style={{ color: totalAbsent > 5 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                  {loading ? "..." : totalAbsent}
                  {data.attendanceStats && (
                    <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                      (Có phép: {data.attendanceStats.coPhep || 0}, Không phép: {data.attendanceStats.khongPhep || 0})
                    </span>
                  )}
                </div>
              </div>
              <div className="table-row">
                <div className="table-title">Hạnh kiểm</div>
                <div className="table-title" style={{ fontWeight: 700 }}>
                  {loading ? "..." : hanhKiemLabel}
                </div>
              </div>
              <div className="table-row">
                <div className="table-title">Tổng bài điểm</div>
                <div className="table-title">{loading ? "..." : data.scores.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
