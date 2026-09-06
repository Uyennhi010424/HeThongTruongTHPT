import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { updateTkbNote } from "../../../api/thoikhoabieuApi.js";
import { getLimitedSemesterWeeks, mapTimeToPeriod } from "../../../utils/helpers.js";
import { getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import { getLichThi } from "../../../api/lichthiApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";

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

export default function TeacherRegisterPhanCong() {
  const [timetable, setTimetable] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [isExamWeek, setIsExamWeek] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { thu, tiet }
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    phanCongId: "",
    soTiet: 1
  });
  const [moveForm, setMoveForm] = useState({ targetThu: 2, targetTiet: 1 });
  const [swapTargetId, setSwapTargetId] = useState("");
  const [noteText, setNoteText] = useState("");

  const [namHoc, setNamHoc] = useState("2025-2026");
  const [hocKy, setHocKy] = useState(1);
  const [tuan, setTuan] = useState(1);
  const [allWeeks, setAllWeeks] = useState(Array.from({ length: 36 }, (_, i) => i + 1));
  const isInitialized = useRef(false);

  const loadScheduleData = async (targetNamHoc, targetHocKy, targetTuan, currentTeacherObj, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = { namHoc: targetNamHoc, hocKy: targetHocKy, tuan: targetTuan };
      const [resTkb, resClasses, resExams] = await Promise.all([
        axiosClient.get("/giaoviendangky/thoikhoabieu", { params, skipCache: true }),
        axiosClient.get("/giaoviendangky/lop-cua-toi", { params: { namHoc: targetNamHoc, hocKy: targetHocKy }, skipCache: true }),
        getLichThi({ namHoc: targetNamHoc, hocKy: targetHocKy }).catch(() => ({ data: { data: [] } }))
      ]);
      const serverSlots = resTkb?.data?.data || [];
      const allLichThi = resExams?.data?.data || [];
      const teacher = currentTeacherObj || teacherProfile;

      // Lấy ngày đầu tuần / cuối tuần để filter lịch thi
      const startYear = parseInt(String(targetNamHoc).split("-")[0]) || 2025;
      const schoolStart = new Date(startYear, 8, 5); 
      const dow = schoolStart.getDay();
      const monday = new Date(schoolStart);
      monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
      monday.setDate(monday.getDate() + (targetTuan - 1) * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      allLichThi.forEach(exam => {
        if (!exam.ngayThi) return;
        const d = new Date(exam.ngayThi + "T00:00:00");
        if (d >= monday && d <= sunday) {
           const isGiamThi = teacher && (Number(exam.giamThi1Id ?? exam.giamThi1?.id) === Number(teacher.id) || Number(exam.giamThi2Id ?? exam.giamThi2?.id) === Number(teacher.id));
           const isChuNhiem = teacher?.lopChuNhiem && Number(exam.lopId) === Number(teacher.lopChuNhiem.id);
           
           if (isGiamThi || isChuNhiem) {
             const examDow = d.getDay();
             const thu = examDow === 0 ? 8 : examDow + 1;
             const period = mapTimeToPeriod(exam.gioBatDau);
             
             serverSlots.push({
               id: 'ex-' + exam.id,
               thu: thu,
               tietBatDau: period,
               soTiet: 1,
               tenMon: "[THI] " + (exam.monHoc?.tenMon || ""),
               tenLop: exam.phongThi ? `Phòng: ${exam.phongThi}` : "Lịch thi",
               isExam: true,
               isLocked: true // Make it un-editable
             });
           }
        }
      });

      setIsExamWeek(resTkb?.data?.message === "TUAN_THI");
      if (silent) {
        setTimetable((prev) => {
          const merged = [...serverSlots];
          prev.forEach((optSlot) => {
            if (optSlot.isLocked) {
              const exists = serverSlots.some(
                (s) => s.id === optSlot.id || (s.thu === optSlot.thu && s.tietBatDau === optSlot.tietBatDau && s.tuan === optSlot.tuan)
              );
              if (!exists) {
                merged.push(optSlot);
              }
            }
          });
          return merged;
        });
      } else {
        setTimetable(serverSlots);
      }
      setMyClasses(resClasses?.data?.data || []);
    } catch (err) {
      console.error(err);
      notifyError("Không thể tải lịch dạy của giáo viên.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchData = useCallback((silent = false) => {
    return loadScheduleData(namHoc, hocKy, tuan, teacherProfile, silent);
  }, [namHoc, hocKy, tuan, teacherProfile]);

  // Fetch initial year info to calculate correct initial hocKy and tuan
  useEffect(() => {
    let active = true;
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [namHocRes, meRes] = await Promise.all([
          getNamHoc().catch(() => null),
          getCurrentGiaoVien().catch(() => null)
        ]);
        if (!active) return;

        const teacher = meRes?.data?.data || null;
        setTeacherProfile(teacher);

        const yList = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(yList);
        const currentYear = getActiveAcademicYear(visibleYears) || visibleYears[0] || null;
        let selectedNamHoc = "2025-2026";
        let actualHk = 1;
        let currentWeek = 1;

        if (currentYear) {
          selectedNamHoc = currentYear.tenNamHoc;
          setNamHoc(selectedNamHoc);
          
          let schoolStart;
          if (currentYear.ngayBatDauHk1) {
            schoolStart = new Date(currentYear.ngayBatDauHk1 + "T00:00:00");
          } else {
            schoolStart = new Date(parseInt(currentYear.tenNamHoc.split("-")[0]), 8, 5);
          }
          
          const dow = schoolStart.getDay();
          const monday = new Date(schoolStart);
          monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
            currentWeek = Math.floor(diffDays / 7) + 1;
          }
          currentWeek = Math.min(38, Math.max(1, currentWeek));
          
          const maxAvailWeek = Math.min(38, currentWeek + 2);
          const weeks = Array.from({ length: maxAvailWeek }, (_, i) => i + 1);
          setAllWeeks(weeks);
          setTuan(currentWeek);
          
          // Auto calc hocKy
          if (currentYear.ngayBatDauHk2) {
            const currentMonday = new Date(schoolStart);
            currentMonday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1) + (currentWeek - 1) * 7);
            const hk2Start = new Date(currentYear.ngayBatDauHk2 + "T00:00:00");
            if (currentMonday >= hk2Start) actualHk = 2;
          } else if (currentWeek >= 19) {
            actualHk = 2;
          }
          setHocKy(actualHk);
        }

        await loadScheduleData(selectedNamHoc, actualHk, currentWeek, teacher, false);
      } catch (e) {
        console.error(e);
        if (active) setLoading(false);
      }
    };
    fetchInit();
    return () => { active = false; };
  }, []);

  // When tuan changes via dropdown, reload schedule
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const newHocKy = tuan >= 19 ? 2 : 1;
    if (newHocKy !== hocKy) {
      setHocKy(newHocKy);
    }
    loadScheduleData(namHoc, newHocKy, tuan, teacherProfile, false);
  }, [tuan]);

  const weekDates = useMemo(() => {
    const startYear = parseInt(namHoc.split("-")[0]);
    const schoolStart = new Date(startYear, 8, 5); // Default to Sept 5th
    const dow = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setDate(monday.getDate() + (tuan - 1) * 7);

    const dates = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [namHoc, tuan]);

  const findTkbEntry = (day, period) => {
    return timetable.find((t) => {
      const start = t.tietBatDau;
      const count = t.soTiet || 1;
      return t.thu === day && period >= start && period < start + count;
    });
  };

  const handleCellClick = (day, period) => {
    const entry = findTkbEntry(day, period);
    if (entry) {
      if (entry.isExam) return; // Khong lam gi khi click vao lich thi
      if (entry.isLocked) {
        setEditingEntry(entry);
        setNoteText(entry.ghiChu || "");
        setMoveForm({ targetThu: day, targetTiet: period });
        setSwapTargetId("");
        setEditModalOpen(true);
      } else {
        notifyError("Đây là tiết học do hệ thống xếp lịch tự động, không thể sửa đổi.");
      }
    } else {
      setSelectedSlot({ thu: day, tiet: period });
      setForm({ phanCongId: myClasses[0]?.phanCongId || "", soTiet: 1 });
      setRegisterModalOpen(true);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.phanCongId) {
      notifyError("Vui lòng chọn lớp học đăng ký dạy.");
      return;
    }
    const pc = myClasses.find((c) => c.phanCongId === parseInt(form.phanCongId));
    if (!pc) {
      notifyError("Phân công không hợp lệ.");
      return;
    }

    try {
      const payload = {
        lopId: pc.lopId,
        monHocId: pc.monHocId,
        thu: selectedSlot.thu,
        tietBatDau: selectedSlot.tiet,
        soTiet: parseInt(form.soTiet),
        namHoc,
        hocKy,
        tuan
      };
      const res = await axiosClient.post("/giaoviendangky/thoikhoabieu/dangky", payload);
      notifySuccess("Đăng ký tiết dạy thành công.");
      setRegisterModalOpen(false);
      
      // Optimistic update
      const newSlot = res?.data?.data;
      if (newSlot) {
        setTimetable((prev) => [...prev, newSlot]);
      }
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi đăng ký tiết dạy.");
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    try {
      await updateTkbNote(editingEntry.id, noteText);
      notifySuccess("Lưu thông báo cho lớp thành công.");
      setTimetable((prev) =>
        prev.map((t) => (t.id === editingEntry.id ? { ...t, ghiChu: noteText } : t))
      );
      setEditModalOpen(false);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi lưu thông báo.");
    }
  };

  const handleMove = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post("/giaoviendangky/thoikhoabieu/doi-lich", null, {
        params: {
          sourceId: editingEntry.id,
          targetThu: moveForm.targetThu,
          targetTiet: moveForm.targetTiet
        }
      });
      notifySuccess("Di chuyển tiết dạy thành công.");
      setEditModalOpen(false);
      
      // Optimistic update
      const updatedSlot = res?.data?.data;
      if (updatedSlot) {
        setTimetable((prev) => prev.map((t) => t.id === updatedSlot.id ? updatedSlot : t));
      }
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi di chuyển tiết dạy.");
    }
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    if (!swapTargetId) {
      notifyError("Vui lòng chọn tiết học muốn hoán đổi.");
      return;
    }
    try {
      await axiosClient.post("/giaoviendangky/thoikhoabieu/doi-lich", null, {
        params: {
          sourceId: editingEntry.id,
          targetId: swapTargetId
        }
      });
      notifySuccess("Hoán đổi tiết dạy thành công.");
      setEditModalOpen(false);
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Lỗi khi hoán đổi tiết dạy.");
    }
  };

  const handleDeleteCurrent = () => {
    setEditModalOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await handleDelete(editingEntry.id);
      setDeleteConfirmOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/giaoviendangky/thoikhoabieu/${id}`);
      notifySuccess("Đã hủy đăng ký tiết dạy thành công.");
      
      // Optimistic update
      setTimetable((prev) => prev.filter((t) => t.id !== id));
      axiosClient.invalidateCache("/giaoviendangky/thoikhoabieu");
      setTimeout(() => {
        fetchData(true);
      }, 500);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể hủy đăng ký tiết dạy.");
    }
  };

  return (
    <div className="page" style={{ padding: "24px" }}>
      <PageHeader
        title="Đăng ký lịch dạy theo tuần"
        actions={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#00236f", marginLeft: 16 }}>
              Năm học {namHoc} - Học kỳ {hocKy === 1 ? 'I' : 'II'}
            </span>
              <select
                value={tuan}
                onChange={(e) => setTuan(parseInt(e.target.value))}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13 }}
              >
                {(allWeeks.length > 0 ? allWeeks : [1,2,3]).map((w) => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
          </div>
        }
      />

      <div className="card" style={{ padding: 24, marginTop: 24 }}>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>Đang tải lịch dạy...</div>
        ) : (
          <div className="tkb-table-wrap">
            <table className="tkb-table">
              <thead>
                <tr>
                  <th className="tkb-header-ca">Buổi</th>
                  <th className="tkb-header-tiet">Tiết</th>
                  {DAYS.map((day, idx) => (
                    <th key={day.value}>
                      <div>{day.label}</div>
                      <div className="tkb-date">
                        {weekDates[idx]?.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                      </div>
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
                          className={`tkb-ca-hoc ${pIndex === 0 ? "tkb-sang" : "tkb-chieu"}`}
                        >
                          {period.session}
                        </td>
                      )}
                      <td className="tkb-period">
                        {period.label}
                      </td>
                      {DAYS.map((day) => {
                        const entry = findTkbEntry(day.value, period.value);
                        const isStart = entry && entry.tietBatDau === period.value;
                        const isSpan = entry && entry.tietBatDau !== period.value;

                        if (isSpan) return null; // Let rowSpan handle the slot

                        return (
                          <td
                            key={day.value}
                            className={`tkb-cell tkb-interactive ${isStart ? 'tkb-start' : ''}`}
                            rowSpan={entry ? entry.soTiet || 1 : 1}
                            onClick={() => handleCellClick(day.value, period.value)}
                            style={{
                              border: entry?.isExam ? "1px solid #fca5a5" : "1px solid #e5e7eb",
                              padding: entry ? "12px" : "16px",
                              textAlign: "center",
                              background: entry ? (entry.isExam ? "#fef2f2" : (entry.isLocked ? "#eff6ff" : (pIndex < 5 ? "#fef8e7" : "#e0f2fe"))) : "transparent",
                              cursor: entry?.isExam ? "default" : "pointer",
                              transition: "all 0.2s ease",
                              verticalAlign: "middle"
                            }}
                            onMouseEnter={(e) => {
                              if (!entry) e.currentTarget.style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              if (!entry) e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {entry ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                                <div style={{ fontWeight: 700, color: entry.isExam ? "#b91c1c" : (entry.isLocked ? "#1e40af" : "#475569") }}>
                                  {entry.isExam ? entry.tenLop : `Lớp ${entry.lop?.tenLop || ""}`}
                                </div>
                                <div style={{ fontSize: 13, color: entry.isExam ? "#b91c1c" : (entry.isLocked ? "#2563eb" : "#64748b"), fontWeight: entry.isExam ? "bold" : "normal" }}>
                                  {entry.isExam ? entry.tenMon : `Môn: ${entry.monHoc?.tenMon || ""}`}
                                </div>
                                {entry.isExam ? (
                                  <span style={{ display: "inline-block", background: "#fca5a5", color: "#7f1d1d", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, marginTop: 4 }}>
                                    Lịch thi
                                  </span>
                                ) : entry.isLocked ? (
                                  <span style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, marginTop: 4 }}>
                                    Tự đăng ký
                                  </span>
                                ) : (
                                  <span style={{ display: "inline-block", background: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 500, marginTop: 4 }}>
                                    Hệ thống xếp
                                  </span>
                                )}
                                {entry.ghiChu && !entry.isExam && (
                                  <div style={{ marginTop: 4, padding: "2px 6px", borderRadius: 4, backgroundColor: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 600, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    📝 {entry.ghiChu}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: "#cbd5e1" }}>+ Đăng ký</span>
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

      <SimpleModal
        open={registerModalOpen}
        title={`Đăng ký tiết dạy - Thứ ${selectedSlot?.thu} Tiết ${selectedSlot?.tiet}`}
        onClose={() => setRegisterModalOpen(false)}
      >
        <form onSubmit={handleRegister} className="form-grid" style={{ gap: 16 }}>
          <label className="form-field">
            <span>Chọn lớp phụ trách</span>
            <select
              value={form.phanCongId}
              onChange={(e) => setForm((prev) => ({ ...prev, phanCongId: e.target.value }))}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="">-- Chọn lớp học --</option>
              {myClasses.map((c) => (
                <option key={c.phanCongId} value={c.phanCongId}>
                  Lớp {c.tenLop} - Môn {c.tenMon}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Số tiết học</span>
            <select
              value={form.soTiet}
              onChange={(e) => setForm((prev) => ({ ...prev, soTiet: parseInt(e.target.value) }))}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value={1}>1 tiết</option>
              <option value={2}>2 tiết liền nhau (tiết đôi)</option>
              <option value={3}>3 tiết liền nhau</option>
            </select>
          </label>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button type="button" className="btn-outline" onClick={() => setRegisterModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Xác nhận đăng ký
            </button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        open={editModalOpen}
        title={`Chỉnh sửa tiết dạy lớp ${editingEntry?.lop?.tenLop} - môn ${editingEntry?.monHoc?.tenMon}`}
        onClose={() => setEditModalOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Di chuyển */}
          <form onSubmit={handleMove} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>1. Di chuyển sang ô trống khác</span>
            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "flex-end" }}>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Thứ</span>
                <select
                  value={moveForm.targetThu}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, targetThu: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </label>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Tiết bắt đầu</span>
                <select
                  value={moveForm.targetTiet}
                  onChange={(e) => setMoveForm(prev => ({ ...prev, targetTiet: parseInt(e.target.value) }))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <button type="submit" className="btn-primary" style={{ padding: "8px 16px", height: 36, fontSize: 13 }}>
                Di chuyển
              </button>
            </div>
          </form>

          {/* Hoán đổi */}
          <form onSubmit={handleSwap} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>2. Hoán đổi vị trí với tiết dạy khác</span>
            <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "flex-end" }}>
              <label className="form-field" style={{ flex: 1 }}>
                <span style={{ fontSize: 12 }}>Chọn tiết hoán đổi</span>
                <select
                  value={swapTargetId}
                  onChange={(e) => setSwapTargetId(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                >
                  <option value="">-- Chọn tiết học --</option>
                  {timetable
                    .filter(t => t.isLocked && t.id !== editingEntry?.id)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        Lớp {t.lop?.tenLop} - Thứ {t.thu} Tiết {t.tietBatDau}
                      </option>
                    ))}
                </select>
              </label>
              <button type="submit" className="btn-primary" style={{ padding: "8px 16px", height: 36, fontSize: 13 }} disabled={!swapTargetId}>
                Hoán đổi
              </button>
            </div>
          </form>

          {/* Ghi chú */}
          <form onSubmit={handleSaveNote} style={{ borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--primary, #2563eb)" }}>3. Ghi chú tiết học / Thông báo lớp</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nhập thông báo, ghi chú lớp học (ví dụ: Kiểm tra 15p, Mang theo sách bài tập...)"
                rows={2}
                style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn-primary" style={{ padding: "6px 16px", fontSize: 13 }}>
                  Lưu thông báo
                </button>
              </div>
            </div>
          </form>

          {/* Xóa */}
          <div>
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--error, #ef4444)" }}>4. Hủy đăng ký tiết học này</span>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn-outline" onClick={handleDeleteCurrent} style={{ width: "100%", color: "#ef4444", borderColor: "#fca5a5", background: "#fef2f2", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                Hủy đăng ký (Xóa tiết)
              </button>
            </div>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        open={deleteConfirmOpen}
        title="Hủy đăng ký tiết dạy"
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: "50%", 
            background: "#fee2e2", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: "#ef4444"
          }}>
            <MaterialIcon name="warning" style={{ fontSize: 28 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 600, fontSize: 16, color: "#111827", marginBottom: 6 }}>Xác nhận hủy đăng ký</p>
            <p style={{ fontSize: 14, color: "#4b5563", lineHeight: "1.5" }}>
              Bạn có chắc chắn muốn hủy tiết dạy môn <strong style={{ color: "#ef4444" }}>{editingEntry?.monHoc?.tenMon}</strong> của lớp <strong>{editingEntry?.lop?.tenLop}</strong>?
            </p>
          </div>
          <div style={{ display: "flex", width: "100%", gap: 12, marginTop: 12 }}>
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              style={{ flex: 1 }}
            >
              Quay lại
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleConfirmDelete}
              style={{ flex: 1, background: "#ef4444", borderColor: "#ef4444", color: "#fff" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
            >
              Hủy tiết dạy
            </button>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
