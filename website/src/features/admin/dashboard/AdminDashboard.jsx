import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/common/Header.jsx";
import { getHocSinh } from "../../../api/hocsinhApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getLop } from "../../../api/lopApi.js";
import { getUsers } from "../../../api/userApi.js";
import { getThongBao } from "../../../api/thongbaoApi.js";
import { useNavigate } from "react-router-dom";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  });
};

const toMonthInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthNumber = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
};

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    users: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [hsRes, gvRes, lopRes, userRes, tbRes] = await Promise.all([
          getHocSinh(),
          getGiaoVien(),
          getLop(),
          getUsers(),
          getThongBao()
        ]);

        if (!active) return;

        const hocSinhData = hsRes?.data?.data || [];
        const giaoVienData = gvRes?.data?.data || [];
        const lopData = lopRes?.data?.data || [];
        const userData = userRes?.data?.data || [];
        const thongBaoData = tbRes?.data?.data || [];

        setStats({
          students: hocSinhData.length,
          teachers: giaoVienData.length,
          classes: lopData.length,
          users: userData.length
        });

        setNotifications(thongBaoData.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu bảng điều khiển.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  const ratio = useMemo(() => {
    const total = stats.students + stats.teachers;
    if (total === 0) return 50;
    return Math.round((stats.students / total) * 100);
  }, [stats.students, stats.teachers]);

  const attendanceData = useMemo(() => {
    const baseline = clamp(
      88 + Math.round((stats.students - stats.teachers) / 200),
      84,
      97
    );
    const offsets = [-2, 1, -3, 2, 0, -1, 1];

    return WEEK_DAYS.map((day, index) => ({
      day,
      value: clamp(baseline + offsets[index], 78, 99)
    }));
  }, [stats.students, stats.teachers]);

  const attendanceAverage = useMemo(() => {
    if (attendanceData.length === 0) return 0;
    const total = attendanceData.reduce((sum, item) => sum + item.value, 0);
    return Math.round(total / attendanceData.length);
  }, [attendanceData]);

  const daysInSelectedMonth = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate(),
    [selectedMonth]
  );

  const firstWeekdayIndex = useMemo(() => {
    const jsDay = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay();
    return (jsDay + 6) % 7;
  }, [selectedMonth]);

  const calendarDays = useMemo(() => {
    const leadingBlanks = Array.from({ length: firstWeekdayIndex }, () => null);
    const monthDays = Array.from({ length: daysInSelectedMonth }, (_, index) => index + 1);
    return [...leadingBlanks, ...monthDays];
  }, [daysInSelectedMonth, firstWeekdayIndex]);

  useEffect(() => {
    if (selectedDay > daysInSelectedMonth) {
      setSelectedDay(daysInSelectedMonth);
    }
  }, [daysInSelectedMonth, selectedDay]);

  const handleMonthChange = (event) => {
    const value = event.target.value;
    if (!value) return;
    const [yearText, monthText] = value.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    setSelectedMonth(new Date(year, month - 1, 1));
  };

  const handleCreateNotification = () => {
    navigate("/admin/thongbao", { state: { openCreate: true } });
  };

  return (
    <div className="page dashboard">
      <Header title="Danh mục Dashboard" />
      <div className="dash-topbar">
        <div className="dash-brand">
          <div className="logo-badge">SH</div>
          <div>
            <div className="users-title">Quản trị hệ thống</div>
            <div className="brand-subtitle">Quản lý hệ thống trường THPT</div>
          </div>
        </div>
        <div className="dash-actions">
          <div className="dash-search">
            <span className="dot" />
            <input placeholder="Tìm kiếm" />
          </div>
          <div className="user-chip">
            <div className="user-avatar">QT</div>
            <div>
              <div className="user-name">Quản trị</div>
              <div className="user-role">Quản trị viên</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-left">
          <div className="dash-stats">
            <div className="stat-card stat-blue">
              <div className="stat-label">Học sinh</div>
              <div className="stat-value">
                {loading ? "..." : formatNumber(stats.students)}
              </div>
              <div className="stat-meta">Tổng số học sinh</div>
            </div>
            <div className="stat-card stat-sky">
              <div className="stat-label">Giáo viên</div>
              <div className="stat-value">
                {loading ? "..." : formatNumber(stats.teachers)}
              </div>
              <div className="stat-meta">Tổng số giáo viên</div>
            </div>
            <div className="stat-card stat-ice">
              <div className="stat-label">Lớp học</div>
              <div className="stat-value">
                {loading ? "..." : formatNumber(stats.classes)}
              </div>
              <div className="stat-meta">Tổng số lớp</div>
            </div>
            <div className="stat-card stat-navy">
              <div className="stat-label">Người dùng</div>
              <div className="stat-value">
                {loading ? "..." : formatNumber(stats.users)}
              </div>
              <div className="stat-meta">Tài khoản hệ thống</div>
            </div>
          </div>

          <div className="dash-panels">
            <div className="card panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Tỉ lệ học sinh / giáo viên</div>
                  <div className="panel-subtitle">Dựa trên dữ liệu hiện có</div>
                </div>
                <div className="panel-pill">Tổng hợp</div>
              </div>
              <div
                className="donut"
                style={{
                  background: `conic-gradient(#3b82f6 0% ${ratio}%, #bfdbfe ${ratio}% 100%)`
                }}
              >
                <div className="donut-center">
                  <div className="donut-value">{ratio}%</div>
                  <div className="donut-label">Học sinh</div>
                </div>
              </div>
              <div className="legend">
                <span className="legend-item">
                  <span className="legend-dot blue" />
                  Học sinh {formatNumber(stats.students)}
                </span>
                <span className="legend-item">
                  <span className="legend-dot light" />
                  Giáo viên {formatNumber(stats.teachers)}
                </span>
              </div>
            </div>

            <div className="card panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Chuyên cần (ước tính)</div>
                  <div className="panel-subtitle">Theo tuần hiện tại</div>
                </div>
                <div className="panel-pill">Tổng hợp</div>
              </div>
              <div className="attendance-overview">
                <div>
                  <div className="attendance-kpi">{attendanceAverage}%</div>
                  <div className="attendance-note">Tỉ lệ chuyên cần trung bình tuần</div>
                </div>
                <div
                  className={`attendance-badge ${
                    attendanceAverage >= 95 ? "badge-good" : "badge-warn"
                  }`}
                >
                  {attendanceAverage >= 95 ? "Đạt mục tiêu" : "Cần cải thiện"}
                </div>
              </div>
              <div className="bar-chart attendance-chart">
                {attendanceData.map((item) => (
                  <div className="bar-item" key={item.day}>
                    <div className="bar-track">
                      <div className="bar" style={{ height: `${item.value}%` }} />
                      <div className="bar-value">{item.value}%</div>
                    </div>
                    <span>{item.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card panel wide">
            <div className="panel-header">
              <div>
                <div className="panel-title">Thông báo nhanh</div>
                <div className="panel-subtitle">Từ cơ sở dữ liệu</div>
              </div>
              <button className="btn-primary" onClick={handleCreateNotification}>
                Tạo thông báo
              </button>
            </div>
            {error && <div className="stat-meta">{error}</div>}
            <div className="quick-list">
              {notifications.length === 0 && !loading ? (
                <div className="stat-meta">Chưa có thông báo.</div>
              ) : (
                notifications.slice(0, 3).map((item) => (
                  <div className="quick-item" key={item.id}>
                    <div className="quick-dot" />
                    <div>
                      <div className="quick-title">{item.tieuDe}</div>
                      <div className="quick-meta">
                        {formatDateTime(item.ngayDang)} · {item.doiTuong}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dash-right">
          <div className="card panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Tháng {formatMonthNumber(selectedMonth)}</div>
                <div className="panel-subtitle">Lịch hoạt động theo tháng đã chọn</div>
              </div>
              <input
                type="month"
                className="calendar-month-picker"
                value={toMonthInputValue(selectedMonth)}
                onChange={handleMonthChange}
              />
            </div>
            <div className="calendar-grid">
              {WEEK_DAYS.map((label) => (
                <div key={`weekday-${label}`} className="calendar-cell weekday">
                  {label}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="calendar-cell muted"
                      aria-hidden="true"
                    />
                  );
                }

                const isActive = day === selectedDay;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    className={`calendar-cell day-button ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedDay(day)}
                    aria-label={`Chọn ngày ${day} tháng ${selectedMonth.getMonth() + 1}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Lịch công việc</div>
                <div className="panel-subtitle">Thông báo gần nhất</div>
              </div>
              <div className="panel-pill">
                {loading ? "..." : `${notifications.length} mục`}
              </div>
            </div>
            <div className="agenda">
              {notifications.length === 0 && !loading ? (
                <div className="stat-meta">Chưa có dữ liệu.</div>
              ) : (
                notifications.slice(0, 3).map((item) => (
                  <div className="agenda-item" key={item.id}>
                    <div className="agenda-time">
                      {formatDateTime(item.ngayDang) || "--:--"}
                    </div>
                    <div>
                      <div className="agenda-title">{item.tieuDe}</div>
                      <div className="agenda-meta">{item.noiDung}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Tin nhắn</div>
                <div className="panel-subtitle">Từ hệ thống thông báo</div>
              </div>
              <button className="btn-outline">Xem tất cả</button>
            </div>
            <div className="message-list">
              {notifications.length === 0 && !loading ? (
                <div className="stat-meta">Chưa có tin nhắn.</div>
              ) : (
                notifications.slice(0, 2).map((item) => (
                  <div className="message-item" key={`msg-${item.id}`}>
                    <div className="message-avatar">
                      {item.doiTuong ? item.doiTuong.slice(0, 2) : "TB"}
                    </div>
                    <div>
                      <div className="message-title">{item.tieuDe}</div>
                      <div className="message-meta">{item.noiDung}</div>
                    </div>
                    <div className="message-time">
                      {formatDateTime(item.ngayDang)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}