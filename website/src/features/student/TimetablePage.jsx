import { Fragment, useEffect, useMemo, useState } from "react";
import Header from "../../components/common/Header.jsx";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";

const WEEK_DAYS = [2, 3, 4, 5, 6, 7, 8];
const MORNING_PERIODS = [1, 2, 3, 4, 5];
const AFTERNOON_PERIODS = [6, 7, 8, 9, 10];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateShort = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "--/--";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit"
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

export default function TimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getThoiKhoaBieu();
        if (!active) return;
        setTimetable(response?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setError("Không thể tải thời khóa biểu.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTimetable();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = timetable.length;
    const uniqueDays = new Set(timetable.map((item) => item.thu)).size;
    return { total, uniqueDays };
  }, [timetable]);

  const scheduleDays = useMemo(() => {
    const daySet = new Set(
      timetable
        .map((item) => Number(item?.thu))
        .filter((day) => Number.isFinite(day) && day >= 2 && day <= 8)
    );

    const visibleDays = WEEK_DAYS.filter((day) => day !== 8 || daySet.has(8));
    return visibleDays.length > 0 ? visibleDays : WEEK_DAYS.slice(0, 6);
  }, [timetable]);

  const scheduleMap = useMemo(() => {
    const map = new Map();

    timetable.forEach((item) => {
      const day = Number(item?.thu);
      const start = Number(item?.tietBatDau || 1);
      const count = Math.max(1, Number(item?.soTiet || 1));

      if (!Number.isFinite(day) || !Number.isFinite(start)) return;

      for (let period = start; period < start + count; period += 1) {
        const key = `${day}-${period}`;
        const entries = map.get(key) || [];
        entries.push(item);
        map.set(key, entries);
      }
    });

    return map;
  }, [timetable]);

  const getCellEntries = (day, period) => scheduleMap.get(`${day}-${period}`) || [];

  const selectedWeekStart = useMemo(() => {
    const currentWeekStart = startOfWeekMonday(new Date());
    return addDays(currentWeekStart, weekOffset * 7);
  }, [weekOffset]);

  const getDateByDay = (day) => {
    const offset = day === 8 ? 6 : day - 2;
    return addDays(selectedWeekStart, offset);
  };

  const weekRangeLabel = useMemo(() => {
    if (scheduleDays.length === 0) return "";
    const firstDate = getDateByDay(scheduleDays[0]);
    const lastDate = getDateByDay(scheduleDays[scheduleDays.length - 1]);
    return `${formatDateShort(firstDate)} - ${formatDateShort(lastDate)}`;
  }, [scheduleDays, selectedWeekStart]);

  const renderPeriodGrid = (sessionTitle, periods, sessionClassName) => (
    <div className="timetable-session" key={sessionTitle}>
      <div className="timetable-session-title-wrap">
        <div className="timetable-session-title">{sessionTitle}</div>
        <div className="timetable-session-subtitle">Mỗi buổi gồm 5 tiết</div>
      </div>

      <div className="student-timetable-wrap">
        <div
          className={`student-timetable-grid ${sessionClassName}`}
          style={{ gridTemplateColumns: `90px repeat(${scheduleDays.length}, minmax(170px, 1fr))` }}
        >
          <div className="timetable-cell timetable-head-cell sticky-col">Tiết</div>
          {scheduleDays.map((day) => (
            <div className="timetable-cell timetable-head-cell" key={`${sessionTitle}-head-${day}`}>
              <div>{getDayLabel(day)}</div>
              <div className="timetable-head-date">{formatDateShort(getDateByDay(day))}</div>
            </div>
          ))}

          {loading
            ? periods.map((period) => (
                <Fragment key={`${sessionTitle}-loading-${period}`}>
                  <div className="timetable-cell timetable-period-cell sticky-col">Tiết {period}</div>
                  {scheduleDays.map((day) => (
                    <div
                      className="timetable-cell timetable-body-cell"
                      key={`${sessionTitle}-skeleton-${day}-${period}`}
                    >
                      <div className="skeleton" />
                    </div>
                  ))}
                </Fragment>
              ))
            : periods.map((period) => (
                <Fragment key={`${sessionTitle}-period-${period}`}>
                  <div className="timetable-cell timetable-period-cell sticky-col">Tiết {period}</div>
                  {scheduleDays.map((day) => {
                    const entries = getCellEntries(day, period);
                    return (
                      <div className="timetable-cell timetable-body-cell" key={`${sessionTitle}-cell-${day}-${period}`}>
                        {entries.length === 0 ? (
                          <div className="timetable-empty">--</div>
                        ) : (
                          <div className="lesson-stack">
                            {entries.map((item, idx) => (
                              <div className="lesson-card" key={`${item.id || "item"}-${idx}-${sessionTitle}-${period}`}>
                                <div className="lesson-title">{item.ghiChu || `Tiết ${item.tietBatDau}`}</div>
                                <div className="lesson-meta">
                                  Bắt đầu: {item.tietBatDau ?? "--"} · Số tiết: {item.soTiet ?? "--"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page users-page">
      <Header title="Thời khóa biểu" />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Số tiết</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Số ngày học</div>
          <div className="stat-value">{loading ? "..." : stats.uniqueDays}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Thời khóa biểu tuần</div>
            <div className="panel-subtitle">Theo từng tiết học, từng buổi và từng ngày</div>
          </div>
          <div className="panel-pill">Tuần {weekRangeLabel}</div>
        </div>

        <div className="timetable-week-toolbar">
          <button className="btn-outline btn-sm" type="button" onClick={() => setWeekOffset((prev) => prev - 1)}>
            Tuần trước
          </button>
          <button className="btn-outline btn-sm" type="button" onClick={() => setWeekOffset((prev) => prev + 1)}>
            Tuần sau
          </button>
          <div className="timetable-week-label">Khoảng ngày: {weekRangeLabel}</div>
        </div>

        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && timetable.length === 0 && (
          <div className="table-empty">Chưa có thời khóa biểu.</div>
        )}
        {renderPeriodGrid("Buổi sáng", MORNING_PERIODS, "session-morning")}
        {renderPeriodGrid("Buổi chiều", AFTERNOON_PERIODS, "session-afternoon")}
      </div>
    </div>
  );
}