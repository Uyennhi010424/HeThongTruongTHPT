import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getThongBao } from "../../../api/thongbaoApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getMonHoc } from "../../../api/monhocApi.js";
import { getThoiKhoaBieu } from "../../../api/thoikhoabieuApi.js";

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

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    notices: [],
    classes: [],
    subjects: [],
    timetable: []
  });

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [noticesRes, classesRes, subjectsRes, timetableRes] = await Promise.all([
          getThongBao(),
          getLop(),
          getMonHoc(),
          getThoiKhoaBieu()
        ]);
        if (!active) return;
        setData({
          notices: noticesRes?.data?.data || [],
          classes: classesRes?.data?.data || [],
          subjects: subjectsRes?.data?.data || [],
          timetable: timetableRes?.data?.data || []
        });
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      active = false;
    };
  }, []);

  const latestNotices = useMemo(() => {
    return [...data.notices]
      .filter((item) => item.doiTuong === "GIAO_VIEN" || item.doiTuong === "ALL")
      .sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang))
      .slice(0, 3);
  }, [data.notices]);

  const timetablePreview = useMemo(() => {
    return [...data.timetable]
      .sort((a, b) => (a.thu || 0) - (b.thu || 0) || (a.tietBatDau || 0) - (b.tietBatDau || 0))
      .slice(0, 5);
  }, [data.timetable]);

  const stats = useMemo(() => {
    return {
      classes: data.classes.length,
      subjects: data.subjects.length,
      timetable: data.timetable.length,
      notices: data.notices.length
    };
  }, [data]);

  return (
    <div className="page users-page">
      <Header title="Dashboard giáo viên" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Lớp đang dạy</div>
          <div className="stat-value">{loading ? "..." : stats.classes}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Môn phụ trách</div>
          <div className="stat-value">{loading ? "..." : stats.subjects}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Tiết trong tuần</div>
          <div className="stat-value">{loading ? "..." : stats.timetable}</div>
        </div>
      </div>

      {error && <div className="card table-empty">{error}</div>}

      {!error && (
        <div className="grid-2">
          <div className="card users-table">
            <div className="table-header">
              <div>
                <div className="panel-title">Lịch dạy sắp tới</div>
                <div className="panel-subtitle">Một vài tiết gần nhất</div>
              </div>
              <div className="panel-pill">{data.timetable.length} tiết</div>
            </div>
            {timetablePreview.length === 0 && !loading ? (
              <div className="table-empty">Chưa có lịch dạy.</div>
            ) : (
              <div className="table-grid">
                <div className="table-row table-head">
                  <div>Thứ</div>
                  <div>Tiết</div>
                  <div>Số tiết</div>
                  <div>Ghi chú</div>
                </div>
                {timetablePreview.map((item) => (
                  <div className="table-row" key={item.id}>
                    <div className="table-title">{getDayLabel(item.thu)}</div>
                    <div className="table-title">{item.tietBatDau ?? "--"}</div>
                    <div className="table-title">{item.soTiet ?? "--"}</div>
                    <div className="table-meta">{item.ghiChu || "--"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="panel-title">Thông báo từ Ban giám hiệu</div>
            <div className="panel-subtitle">Cập nhật gần nhất</div>
            {latestNotices.length === 0 && !loading ? (
              <div className="table-empty">Chưa có thông báo.</div>
            ) : (
              latestNotices.map((item) => (
                <div className="notice-item" key={item.id}>
                  <div>
                    <div className="table-title">{item.tieuDe}</div>
                    <div className="table-meta">{item.noiDung}</div>
                  </div>
                  <div className="table-date">{formatDate(item.ngayDang) || "--"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}