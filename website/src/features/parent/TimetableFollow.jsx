import { useEffect, useMemo, useState } from "react";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { formatDate, getDayLabel } from "../../utils/helpers.js";
import { getLichThi, getLichThiByLop } from "../../api/lichthiApi.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";

export default function TimetableFollow() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading, error: studentsError } = useParentStudents();
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);

  const getDefaultTuan = (ngayBatDauHk1) => {
    if (!ngayBatDauHk1) return 1;
    const schoolStart = new Date(ngayBatDauHk1 + "T00:00:00");
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const now = new Date();
    const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 1;
    return Math.max(1, Math.floor(diffDays / 7) + 1);
  };

  useEffect(() => {
    if (!currentStudent) return;
    let active = true;

    const fetchData = async () => {
      try {
        setDataLoading(true);
        setDataError("");

        const lopId = currentStudent?.lop?.id;

        let ngayBatDauHk1 = null;
        try {
          const namHocRes = await getNamHoc();
          const years = namHocRes?.data?.data || [];
          const currentYear = years.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO") || years[years.length - 1];
          ngayBatDauHk1 = currentYear?.ngayBatDauHk1 || null;
        } catch { /* ignore */ }

        setSelectedTuan(getDefaultTuan(ngayBatDauHk1));

        const [tkbRes, examRes] = await Promise.all([
          lopId ? getThoiKhoaBieu({ lopId }) : getThoiKhoaBieu(),
          lopId ? getLichThiByLop(lopId) : getLichThi()
        ]);
        if (!active) return;
        setTimetable(tkbRes?.data?.data || []);
        setExams(examRes?.data?.data || []);
      } catch {
        if (!active) return;
        setDataError("Không thể tải lịch học hoặc lịch thi.");
      } finally {
        if (active) setDataLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [currentStudent?.id]);

  const loading = studentsLoading || dataLoading;
  const error = studentsError || dataError;

  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => Number(item?.tuan) === selectedTuan);
  }, [timetable, selectedTuan]);

  const stats = useMemo(() => {
    const totalLessons = filteredTimetable.length;
    const totalExams = exams.length;
    return { totalLessons, totalExams };
  }, [filteredTimetable, exams]);

  return (
    <div className="page users-page student-page">
      <section className="student-hero card">
        <div className="student-hero-copy">
          <div className="student-hero-kicker">EduManager Pro</div>
          <h2 className="student-hero-title">Thời khóa biểu</h2>
          <p className="student-hero-subtitle">Xem lịch học và lịch thi của con em.</p>
        </div>
        <div className="student-hero-metrics">
          <div className="student-hero-chip">{loading ? "..." : stats.totalLessons} tiết học</div>
          <div className="student-hero-chip">{loading ? "..." : stats.totalExams} lịch thi</div>
        </div>
      </section>

      <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />

      <div className="users-stats student-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Lịch học</div>
          <div className="stat-value">{loading ? "..." : stats.totalLessons}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Lịch thi</div>
          <div className="stat-value">{loading ? "..." : stats.totalExams}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Thời khóa biểu</div>
            <div className="panel-subtitle">Lịch học theo tuần</div>
          </div>
          <div className="panel-pill">Tuần {selectedTuan} · {filteredTimetable.length} tiết</div>
        </div>
        <div className="timetable-week-toolbar">
          <button className="btn-outline btn-sm" type="button" onClick={() => setSelectedTuan((prev) => Math.max(1, prev - 1))}>
            Tuần trước
          </button>
          <button className="btn-outline btn-sm" type="button" onClick={() => setSelectedTuan((prev) => prev + 1)}>
            Tuần sau
          </button>
        </div>
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Thứ</div>
            <div>Tiết bắt đầu</div>
            <div>Số tiết</div>
            <div>Ghi chú</div>
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : filteredTimetable.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{index + 1}</div>
                  <div className="table-title">{getDayLabel(item.thu)}</div>
                  <div className="table-title">{item.tietBatDau ?? "--"}</div>
                  <div className="table-title">{item.soTiet ?? "--"}</div>
                  <div className="table-meta">{item.ghiChu || ""}</div>
                </div>
              ))}
        </div>
      </div>

      <div className="card users-table student-card">
        <div className="table-header">
          <div>
            <div className="panel-title">Lịch thi</div>
            <div className="panel-subtitle">Theo dõi các kỳ thi sắp tới</div>
          </div>
          <div className="panel-pill">{exams.length} lịch thi</div>
        </div>
        {!error && !loading && exams.length === 0 && (
          <div className="table-empty">Chưa có lịch thi.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Ngày thi</div>
            <div>Giờ bắt đầu</div>
            <div>Thời gian (phút)</div>
            <div>Phòng thi</div>
          </div>
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : exams.map((item, index) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">{index + 1}</div>
                  <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                  <div className="table-title">{item.gioBatDau || "--"}</div>
                  <div className="table-title">{item.thoiGianLamBai ?? "--"}</div>
                  <div className="table-title">{item.phongThi || "--"}</div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
