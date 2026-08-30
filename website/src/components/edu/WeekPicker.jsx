import { useState, useMemo, useRef, useEffect } from "react";
import { getWeekDates } from "../../utils/helpers.js";

/**
 * WeekPicker - chọn tuần theo calendar
 * Props:
 * - value: số tuần được chọn (1-18)
 * - onChange: callback khi chọn tuần
 * - namHoc: "2025-2026"
 * - hocKy: 1 hoặc 2
 * - availableWeeks: mảng số tuần có data [1, 2, 3, ...]
 * - allowedWeeks: mảng số tuần thuộc học kỳ đang chọn (nếu có)
 */
export default function WeekPicker({ value, onChange, namHoc, hocKy, availableWeeks = [], allowedWeeks, ngayBatDauHk1 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Tính ngày bắt đầu năm học
  const startYear = namHoc ? parseInt(namHoc.split("-")[0]) : new Date().getFullYear();

  const getWeekDatesLocal = (tuan) => {
    return getWeekDates(tuan, { ngayBatDauHk1, tenNamHoc: namHoc });
  };

  const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;

  // Tuần hiện tại
  const currentTuan = useMemo(() => {
    const now = new Date();
    const schoolStart = ngayBatDauHk1
      ? new Date(ngayBatDauHk1 + "T00:00:00")
      : new Date(startYear, 8, 5);
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const diff = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 1;
    return Math.max(1, Math.floor(diff / 7) + 1);
  }, [startYear, ngayBatDauHk1]);

  const selectableWeeks = useMemo(() => {
    if (Array.isArray(allowedWeeks) && allowedWeeks.length > 0) {
      return [...allowedWeeks].sort((a, b) => a - b);
    }
    return null;
  }, [allowedWeeks]);

  const totalWeeks = useMemo(() => {
    if (selectableWeeks?.length) return selectableWeeks[selectableWeeks.length - 1];
    const endYear = startYear + 1;
    const schoolEnd = new Date(endYear, 5, 1); // 1/6
    const schoolStart = new Date(startYear, 8, 1); // 1/9
    const diffDays = Math.floor((schoolEnd - schoolStart) / (1000 * 60 * 60 * 24));
    return Math.min(52, Math.max(18, Math.ceil(diffDays / 7)));
  }, [startYear, selectableWeeks]);

  // Nhóm tuần theo tháng
  const weeksByMonth = useMemo(() => {
    const groups = {};
    const weekList = selectableWeeks ?? Array.from({ length: totalWeeks }, (_, i) => i + 1);
    for (const t of weekList) {
      const { monday } = getWeekDatesLocal(t);
      const monthKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = monday.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
      if (!groups[monthKey]) groups[monthKey] = { label: monthLabel, weeks: [] };
      groups[monthKey].weeks.push(t);
    }
    return Object.values(groups);
  }, [startYear, totalWeeks, selectableWeeks, ngayBatDauHk1]);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { monday: selectedMonday, sunday: selectedSunday } = getWeekDatesLocal(value);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 6,
          border: "1px solid #d1d5db", background: "#fff",
          cursor: "pointer", fontSize: 12, fontWeight: 600,
          color: "#374151", transition: "all 0.2s",
          whiteSpace: "nowrap"
        }}
      >
        <span>Tuần {value}</span>
        <span style={{ fontWeight: 400, color: "#9ca3af", fontSize: 11 }}>
          {formatShort(selectedMonday)} – {formatShort(selectedSunday)}
        </span>
        <span style={{ fontSize: 8, color: "#9ca3af" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 6,
          background: "#fff", borderRadius: 10,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #e0e0e0",
          padding: 10, minWidth: 260, zIndex: 1000,
          maxHeight: "70vh", overflowY: "auto"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: "#00236f" }}>
              HK{hocKy || "?"} · {namHoc || "?"}
            </span>
            <button
              type="button"
              onClick={() => {
                const target = selectableWeeks?.includes(currentTuan)
                  ? currentTuan
                  : (selectableWeeks?.[0] ?? currentTuan);
                onChange(target);
                setOpen(false);
              }}
              style={{
                fontSize: 10, color: "#fff", background: "#00236f",
                border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer"
              }}
            >
              Hôm nay
            </button>
          </div>

          {weeksByMonth.map((group) => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "#9ca3af",
                textTransform: "capitalize", marginBottom: 3
              }}>
                {group.label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                {group.weeks.map((t) => {
                  const { monday, sunday } = getWeekDatesLocal(t);
                  const hasData = availableWeeks.includes(t);
                  const isSelected = t === value;
                  const isCurrent = t === currentTuan;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { onChange(t); setOpen(false); }}
                      style={{
                        padding: "4px 2px", borderRadius: 5,
                        border: isSelected ? "2px solid #00236f" : isCurrent ? "2px solid #4caf50" : "1px solid #e5e7eb",
                        background: isSelected ? "#e0f2fe" : isCurrent ? "#e8f5e9" : "#fff",
                        cursor: "pointer", textAlign: "center",
                        opacity: hasData ? 1 : 0.4,
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 11, color: isSelected ? "#00236f" : "#374151" }}>
                        {t}
                      </div>
                      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>
                        {formatShort(monday)}–{formatShort(sunday)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
