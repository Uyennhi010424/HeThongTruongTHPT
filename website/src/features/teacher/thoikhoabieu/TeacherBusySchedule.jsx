import { useEffect, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";

const DAYS = [
  { value: 2, label: "Thứ Hai" },
  { value: 3, label: "Thứ Ba" },
  { value: 4, label: "Thứ Tư" },
  { value: 5, label: "Thứ Năm" },
  { value: 6, label: "Thứ Sáu" },
  { value: 7, label: "Thứ Bảy" }
];

const PERIODS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `Tiết ${i + 1}`,
  session: i < 5 ? "Sáng" : "Chiều"
}));

export default function TeacherBusySchedule() {
  const { confirm } = useConfirm();
  const [busySlots, setBusySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tuan, setTuan] = useState(1);

  const fetchLichBan = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/giaoviendangky/lich-ban", { params: { tuan }, skipCache: true });
      setBusySlots(res?.data?.data || []);
    } catch (err) {
      notifyError("Không thể tải lịch bận của giáo viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLichBan();
  }, [tuan]);

  const isBusy = (day, period) => {
    return busySlots.some((slot) => slot.thu === day && slot.tiet === period);
  };

  const handleCellClick = (day, period) => {
    setBusySlots((prev) => {
      const exists = prev.some((slot) => slot.thu === day && slot.tiet === period);
      if (exists) {
        return prev.filter((slot) => !(slot.thu === day && slot.tiet === period));
      } else {
        return [...prev, { thu: day, tiet: period }];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axiosClient.post("/giaoviendangky/lich-ban", busySlots, { params: { tuan } });
      notifySuccess("Lưu lịch bận thành công.");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi lưu đăng ký lịch bận.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (await confirm("Bạn muốn xóa toàn bộ lịch bận đã chọn?")) {
      setBusySlots([]);
    }
  };

  return (
    <div className="page" style={{ padding: "24px" }}>
      <PageHeader
        title="Đăng ký lịch bận giảng dạy"
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <select
              value={tuan}
              onChange={(e) => setTuan(parseInt(e.target.value))}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }}
            >
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tuần {i + 1}</option>
              ))}
            </select>
            <button className="btn-outline" onClick={handleClearAll} disabled={loading || saving}>
              Xóa tất cả
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={loading || saving}>
              {saving ? "Đang lưu..." : "Lưu lịch bận"}
            </button>
          </div>
        }
      />

      <div className="card" style={{ padding: 24, marginTop: 24 }}>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>Đang tải dữ liệu...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", width: 100 }}>Buổi</th>
                  <th style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", width: 100 }}>Tiết</th>
                  {DAYS.map((day) => (
                    <th key={day.value} style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", background: "#f8fafc", fontWeight: 600 }}>
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, pIndex) => {
                  const showSessionCell = pIndex === 0 || pIndex === 5;
                  return (
                    <tr key={period.value}>
                      {showSessionCell && (
                        <td
                          rowSpan={5}
                          style={{
                            border: "1px solid var(--outline-variant, #eee)",
                            textAlign: "center",
                            fontWeight: 700,
                            background: "#f1f5f9",
                            color: "var(--primary, #2563eb)",
                            fontSize: 14
                          }}
                        >
                          {period.session}
                        </td>
                      )}
                      <td style={{ border: "1px solid var(--outline-variant, #eee)", padding: "12px", textAlign: "center", background: "#fafafa", fontWeight: 500, fontSize: 13 }}>
                        {period.label}
                      </td>
                      {DAYS.map((day) => {
                        const busy = isBusy(day.value, period.value);
                        return (
                          <td
                            key={day.value}
                            onClick={() => handleCellClick(day.value, period.value)}
                            style={{
                              border: "1px solid var(--outline-variant, #eee)",
                              padding: "16px",
                              textAlign: "center",
                              background: busy ? "#fee2e2" : "transparent",
                              color: busy ? "#ef4444" : "inherit",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              userSelect: "none"
                            }}
                            className={busy ? "busy-cell-active" : "busy-cell-inactive"}
                            onMouseEnter={(e) => {
                              if (!busy) e.currentTarget.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              if (!busy) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {busy ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                <MaterialIcon name="block" style={{ fontSize: 18 }} />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>BẬN</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "#cbd5e1" }}>Rảnh</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
