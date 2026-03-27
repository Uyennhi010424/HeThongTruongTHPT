import { useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import { getLichThi } from "../../api/lichthiApi.js";

const getDayLabel = (value) => {
  switch (value) {
    case 2:
      return "Thứ 2";
    case 3:
      return "Thứ 3";
    case 4:
      return "Thứ 4";
    case 5:
      return "Thứ 5";
    case 6:
      return "Thứ 6";
    case 7:
      return "Thứ 7";
    case 8:
      return "Chủ nhật";
    default:
      return "--";
  }
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export default function TimetableFollow() {
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [tkbRes, examRes] = await Promise.all([
          getThoiKhoaBieu(),
          getLichThi()
        ]);
        if (!active) return;
        setTimetable(tkbRes?.data?.data || []);
        setExams(examRes?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải lịch học hoặc lịch thi.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalLessons = timetable.length;
    const totalExams = exams.length;
    return { totalLessons, totalExams };
  }, [timetable, exams]);

  return (
    <div className="page users-page">
      <Header title="Theo dõi thời khóa biểu" />

      <div className="users-stats">
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

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Thời khóa biểu</div>
            <div className="panel-subtitle">Lịch học theo tuần</div>
          </div>
          <div className="panel-pill">{timetable.length} tiết</div>
        </div>
        {!error && !loading && timetable.length === 0 && (
          <div className="table-empty">Chưa có thời khóa biểu.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>ID</div>
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
            : timetable.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">#{item.id}</div>
                  <div className="table-title">{getDayLabel(item.thu)}</div>
                  <div className="table-title">{item.tietBatDau ?? "--"}</div>
                  <div className="table-title">{item.soTiet ?? "--"}</div>
                  <div className="table-meta">{item.ghiChu || ""}</div>
                </div>
              ))}
        </div>
      </div>

      <div className="card users-table">
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
            <div>ID</div>
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
            : exams.map((item) => (
                <div className="table-row" key={item.id}>
                  <div className="table-id">#{item.id}</div>
                  <div className="table-title">{formatDate(item.ngayThi) || "--"}</div>
                  <div className="table-title">{item.gioBatDau || "--"}</div>
                  <div className="table-title">{item.thoiGianThi ?? "--"}</div>
                  <div className="table-title">{item.phongThi || "--"}</div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}