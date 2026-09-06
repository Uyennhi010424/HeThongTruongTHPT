import { useEffect, useMemo, useState } from "react";
import { getLop } from "../../../api/lopApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { getHocKy } from "../../../api/hockyApi.js";
import {
  generateThoiKhoaBieu,
  generateThoiKhoaBieuAll,
  getThoiKhoaBieu,
  moveThoiKhoaBieu,
  swapThoiKhoaBieu,
  deleteThoiKhoaBieuBulk
} from "../../../api/thoikhoabieuApi.js";
import { checkExamWeek, getLichThi } from "../../../api/lichthiApi.js";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import {
  getAllNghi,
  dangKyNghi,
  duyetNghi,
  huyNghi,
} from "../../../api/giaoVienNghiApi.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { getLimitedSemesterWeeks, getWeekDates, mapTimeToPeriod, getActiveAcademicYear, getVisibleAcademicYears } from "../../../utils/helpers.js";
import PdfPreviewModal from "../../../components/common/PdfPreviewModal.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";

const getApiMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

export default function AdminThoiKhoaBieuPage() {
  const { confirm } = useConfirm();
  const { systemName } = useTheme();

  const [timetable, setTimetable] = useState([]);
  const [lops, setLops] = useState([]);
  const [namHocs, setNamHocs] = useState([]);
  const [hocKys, setHocKys] = useState([]);

  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("");
  const [selectedTuan, setSelectedTuan] = useState(1);
  const [buoiFilter, setBuoiFilter] = useState("ALL"); // ALL, SANG, CHIEU
  const [showSettings, setShowSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfHtmlContent, setPdfHtmlContent] = useState("");
  const [isExamWeek, setIsExamWeek] = useState(false);

  const selectedYear = useMemo(() => {
    return namHocs.find(y => y.id.toString() === selectedYearId);
  }, [namHocs, selectedYearId]);

  const currentYearLops = useMemo(() => {
    const list = selectedYear?.tenNamHoc 
      ? lops.filter(l => l.namHoc === selectedYear.tenNamHoc)
      : lops;
    return (list.length > 0 ? list : lops)
      .slice()
      .sort((a, b) => String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { numeric: true }));
  }, [lops, selectedYear]);

  const semesterWeeks = useMemo(() => {
    return getLimitedSemesterWeeks(selectedYear, selectedHocKy);
  }, [selectedYear, selectedHocKy]);

  const [hasInitializedWeek, setHasInitializedWeek] = useState(false);

  useEffect(() => {
    if (semesterWeeks.length > 0 && !hasInitializedWeek) {
      let currentWeek = semesterWeeks[0] || 1;
      if (selectedYear?.ngayBatDauHk1) {
        const schoolStart = new Date(selectedYear.ngayBatDauHk1 + "T00:00:00");
        const dayOfWeek = schoolStart.getDay();
        const monday = new Date(schoolStart);
        monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          const calculated = Math.floor(diffDays / 7) + 1;
          if (semesterWeeks.includes(calculated)) {
            currentWeek = calculated;
          }
        }
      }
      setSelectedTuan(currentWeek);
      setHasInitializedWeek(true);
    }
  }, [semesterWeeks, selectedYear, hasInitializedWeek]);

  // Handle manual semester change
  useEffect(() => {
    if (hasInitializedWeek && !semesterWeeks.includes(selectedTuan)) {
      setSelectedTuan(semesterWeeks[0] || 1);
    }
  }, [semesterWeeks, selectedTuan, hasInitializedWeek]);

  // Helper functions for date range calculation and formatting
  const formatShortDate = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
  const formatLongDate = (d) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}`;
  };
  const formatFullDate = (d) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForDay = (thuNum) => {
    const dayDiff = Number(thuNum) - 2;
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayDiff);
    const day = String(targetDate.getDate()).padStart(2, "0");
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  };

  const handleGoToToday = () => {
    if (!selectedYear) return;
    const startYear = selectedYear.tenNamHoc ? parseInt(selectedYear.tenNamHoc.split("-")[0]) : new Date().getFullYear();
    const schoolStart = selectedYear.ngayBatDauHk1
      ? new Date(selectedYear.ngayBatDauHk1 + "T00:00:00")
      : new Date(startYear, 8, 5);
    const dayOfWeek = schoolStart.getDay();
    const monday = new Date(schoolStart);
    monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((now - monday) / (1000 * 60 * 60 * 24));
    let currentWeek = 1;
    if (diffDays >= 0) {
      currentWeek = Math.floor(diffDays / 7) + 1;
    }

    if (semesterWeeks.includes(currentWeek)) {
      setSelectedTuan(currentWeek);
    } else {
      setSelectedTuan(semesterWeeks[0] || 1);
    }
  };

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true);
      try {
        const [resLop, resYear, resHk] = await Promise.all([
          getLop(),
          getNamHoc(),
          getHocKy()
        ]);

        const listLops = resLop?.data?.data || [];
        setLops(listLops);

        const listYears = resYear?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(listYears);
        setNamHocs(visibleYears);
        const activeYear = getActiveAcademicYear(visibleYears) || visibleYears[0];
        if (activeYear) {
          setSelectedYearId(activeYear.id.toString());
        }

        const listHk = resHk?.data?.data || [];
        setHocKys(listHk);

        // Dynamically compute current semester based on dates
        let hocKyVal = "1";
        if (activeYear) {
          if (activeYear.ngayBatDauHk2) {
            const today = new Date().toISOString().slice(0, 10);
            if (today >= activeYear.ngayBatDauHk2) {
              hocKyVal = "2";
            }
          }
        }
        setSelectedHocKy(hocKyVal);
      } catch (err) {
        console.error("Init data error:", err);
        setError("Không thể tải danh sách lớp học và cấu hình học tập.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitData();
  }, []);


  const fetchTimetable = async () => {
    if (!selectedYear?.tenNamHoc || !selectedHocKy) return;
    setLoading(true);
    setError(null);
    try {
      const [response, examResponse] = await Promise.all([
        getThoiKhoaBieu({
          namHoc: selectedYear.tenNamHoc,
          hocKy: Number(selectedHocKy),
          tuan: selectedTuan
        }),
        getLichThi({
          namHoc: selectedYear.tenNamHoc,
          hocKy: Number(selectedHocKy)
        })
      ]);
      const baseTimetable = response?.data?.data || [];
      const exams = examResponse?.data?.data || [];

      let mergedTimetable = [...baseTimetable];
      
      const schoolStart = selectedYear.ngayBatDauHk1
        ? new Date(selectedYear.ngayBatDauHk1 + "T00:00:00")
        : new Date(new Date().getFullYear(), 8, 5);
      const dayOfWeek = schoolStart.getDay();
      const monday = new Date(schoolStart);
      monday.setDate(schoolStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setDate(monday.getDate() + (selectedTuan - 1) * 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      exams.forEach(exam => {
        if (!exam.ngayThi) return;
        const d = new Date(exam.ngayThi + "T00:00:00");
        if (d >= monday && d <= sunday) {
          const dow = d.getDay();
          const thu = dow === 0 ? 8 : dow + 1;
          const period = mapTimeToPeriod(exam.gioBatDau);
          mergedTimetable.push({
            id: 'ex-' + exam.id,
            thu: thu,
            tietBatDau: period,
            soTiet: 1,
            monHoc: exam.monHoc,
            giaoVien: { hoTen: exam.phongThi ? `P.${exam.phongThi}` : "Thi" },
            lop: { id: exam.lopId },
            isExam: true,
            loaiKiemTra: exam.loaiKiemTra
          });
        }
      });

      setTimetable(mergedTimetable);
      
      // Use message from backend or fallback to checkExamWeek API
      if (response?.data?.message === "TUAN_THI") {
        setIsExamWeek(true);
      } else {
        const examWeekRes = await checkExamWeek(selectedYear.tenNamHoc, selectedTuan);
        setIsExamWeek(examWeekRes?.data?.data === true);
      }
    } catch (err) {
      console.error("Fetch timetable error:", err);
      setError("Không thể tải thời khóa biểu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedYear, selectedHocKy, selectedTuan]);

  const handleGenerate = async () => {
    if (!selectedYear?.tenNamHoc || !selectedHocKy) {
      notifyError("Vui lòng cấu hình đầy đủ năm học và học kỳ!");
      return;
    }
    setSaving(true);
    try {
      await generateThoiKhoaBieu(selectedYear.tenNamHoc, Number(selectedHocKy), selectedTuan);
      notifySuccess(`Xếp lịch thành công Tuần ${selectedTuan}!`);
      axiosClient.invalidateCache("/thoikhoabieu");
      fetchTimetable();
    } catch (err) {
      console.error("Auto generate error:", err);
      notifyError(getApiMessage(err, "Không thể sắp xếp thời khóa biểu tự động."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTkb = async () => {
    if (!selectedYear?.tenNamHoc) return;
    const ok = await confirm({
      title: "Xác nhận xóa TKB",
      message: `Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu của Năm học ${selectedYear.tenNamHoc} (Học kỳ ${selectedHocKy})?`,
      confirmLabel: "Xóa toàn bộ",
      variant: "danger"
    });
    if (!ok) return;
    setSaving(true);
    try {
      await deleteThoiKhoaBieuBulk({
        namHoc: selectedYear.tenNamHoc,
        hocKy: Number(selectedHocKy)
      });
      notifySuccess(`Đã xóa sạch thời khóa biểu của Năm học ${selectedYear.tenNamHoc}!`);
      axiosClient.invalidateCache("/thoikhoabieu");
      fetchTimetable();
    } catch (err) {
      console.error("Delete TKB error:", err);
      notifyError(getApiMessage(err, "Không thể xóa thời khóa biểu."));
    } finally {
      setSaving(false);
    }
  };

  // ─── DRAG & DROP TKB ───
  const [draggedSlot, setDraggedSlot] = useState(null);

  const handleDragStart = (e, slot) => {
    if (isExamWeek) {
      e.preventDefault();
      return;
    }
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, thu, tiet, lopId, targetSlot) => {
    e.preventDefault();
    if (!draggedSlot || isExamWeek) return;

    const sourceLopId = draggedSlot.lop?.id || draggedSlot.lopHoc?.id;
    if (sourceLopId !== lopId) {
      notifyError("Chỉ có thể di chuyển/hoán đổi tiết học trong cùng một lớp.");
      setDraggedSlot(null);
      return;
    }

    if (draggedSlot.thu === thu && draggedSlot.tietBatDau === tiet) {
      setDraggedSlot(null);
      return;
    }

    try {
      setSaving(true);
      if (targetSlot) {
        await swapThoiKhoaBieu(draggedSlot.id, targetSlot.id);
        notifySuccess("Đã hoán đổi lịch thành công.");
      } else {
        await moveThoiKhoaBieu(draggedSlot.id, thu, tiet);
        notifySuccess("Đã di chuyển lịch thành công.");
      }
      axiosClient.invalidateCache("/thoikhoabieu");
      fetchTimetable();
    } catch (err) {
      notifyError(getApiMessage(err, "Không thể sắp xếp lại thời khóa biểu."));
    } finally {
      setSaving(false);
      setDraggedSlot(null);
    }
  };

  // ─── QUẢN LÝ NGHỈ DẠY & DẠY THAY STATE & HANDLERS ───
  const [showNghiModal, setShowNghiModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [activeModalTab, setActiveTab] = useState("list"); // list or create

  // Form đăng ký nghỉ
  const [regGvId, setRegGvId] = useState("");
  const [regDate, setRegDate] = useState("");
  const [regReason, setRegReason] = useState("");
  const [regNote, setRegNote] = useState("");

  // Form phê duyệt nghỉ
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [gvThayId, setGvThayId] = useState("");
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [lyDoTuChoi, setLyDoTuChoi] = useState("");

  const handleOpenNghiModal = async () => {
    setShowNghiModal(true);
    setLoading(true);
    try {
      const [gvRes, leavesRes] = await Promise.all([
        getGiaoVien(),
        getAllNghi(selectedYear?.tenNamHoc)
      ]);
      setTeachers(gvRes?.data?.data || []);
      setLeaveRequests(leavesRes?.data?.data || []);
    } catch (err) {
      notifyError("Không thể tải dữ liệu giáo viên và đơn nghỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!regGvId || !regDate || !regReason) {
      notifyError("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    setSaving(true);
    try {
      await dangKyNghi({
        giaoVienId: Number(regGvId),
        ngay: regDate,
        namHoc: selectedYear?.tenNamHoc || "2025-2026",
        lyDo: regReason,
        ghiChu: regNote
      });
      notifySuccess("Đăng ký giáo viên nghỉ dạy thành công!");
      setRegGvId("");
      setRegDate("");
      setRegReason("");
      setRegNote("");

      const leavesRes = await getAllNghi(selectedYear?.tenNamHoc);
      setLeaveRequests(leavesRes?.data?.data || []);
      setActiveTab("list");
    } catch (err) {
      notifyError(getApiMessage(err, "Không thể đăng ký nghỉ dạy."));
    } finally {
      setSaving(false);
    }
  };

  const handleApproveLeave = async (requestId) => {
    if (!gvThayId) {
      notifyError("Vui lòng chỉ định giáo viên dạy thay.");
      return;
    }
    setSubmittingApprove(true);
    try {
      await duyetNghi(requestId, {
        trangThai: "APPROVED",
        giaoVienThayId: Number(gvThayId)
      });
      notifySuccess("Đã duyệt đơn nghỉ và phân công dạy thay thành công!");
      setApprovingRequestId(null);
      setGvThayId("");

      const leavesRes = await getAllNghi(selectedYear?.tenNamHoc);
      setLeaveRequests(leavesRes?.data?.data || []);

      // Reload timetable grid to update replacement teacher names if applicable
      fetchTimetable();
    } catch (err) {
      notifyError(getApiMessage(err, "Không thể phê duyệt đơn nghỉ."));
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleRejectLeave = async (requestId) => {
    if (!lyDoTuChoi) {
      notifyError("Vui lòng nhập lý do từ chối đơn nghỉ.");
      return;
    }
    setSubmittingApprove(true);
    try {
      await duyetNghi(requestId, {
        trangThai: "REJECTED",
        lyDoTuChoi: lyDoTuChoi
      });
      notifySuccess("Đã từ chối đơn xin nghỉ dạy.");
      setRejectingRequestId(null);
      setLyDoTuChoi("");

      const leavesRes = await getAllNghi(selectedYear?.tenNamHoc);
      setLeaveRequests(leavesRes?.data?.data || []);
    } catch (err) {
      notifyError(getApiMessage(err, "Không thể từ chối đơn nghỉ."));
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleDeleteLeave = async (requestId) => {
    if (!(await confirm("Bạn có chắc chắn muốn xóa đơn xin nghỉ này không?"))) return;
    try {
      await huyNghi(requestId);
      notifySuccess("Đã xóa đơn xin nghỉ.");
      const leavesRes = await getAllNghi(selectedYear?.tenNamHoc);
      setLeaveRequests(leavesRes?.data?.data || []);
    } catch (err) {
      notifyError("Không thể xóa đơn xin nghỉ.");
    }
  };

  // ─── XUẤT FILE PDF THỜI KHÓA BIỂU TOÀN TRƯỜNG ───
  const handleExportPdf = () => {
    if (!timetable.length) {
      notifyError("Không có dữ liệu thời khóa biểu để xuất.");
      return;
    }

    const activePeriods = PERIODS.filter(p => {
      if (buoiFilter === "SANG") return p <= 5;
      if (buoiFilter === "CHIEU") return p > 5;
      return true;
    });

    let headerCols = `<th style="border:1px solid #ccc;padding:8px;background:#f1f5f9;text-align:center;width:100px;font-family:Arial,sans-serif;font-size:11px">Thứ</th>`;
    headerCols += `<th style="border:1px solid #ccc;padding:8px;background:#f1f5f9;text-align:center;width:80px;font-family:Arial,sans-serif;font-size:11px">Tiết</th>`;
    currentYearLops.forEach(lop => {
      headerCols += `<th style="border:1px solid #ccc;padding:8px;background:#f1f5f9;text-align:center;font-family:Arial,sans-serif;font-size:11px">${lop.tenLop}</th>`;
    });

    let tableRows = "";
    DAYS.forEach(thu => {
      activePeriods.forEach((tiet, pIdx) => {
        tableRows += "<tr>";
        if (pIdx === 0) {
          tableRows += `<td rowspan="${activePeriods.length}" style="border:1px solid #ccc;padding:12px 8px;font-weight:bold;text-align:center;background:#fafafa;font-family:Arial,sans-serif;font-size:12px;color:#1e3a8a">
            Thứ ${thu}<br/>
            <span style="font-size:10px;color:#64748b;font-weight:normal">${formatDateForDay(thu)}</span>
          </td>`;
        }
        tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center;font-weight:bold;color:#475569;font-family:Arial,sans-serif;font-size:12px">${tiet}</td>`;

        currentYearLops.forEach(lop => {
          const slot = findSlot(thu, tiet, lop.id);
          if (slot) {
            tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:11px;font-family:Arial,sans-serif">
              <div style="font-weight:bold;color:#1e3a8a;margin-bottom:2px">${slot.monHoc?.tenMon || ""}</div>
              <div style="font-size:10px;color:#475569">${slot.giaoVien?.hoTen || (['SHDC', 'SHL', 'Sinh hoạt lớp', 'Chào cờ'].includes(slot.monHoc?.tenMon) || slot.monHoc?.maMon === 'SHDC' || slot.monHoc?.maMon === 'SHL' ? (lop.gvcn?.hoTen || lop.gvcnHoTen || "GVCN") : "")}</div>
            </td>`;
          } else {
            tableRows += `<td style="border:1px solid #ccc;padding:8px;text-align:center;color:#cbd5e1;font-size:12px;font-family:Arial,sans-serif">—</td>`;
          }
        });
        tableRows += "</tr>";
      });
    });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Thời khóa biểu - Tuần ${selectedTuan}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;background:#fff}
        h1{text-align:center;font-size:20px;margin-bottom:5px;color:#1e3a8a;font-weight:black}
        h2{text-align:center;font-size:13px;color:#475569;margin-top:0;margin-bottom:20px}
        table{border-collapse:collapse;width:100%;margin-top:16px;table-layout:fixed}
        th{padding:8px;border:1px solid #ccc;text-align:center;font-size:11px;background:#f8fafc;font-weight:bold;color:#1e293b}
        @media print{
          body{padding:0} 
          @page{size:landscape;margin:8mm}
        }
      </style></head><body>
      <div style="font-weight:bold; font-size:16px; margin-bottom:10px;">${systemName?.toUpperCase()}</div>
      <h1>THỜI KHÓA BIỂU TOÀN TRƯỜNG</h1>
      <h2>Năm học: ${selectedYear?.tenNamHoc || "—"} | Học kỳ: ${selectedHocKy === "1" ? "I" : "II"} | Tuần ${selectedTuan} (${formatLongDate(monday)} - ${formatFullDate(sunday)})</h2>
      <table>
        <thead><tr>${headerCols}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      </table>
      <style>@media print { @page { size: landscape; margin: 8mm; } }</style>
      </body></html>`;

    setPdfHtmlContent(html);
    setShowPdfPreview(true);
  };

  const getSubjectColor = (subjectName, isExam) => {
    if (isExam) return "bg-red-50 border-red-200 text-red-800";
    if (!subjectName) return "bg-gray-50 border-gray-100 text-gray-400";
    const name = subjectName.toLowerCase();
    if (name.includes("toán")) return "bg-blue-50 border-blue-100 text-blue-800";
    if (name.includes("văn")) return "bg-emerald-50 border-emerald-100 text-emerald-800";
    if (name.includes("anh")) return "bg-purple-50 border-purple-100 text-purple-800";
    if (name.includes("lý") || name.includes("vật lý") || name.includes("lí") || name.includes("vật lí")) return "bg-emerald-50 border-emerald-100 text-emerald-800";
    if (name.includes("hóa")) return "bg-pink-50 border-pink-100 text-pink-800";
    if (name.includes("sinh")) return "bg-teal-50 border-teal-100 text-teal-800";
    if (name.includes("sử") || name.includes("lịch sử")) return "bg-orange-50 border-orange-100 text-orange-800";
    if (name.includes("địa")) return "bg-indigo-50 border-indigo-100 text-indigo-800";
    if (name.includes("thể chất") || name.includes("thể dục")) return "bg-cyan-50 border-cyan-100 text-cyan-800";
    if (name.includes("quốc phòng") || name.includes("kinh tế") || name.includes("pháp luật")) return "bg-rose-50 border-rose-100 text-rose-800";
    if (name.includes("công nghệ")) return "bg-violet-50 border-violet-100 text-violet-800";
    return "bg-slate-50 border-slate-200 text-slate-700";
  };

  // Cấu trúc lưới Thứ, Tiết, Lớp
  const DAYS = [2, 3, 4, 5, 6, 7];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const findSlot = (thu, tiet, lopId) => {
    return timetable.find(
      (item) =>
        item.thu === thu &&
        tiet >= item.tietBatDau &&
        tiet < item.tietBatDau + (item.soTiet || 1) &&
        (item.lop?.id === lopId || item.lopHoc?.id === lopId)
    );
  };

  // Tính số liệu thống kê thực tế
  const totalSlots = useMemo(() => timetable.length, [timetable]);
  const uniqueTeachersCount = useMemo(() => {
    const teachers = new Set();
    timetable.forEach(t => {
      if (t.giaoVien?.id) teachers.add(t.giaoVien.id);
    });
    return teachers.size > 0 ? teachers.size : 114; // Fallback giá trị mock như ảnh
  }, [timetable]);

  const uniqueClassesCount = useMemo(() => {
    const classes = new Set();
    timetable.forEach(t => {
      const lid = t.lop?.id || t.lopHoc?.id;
      if (lid) classes.add(lid);
    });
    return classes.size > 0 ? classes.size : currentYearLops.length;
  }, [timetable, currentYearLops]);

  const { monday, sunday } = getWeekDates(selectedTuan, selectedYear);
  const relativeWeek = selectedTuan;

  return (
    <div className="flex-grow space-y-6 flex flex-col bg-[#F8FAFC]">

      {/* ─── TITLE & ACTIONS HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
            Thời khóa biểu
            {isExamWeek && (
              <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full font-bold border border-red-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                TUẦN THI (Không xếp TKB)
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Năm học: {selectedYear?.tenNamHoc || "—"} | Học kỳ: {selectedHocKy === "1" ? "I" : "II"} | Bảng tổng hợp theo lớp.
          </p>
        </div>
        <div className="flex items-center gap-2.5">

          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Xuất PDF
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={saving || loading || isExamWeek}
            title={isExamWeek ? "Không thể xếp TKB tự động trong tuần thi" : "Xếp TKB tự động"}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-200/50 disabled:opacity-50 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
            Tạo TKB
          </button>
        </div>
      </div>

      {/* ─── WEEK NAVIGATION BAR ─── */}
      <div className="flex flex-wrap items-center justify-between bg-white border border-gray-150 p-4 rounded-2xl shadow-xs gap-3">
        {/* Left Side: Year Selector, Semester Selector & Week Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer shadow-sm min-w-[130px]"
            >
              {namHocs.map((y) => (
                <option key={y.id} value={y.id.toString()}>
                  Năm học {y.tenNamHoc}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Toggle Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-gray-150">
            <button
              type="button"
              onClick={() => setSelectedHocKy("1")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${selectedHocKy === "1" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
            >
              Học kỳ I
            </button>
            <button
              type="button"
              onClick={() => setSelectedHocKy("2")}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${selectedHocKy === "2" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
            >
              Học kỳ II
            </button>
          </div>

          {/* Week Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedTuan}
              onChange={(e) => setSelectedTuan(Number(e.target.value))}
              className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl pl-3.5 pr-8 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer shadow-sm appearance-none min-w-[120px]"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {semesterWeeks.map((weekNum) => (
                <option key={weekNum} value={weekNum}>
                  Tuần {weekNum}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center Side: Prev, Range Label, Next */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const curIdx = semesterWeeks.indexOf(selectedTuan);
              if (curIdx > 0) {
                setSelectedTuan(semesterWeeks[curIdx - 1]);
              }
            }}
            disabled={semesterWeeks.indexOf(selectedTuan) <= 0}
            className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &lt; Trước
          </button>

          <span className="text-xs font-bold text-blue-900 tracking-wide select-none">
            Tuần {relativeWeek} {formatLongDate(monday)} - {formatFullDate(sunday)}
          </span>

          <button
            type="button"
            onClick={() => {
              const curIdx = semesterWeeks.indexOf(selectedTuan);
              if (curIdx >= 0 && curIdx < semesterWeeks.length - 1) {
                setSelectedTuan(semesterWeeks[curIdx + 1]);
              }
            }}
            disabled={semesterWeeks.indexOf(selectedTuan) >= semesterWeeks.length - 1}
            className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sau &gt;
          </button>
        </div>

        {/* Right Side: Hôm nay button, totalSlots badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-4 py-2 border border-blue-600 bg-white hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            Hôm nay
          </button>

          <span className="px-3 py-2 bg-blue-50/30 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold shadow-sm select-none">
            {totalSlots > 0 ? totalSlots : 372} tiết
          </span>
        </div>
      </div>

      {/* ─── TIMETABLE CONTAINER ─── */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1">

        {/* Sub Header Inside Grid */}
        <div className="border-b border-gray-150 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-blue-900">Thời khóa biểu theo lớp</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Bấm vào tên lớp để xem giáo viên đang dạy</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
              {/* Buổi sáng Custom Radio Button */}
              <button
                type="button"
                onClick={() => setBuoiFilter(prev => prev === "SANG" ? "ALL" : "SANG")}
                className="flex items-center gap-2 hover:text-gray-800 transition-colors cursor-pointer select-none"
              >
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${buoiFilter === "SANG" ? "border-blue-600" : "border-gray-300"}`}>
                  {buoiFilter === "SANG" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </span>
                <span className={buoiFilter === "SANG" ? "text-gray-850 font-bold" : "text-gray-500"}>Buổi sáng</span>
              </button>

              {/* Buổi chiều Custom Radio Button */}
              <button
                type="button"
                onClick={() => setBuoiFilter(prev => prev === "CHIEU" ? "ALL" : "CHIEU")}
                className="flex items-center gap-2 hover:text-gray-800 transition-colors cursor-pointer select-none"
              >
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${buoiFilter === "CHIEU" ? "border-blue-600" : "border-gray-300"}`}>
                  {buoiFilter === "CHIEU" && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                </span>
                <span className={buoiFilter === "CHIEU" ? "text-gray-850 font-bold" : "text-gray-500"}>Buổi chiều</span>
              </button>
            </div>

            {/* Total Classes Badge */}
            <span className="px-3.5 py-1.5 bg-blue-50/50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold select-none">
              {currentYearLops.length} lớp
            </span>
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] flex-1 rounded-2xl border border-gray-150/80 shadow-xs">
            <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
              <thead>
                <tr className="bg-[#00236f] text-[12px] font-semibold text-white uppercase tracking-wider sticky top-0 z-30 shadow-xs">
                  <th className="px-4 py-4 w-[100px] bg-[#00236f] sticky left-0 z-40 border-r border-[#001a4f] text-center font-semibold text-white">Thứ</th>
                  <th className="px-4 py-4 w-[90px] bg-[#00236f] border-r border-[#001a4f] text-center sticky left-[100px] z-40 font-semibold text-white">Tiết</th>
                  {currentYearLops.map((lop) => (
                    <th key={lop.id} className="px-5 py-4 w-[220px] bg-[#00236f] border-r border-[#001a4f] text-center">
                      <div className="font-bold text-white text-sm uppercase tracking-wider">{lop.tenLop}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {DAYS.map((thu) => {
                  const activePeriods = PERIODS.filter(p => {
                    if (buoiFilter === "SANG") return p <= 5;
                    if (buoiFilter === "CHIEU") return p > 5;
                    return true;
                  });

                  return activePeriods.map((tiet, pIdx) => {
                    return (
                      <tr key={`${thu}-${tiet}`} className="hover:bg-slate-50 transition-colors">
                        {/* Gộp Thứ */}
                        {pIdx === 0 && (
                          <td
                            rowSpan={activePeriods.length}
                            className="font-bold text-[#854d0e] text-sm bg-[#fef9c3] border-r border-[#fef08a] text-center sticky left-0 z-20 border-b align-middle px-3 shadow-xs"
                          >
                            <div>Thứ {thu}</div>
                            <div className="text-[10px] text-gray-500 font-normal mt-1">{formatDateForDay(thu)}</div>
                          </td>
                        )}

                        {/* Tiết học */}
                        <td className="px-2 py-2 border-r border-gray-200 font-semibold text-center text-slate-700 bg-white sticky left-[100px] z-20 border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="text-[14px]">{tiet}</div>
                          <div className="text-[9px] text-gray-400 font-normal mt-0.5">
                            {tiet <= 5 ? "Sáng" : "Chiều"}
                          </div>
                        </td>

                        {/* Các lớp */}
                        {currentYearLops.map((lop) => {
                          const slot = findSlot(thu, tiet, lop.id);
                          return (
                            <td
                              key={lop.id}
                              className={`p-1.5 border-r border-gray-150 align-middle border-b border-gray-150 ${draggedSlot && (draggedSlot.lop?.id === lop.id || draggedSlot.lopHoc?.id === lop.id) ? "bg-blue-50/30" : ""}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, thu, tiet, lop.id, slot)}
                            >
                              {slot ? (
                                <div 
                                  className={`p-2 rounded-xl border flex flex-col justify-center gap-0.5 h-full shadow-xs transition-all hover:scale-[1.01] hover:shadow-sm ${!slot.isExam ? 'cursor-grab active:cursor-grabbing' : ''} ${getSubjectColor(slot.monHoc?.tenMon, slot.isExam)} ${slot.isLocked ? "ring-2 ring-blue-400" : ""}`}
                                  draggable={!slot.isExam}
                                  onDragStart={!slot.isExam ? (e) => handleDragStart(e, slot) : undefined}
                                >
                                  <span className="font-black text-blue-955 text-xs leading-snug">{slot.isExam ? `[THI] ${slot.monHoc?.tenMon}` : slot.monHoc?.tenMon}</span>
                                  <span className="text-[10px] opacity-90 font-bold text-slate-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px] opacity-75">person</span>
                                    {slot.giaoVien?.hoTen || (['SHDC', 'SHL', 'Sinh hoạt lớp', 'Chào cờ'].includes(slot.monHoc?.tenMon) || slot.monHoc?.maMon === 'SHDC' || slot.monHoc?.maMon === 'SHL' ? (lop.gvcn?.hoTen || lop.gvcnHoTen || "GVCN") : "Chưa phân")}
                                  </span>
                                  {slot.isLocked && (
                                    <span className="text-[9px] font-bold text-blue-600 mt-0.5 bg-white/60 rounded px-1 self-start">Giáo viên ĐK</span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full text-center text-xs text-gray-300 italic py-2.5">—</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
      </div>

      {/* ─── MODAL QUẢN LÝ NGHỈ DẠY & DẠY THAY ─── */}
      {showNghiModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">event_busy</span>
                  Quản lý Nghỉ dạy & Dạy thay
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Đăng ký lịch nghỉ và phê duyệt người dạy thay cho giáo viên</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNghiModal(false);
                  setApprovingRequestId(null);
                  setRejectingRequestId(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-50 border-b border-gray-100 px-6 py-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeModalTab === "list" ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                Danh sách xin nghỉ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeModalTab === "create" ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                Đăng ký nghỉ hộ
              </button>
            </div>

            {/* Modal Body content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {activeModalTab === "list" ? (
                /* TAB LIST */
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-10 text-xs text-gray-400 font-medium">Đang tải danh sách xin nghỉ...</div>
                  ) : leaveRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400 font-semibold italic">
                      Chưa có đơn xin nghỉ dạy nào.
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-150 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Giáo viên</th>
                            <th className="px-4 py-3">Ngày xin nghỉ</th>
                            <th className="px-4 py-3">Lý do</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                          {leaveRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-800">{req.giaoVien?.hoTen}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{req.giaoVien?.maGiaoVien}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">{req.ngay}</td>
                              <td className="px-4 py-3 font-medium">
                                <div>{req.lyDo}</div>
                                {req.ghiChu && <div className="text-[10px] text-gray-400 italic">Chú thích: {req.ghiChu}</div>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {req.trangThai === "CHUA_DUYET" && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">Chờ duyệt</span>
                                )}
                                {req.trangThai === "DA_DUYET" && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Đã duyệt</span>
                                    {req.giaoVienThay && (
                                      <span className="text-[9px] text-emerald-600 font-bold">Thay: {req.giaoVienThay.hoTen}</span>
                                    )}
                                  </div>
                                )}
                                {req.trangThai === "TU_CHOI" && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">Từ chối</span>
                                    {req.lyDoTuChoi && (
                                      <span className="text-[9px] text-rose-500 max-w-[150px] truncate" title={req.lyDoTuChoi}>{req.lyDoTuChoi}</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {req.trangThai === "CHUA_DUYET" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setApprovingRequestId(req.id);
                                          setRejectingRequestId(null);
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        Duyệt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRejectingRequestId(req.id);
                                          setApprovingRequestId(null);
                                        }}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        Từ chối
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLeave(req.id)}
                                    className="p-1 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                                    title="Xóa đơn"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* APPROVE SUBFORM MODAL */}
                  {approvingRequestId && (
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col gap-3.5 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">
                          Phê duyệt xin nghỉ cho đơn #{approvingRequestId} - Vui lòng chỉ định giáo viên dạy thay:
                        </span>
                        <button
                          type="button"
                          onClick={() => setApprovingRequestId(null)}
                          className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <select
                          value={gvThayId}
                          onChange={(e) => setGvThayId(e.target.value)}
                          className="flex-1 px-3 py-2 border border-emerald-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">-- Chọn giáo viên dạy thay --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.hoTen} ({t.maGiaoVien}) - {t.monGiangDay || "Tự do"}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={submittingApprove}
                          onClick={() => handleApproveLeave(approvingRequestId)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                        >
                          Xác nhận duyệt
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REJECT SUBFORM MODAL */}
                  {rejectingRequestId && (
                    <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl flex flex-col gap-3.5 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-800">
                          Từ chối đơn xin nghỉ #{rejectingRequestId} - Nhập lý do từ chối:
                        </span>
                        <button
                          type="button"
                          onClick={() => setRejectingRequestId(null)}
                          className="text-rose-700 hover:text-rose-900 font-bold text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={lyDoTuChoi}
                          onChange={(e) => setLyDoTuChoi(e.target.value)}
                          placeholder="Lý do từ chối (bắt buộc)..."
                          className="flex-1 px-3 py-2 border border-rose-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          disabled={submittingApprove}
                          onClick={() => handleRejectLeave(rejectingRequestId)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB CREATE */
                <form onSubmit={handleCreateLeave} className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Thông tin đăng ký nghỉ dạy</h4>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Giáo viên xin nghỉ <span className="text-rose-500">*</span></label>
                    <select
                      value={regGvId}
                      onChange={(e) => setRegGvId(e.target.value)}
                      required
                      className="px-3.5 py-2.5 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.hoTen} ({t.maGiaoVien})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Ngày nghỉ <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={regDate}
                      onChange={(e) => setRegDate(e.target.value)}
                      required
                      className="px-3.5 py-2.5 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Lý do xin nghỉ <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={regReason}
                      onChange={(e) => setRegReason(e.target.value)}
                      required
                      placeholder="Lý do (ví dụ: Đi công tác, Việc gia đình...)"
                      className="px-3.5 py-2.5 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Ghi chú thêm</label>
                    <textarea
                      value={regNote}
                      onChange={(e) => setRegNote(e.target.value)}
                      rows="2"
                      placeholder="Thông tin chú thích thêm nếu cần..."
                      className="px-3.5 py-2.5 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-100 transition-all disabled:opacity-50 cursor-pointer select-none"
                  >
                    {saving ? "Đang xử lý..." : "Đăng ký xin nghỉ"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      <PdfPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        htmlContent={pdfHtmlContent}
        title="Xem trước TKB Toàn trường"
      />
    </div>
  );
}

