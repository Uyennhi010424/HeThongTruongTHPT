import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../components/edu/MaterialIcon.jsx";
import { getCurrentGiaoVien } from "../../api/giaovienApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { getThoiKhoaBieu } from "../../api/thoikhoabieuApi.js";
import {
  dangKyNghi,
  getNghiByGiaoVien,
  huyNghi,
} from "../../api/giaoVienNghiApi.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";
import { useConfirm } from "../../contexts/ConfirmContext.jsx";

export default function TeacherLeaveRequestPage() {
  const { confirm } = useConfirm();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [timetable, setTimetable] = useState([]);

  const [currentYear, setCurrentYear] = useState("2025-2026");
  const [targetYear, setTargetYear] = useState(null);
  const [allYears, setAllYears] = useState([]);
  const [detailTarget, setDetailTarget] = useState(null);
  const location = useLocation();

  // Tính targetYear dựa trên ngày được chọn (hoặc hôm nay nếu chưa chọn)
  useEffect(() => {
    if (allYears.length === 0) return;
    const checkDate = date ? new Date(date) : new Date();
    const time = checkDate.getTime();
    const matched = allYears.find(
      (y) =>
        time >= new Date(y.ngayBatDauHk1).getTime() &&
        time <= new Date(y.ngayKetThucHk2).getTime()
    );
    setTargetYear(matched ? matched.tenNamHoc : null);
  }, [date, allYears]);

  // Tải thông tin giáo viên đăng nhập
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const [meRes, namHocRes] = await Promise.all([
          getCurrentGiaoVien().catch(() => null),
          getNamHoc().catch(() => null)
        ]);
        if (!active) return;

        const found = meRes?.data?.data || null;
        setTeacher(found);

        const years = namHocRes?.data?.data || [];
        setAllYears(years);
        if (years.length > 0) {
          const activeYear = years.find((nh) => nh.trangThai === "DANG_MO");
          setCurrentYear(activeYear ? activeYear.tenNamHoc : years[years.length - 1].tenNamHoc);
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  // Auto-open detail when navigating from a notification
  useEffect(() => {
    const refId = location.state?.referenceId;
    if (refId && requests.length > 0) {
      const found = requests.find((r) => r.id === Number(refId));
      if (found) setDetailTarget(found);
    }
  }, [location.state, requests]);

  const loadRequests = async () => {
    if (!teacher?.id) return;
    try {
      const res = await getNghiByGiaoVien(teacher.id);
      const data = res?.data?.data || [];
      const sorted = [...data].sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime());
      setRequests(sorted);
    } catch {
      /* ignore */
    }
  };

  const loadSchedule = async () => {
    if (!teacher?.id) return;
    if (!targetYear) {
      setTimetable([]);
      return;
    }
    try {
      const tkbRes = await getThoiKhoaBieu({ namHoc: targetYear });
      const allSlots = tkbRes?.data?.data || [];
      const teacherSlots = allSlots.filter(s => 
        String(s?.giaoVien?.id ?? s?.giaoVienId) === String(teacher.id)
      );

      const uniqueSlots = [];
      const seenKeys = new Set();
      for (const slot of teacherSlots) {
        const key = `${slot.thu}-${slot.tietBatDau}-${slot.lop?.id || slot.lopId}-${slot.monHoc?.id || slot.monHocId}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueSlots.push(slot);
        }
      }

      uniqueSlots.sort((a, b) => Number(a.thu) - Number(b.thu) || Number(a.tietBatDau) - Number(b.tietBatDau));
      setTimetable(uniqueSlots);
    } catch {
      setTimetable([]);
    }
  };

  useEffect(() => {
    if (teacher?.id) {
      loadRequests();
    }
  }, [teacher?.id]);

  useEffect(() => {
    if (teacher?.id) {
      loadSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id, targetYear]);

  // Tính toán ngày trong tuần hiện tại dựa trên "Thứ" (2 = Thứ hai -> 7 = Thứ bảy) của tuần chứa ngày xin nghỉ
  const getCalculatedDateForDay = (thuValue) => {
    if (!date) return "--/--"; // Nếu chưa chọn ngày nghỉ thì không hiển thị ngày cụ thể
    const baseDate = new Date(date);
    let currentDay = baseDate.getDay(); // 0 = Chủ nhật, 1 = Thứ hai,...
    if (currentDay === 0) currentDay = 7; // Coi Chủ nhật là cuối tuần (ngày 7)
    const distance = (thuValue - 1) - currentDay; // Tính khoảng cách ngày
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + distance);
    return targetDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher?.id) {
      notifyError("Không tìm thấy thông tin tài khoản giáo viên.");
      return;
    }
    if (!date) {
      notifyError("Vui lòng chọn ngày nghỉ.");
      return;
    }

    setSaving(true);
    try {
      let submitYear = currentYear;
      if (allYears.length > 0) {
        const time = new Date(date).getTime();
        const matched = allYears.find(y => time >= new Date(y.ngayBatDauHk1).getTime() && time <= new Date(y.ngayKetThucHk2).getTime());
        if (matched) {
          submitYear = matched.tenNamHoc;
        } else {
          const dy = new Date(date).getFullYear();
          const dm = new Date(date).getMonth() + 1;
          submitYear = dm >= 8 ? `${dy}-${dy + 1}` : `${dy - 1}-${dy}`;
        }
      }

      await dangKyNghi({
        giaoVienId: teacher.id,
        ngay: date,
        namHoc: submitYear,
        lyDo: reason.trim() || "Nghỉ phép",
      });
      notifySuccess("Đã gửi đơn xin nghỉ dạy. Vui lòng chờ BGH phê duyệt.");
      setDate("");
      setReason("");
      await loadRequests();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.response?.data?.error || "Gửi yêu cầu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!(await confirm("Bạn có chắc chắn muốn hủy đơn xin nghỉ dạy này?"))) return;
    try {
      await huyNghi(id);
      notifySuccess("Đã hủy đơn thành công.");
      await loadRequests();
    } catch {
      notifyError("Không thể hủy đơn.");
    }
  };

  const getDayLabel = (value) => {
    switch (Number(value)) {
      case 2: return "Thứ hai";
      case 3: return "Thứ ba";
      case 4: return "Thứ tư";
      case 5: return "Thứ năm";
      case 6: return "Thứ sáu";
      case 7: return "Thứ bảy";
      default: return "--";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Từ chối";
      case "PENDING":
      default:
        return "Chờ duyệt";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return { color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0" };
      case "REJECTED":
        return { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecdd3" };
      case "PENDING":
      default:
        return { color: "#d97706", background: "#fffbeb", border: "1px solid #fef3c7" };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return r.trangThai === "PENDING" || !r.trangThai;
    if (activeTab === "approved") return r.trangThai === "APPROVED";
    if (activeTab === "rejected") return r.trangThai === "REJECTED";
    return true;
  });

  if (loading) {
    return (
      <div className="page users-page">
        <div className="card table-empty">Đang tải thông tin...</div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="page users-page">
        <div className="card table-empty">Không tìm thấy thông tin hồ sơ giáo viên. Vui lòng liên hệ Admin.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo nghỉ dạy"
        description="Gửi yêu cầu nghỉ dạy để Ban Giám Hiệu duyệt và phân công dạy thay."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form gửi đơn & Lịch dạy của giáo viên */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600">rate_review</span>
              Tạo đơn báo nghỉ
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Giáo viên báo nghỉ</label>
                <input
                  type="text"
                  value={teacher.hoTen}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none"
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Ngày nghỉ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500">Lý do nghỉ</label>
                <textarea
                  placeholder="Nhập lý do nghỉ dạy..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Đang gửi đơn..." : "Gửi yêu cầu nghỉ dạy"}
              </button>
            </form>
          </div>

          {/* Lịch dạy của giáo viên */}
          {timetable.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-600">calendar_month</span>
                Lịch giảng dạy trong tuần
              </h3>
              <p className="text-xs text-gray-400 mb-4">Các tiết dạy chính thức được xếp lịch dạy của bạn:</p>
              <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {timetable.map((s) => (
                  <div key={s.id} className="rounded-lg bg-gray-50 p-2.5 text-xs border border-gray-100">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{s.monHoc?.tenMon}</span>
                      <span className="text-blue-600">Lớp {s.lop?.tenLop}</span>
                    </div>
                    <div className="text-gray-500 mt-1 flex justify-between">
                      <span>{getDayLabel(s.thu)} ({getCalculatedDateForDay(s.thu)})</span>
                      <span>Tiết {s.tietBatDau} ({s.soTiet} tiết)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lịch sử đơn báo nghỉ */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800">Lịch sử đơn báo nghỉ</h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
              {filteredRequests.length} đơn
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-100 pb-2 text-xs">
            {[
              { id: "all", label: "Tất cả" },
              { id: "pending", label: "Chờ duyệt" },
              { id: "approved", label: "Đã duyệt" },
              { id: "rejected", label: "Từ chối" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeTab === t.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 italic">
              Không có dữ liệu đơn báo nghỉ nào.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredRequests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-100 p-4 bg-gray-50/30 flex flex-col gap-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">
                          Ngày nghỉ: {new Date(r.ngay).toLocaleDateString("vi-VN")}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold"
                          style={getStatusStyle(r.trangThai)}
                        >
                          {getStatusLabel(r.trangThai)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Lý do: {r.lyDo}</p>
                      {r.trangThai === "APPROVED" && (
                        <p className="text-xs text-green-600 font-medium">
                          Giáo viên dạy thay thế: {r.giaoVienThay?.hoTen || "Không sắp xếp dạy thay"}
                        </p>
                      )}
                      {r.trangThai === "REJECTED" && r.lyDoTuChoi && (
                        <p className="text-xs text-red-600 font-medium">
                          Lý do từ chối: {r.lyDoTuChoi}
                        </p>
                      )}
                    </div>

                    {(r.trangThai === "PENDING" || !r.trangThai) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(r.id)}
                        className="self-start md:self-auto rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>

                  {/* Admin feedback */}
                  {r.adminMessage && (
                    <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 14px", border: "1px solid #bfdbfe" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>Phản hồi từ Ban giám hiệu</div>
                      <div style={{ fontSize: 13, color: "#1e40af" }}>{r.adminMessage}</div>
                      {r.approvedAt && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          {new Date(r.approvedAt).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
