import React, { useEffect, useState, useMemo } from "react";
import { Plus, Save, RotateCcw, CheckCircle, Lock, Trash2 } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createNamHoc,
  getNamHoc,
  updateNamHoc,
  deleteNamHoc,
} from "../../../api/namhocApi.js";
import { createHocKy, getHocKy } from "../../../api/hockyApi.js";
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from "../../../utils/notify.js";

const emptyConfig = {
  hk1Start: "",
  hk1End: "",
  hk1Deadline: "",
  hk2Start: "",
  hk2End: "",
  hk2Deadline: "",
};

const toDateOnly = (value) => (value ? String(value).slice(0, 10) : "");

const readField = (item, ...keys) => {
  for (const key of keys) {
    if (item?.[key]) return item[key];
  }
  return "";
};

const parseStartYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/(\d{4})/);
  return match ? Number(match[1]) : null;
};

const inferConfigFromYearName = (tenNamHoc) => {
  const start = parseStartYear(tenNamHoc);
  if (!start) return { ...emptyConfig };
  const makeDate = (y, m, d) =>
    new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  const fmt = (dt) => dt.toISOString().slice(0, 10);
  const hk1Start = makeDate(start, 9, 5);
  const hk1End = makeDate(start + 1, 1, 4);
  const hk1Deadline = new Date(hk1End.getTime() - 5 * 24 * 60 * 60 * 1000);
  const hk2Start = makeDate(start + 1, 1, 5);
  const hk2End = makeDate(start + 1, 5, 31);
  const hk2Deadline = new Date(hk2End.getTime() - 5 * 24 * 60 * 60 * 1000);
  return {
    hk1Start: fmt(hk1Start),
    hk1End: fmt(hk1End),
    hk1Deadline: fmt(hk1Deadline),
    hk2Start: fmt(hk2Start),
    hk2End: fmt(hk2End),
    hk2Deadline: fmt(hk2Deadline),
  };
};

const toFormFromYear = (year) => ({
  hk1Start: toDateOnly(readField(year, "ngayBatDauHk1", "ngay_bat_dau_hk1")),
  hk1End: toDateOnly(readField(year, "ngayKetThucHk1", "ngay_ket_thuc_hk1")),
  hk1Deadline: toDateOnly(readField(year, "deadlineNhapDiemHk1", "deadline_nhap_diem_hk1")),
  hk2Start: toDateOnly(readField(year, "ngayBatDauHk2", "ngay_bat_dau_hk2")),
  hk2End: toDateOnly(readField(year, "ngayKetThucHk2", "ngay_ket_thuc_hk2")),
  hk2Deadline: toDateOnly(readField(year, "deadlineNhapDiemHk2", "deadline_nhap_diem_hk2")),
});

const buildPayload = ({ tenNamHoc, form, trangThai = "DANG_MO" }) => ({
  tenNamHoc: tenNamHoc.trim(),
  ngayBatDauHk1: form.hk1Start,
  ngayKetThucHk1: form.hk1End,
  deadlineNhapDiemHk1: form.hk1Deadline,
  ngayBatDauHk2: form.hk2Start,
  ngayKetThucHk2: form.hk2End,
  deadlineNhapDiemHk2: form.hk2Deadline,
  trangThai,
});

const validateConfig = (form) => {
  const required = [
    ["hk1Start", "Ngày bắt đầu học kỳ I"],
    ["hk1End", "Ngày kết thúc học kỳ I"],
    ["hk1Deadline", "Hạn chót nhập điểm học kỳ I"],
    ["hk2Start", "Ngày bắt đầu học kỳ II"],
    ["hk2End", "Ngày kết thúc học kỳ II"],
    ["hk2Deadline", "Hạn chót nhập điểm học kỳ II"],
  ];

  const missing = required.find(([key]) => !form[key]);
  if (missing) return `Vui lòng nhập ${missing[1].toLowerCase()}.`;

  if (form.hk1Start > form.hk1End) return "Ngày bắt đầu học kỳ I phải trước ngày kết thúc.";
  if (form.hk2Start > form.hk2End) return "Ngày bắt đầu học kỳ II phải trước ngày kết thúc.";

  const diffDays = (later, earlier) => {
    if (!later || !earlier) return Infinity;
    const ms = new Date(later).setHours(0, 0, 0, 0) - new Date(earlier).setHours(0, 0, 0, 0);
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  };

  if (diffDays(form.hk1End, form.hk1Deadline) < 5)
    return "Hạn chót nhập điểm học kỳ I phải trước ngày kết thúc ít nhất 5 ngày.";
  if (diffDays(form.hk2End, form.hk2Deadline) < 5)
    return "Hạn chót nhập điểm học kỳ II phải trước ngày kết thúc ít nhất 5 ngày.";

  return "";
};

export default function NamHocHocKyPage() {
  const [years, setYears] = useState([]);
  const [hocKyList, setHocKyList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyConfig });
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createYearName, setCreateYearName] = useState("");
  const [createForm, setCreateForm] = useState({ ...emptyConfig });
  const [isManualForm, setIsManualForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, year: null });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [yRes, hkRes] = await Promise.all([getNamHoc(), getHocKy()]);
        if (!active) return;
        const yData = (yRes?.data?.data || []).sort((a, b) => b.tenNamHoc.localeCompare(a.tenNamHoc));
        setYears(yData);
        setHocKyList(hkRes?.data?.data || []);
        if (yData.length) {
          const activeYear = yData.find((y) => (y.trangThai || y.trang_thai) === "DANG_MO");
          setSelectedYear(activeYear || yData[0]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedYear) { setForm({ ...emptyConfig }); return; }
    setForm(toFormFromYear(selectedYear));
  }, [selectedYear]);

  const openCreateModal = () => {
    setCreateOpen(true);
    setCreateError("");
    setCreateYearName("");
    setCreateForm({ ...emptyConfig });
    setIsManualForm(false);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateError("");
    setCreateYearName("");
    setCreateForm({ ...emptyConfig });
    setIsManualForm(false);
  };

  const handleCreateYearNameChange = (value) => {
    setCreateYearName(value);
    if (!isManualForm) {
      setCreateForm(inferConfigFromYearName(value));
    }
  };

  const handleCreateYear = async (event) => {
    event.preventDefault();
    setCreateError("");

    const trimmedName = createYearName.trim();
    if (!trimmedName) { setCreateError("Vui lòng nhập tên năm học."); return; }

    const yearPattern = /^(\d{4})-(\d{4})$/;
    const yearMatch = trimmedName.match(yearPattern);
    if (!yearMatch) {
      setCreateError("Năm học phải có định dạng YYYY-YYYY (vd: 2025-2026).");
      return;
    }
    const startYear = Number(yearMatch[1]);
    const endYear = Number(yearMatch[2]);
    if (endYear !== startYear + 1) {
      setCreateError("Năm kết thúc phải lớn hơn năm bắt đầu đúng 1 (vd: 2025-2026).");
      return;
    }
    if (startYear < 2000 || startYear > 2100) {
      setCreateError("Năm học phải nằm trong khoảng 2000-2100.");
      return;
    }

    const duplicate = years.some(
      (y) => (y.tenNamHoc || "").trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) { setCreateError("Năm học đã tồn tại."); return; }

    const configError = validateConfig(createForm);
    if (configError) { setCreateError(configError); return; }

    const payload = buildPayload({ tenNamHoc: trimmedName, form: createForm, trangThai: "DANG_MO" });

    try {
      setCreating(true);
      const openYears = years.filter((y) => (y.trangThai || y.trang_thai) === "DANG_MO");
      for (const y of openYears) {
        await updateNamHoc(y.id, buildPayload({ tenNamHoc: y.tenNamHoc || "", form: toFormFromYear(y), trangThai: "DA_DONG" }));
      }

      const createRes = await createNamHoc(payload);
      const createdYear = createRes?.data?.data;
      if (!createdYear?.id) throw new Error("Thiếu id năm học sau khi tạo mới.");

      let semesterCreateFailed = false;
      try {
        await createHocKy({ tenHocKy: "Học kỳ I", namHoc: { id: createdYear.id } });
        await createHocKy({ tenHocKy: "Học kỳ II", namHoc: { id: createdYear.id } });
      } catch { semesterCreateFailed = true; }

      const [freshYears, freshSemesters] = await Promise.all([getNamHoc(), getHocKy()]);
      const nextYears = (freshYears?.data?.data || []).sort((a, b) => b.tenNamHoc.localeCompare(a.tenNamHoc));
      setYears(nextYears);
      setHocKyList(freshSemesters?.data?.data || []);
      setSelectedYear(nextYears.find((y) => y.id === createdYear.id) || createdYear);
      closeCreateModal();
      semesterCreateFailed
        ? notifyInfo("Đã thêm năm học nhưng tạo học kỳ mặc định chưa hoàn tất.")
        : notifySuccess("Đã thêm năm học mới.");
    } catch {
      setCreateError("Không thể thêm năm học mới. Vui lòng thử lại.");
      notifyError("Không thể thêm năm học mới.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedYear?.id) { notifyError("Vui lòng chọn năm học trước khi lưu."); return; }
    const configError = validateConfig(form);
    if (configError) { notifyError(configError); return; }

    setSaving(true);
    try {
      const payload = buildPayload({
        tenNamHoc: selectedYear.tenNamHoc || "",
        form,
        trangThai: selectedYear.trangThai || selectedYear.trang_thai || "DANG_MO",
      });
      const response = await updateNamHoc(selectedYear.id, payload);
      const updated = response?.data?.data;
      if (!updated) throw new Error("Không có dữ liệu năm học sau khi cập nhật.");
      setYears((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedYear(updated);
      notifySuccess("Đã lưu cấu hình năm học.");
    } catch {
      notifyError("Không thể lưu cấu hình năm học.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (!selectedYear?.tenNamHoc) { notifyError("Không tìm thấy năm học."); return; }
    setForm(inferConfigFromYearName(selectedYear.tenNamHoc));
    notifyInfo("Đã khôi phục mốc thời gian mặc định.");
  };

  const handleSetCurrentYear = async () => {
    if (!selectedYear) return;
    try {
      setSaving(true);
      const openYears = years.filter(
        (y) => (y.trangThai || y.trang_thai) === "DANG_MO" && y.id !== selectedYear.id,
      );
      for (const y of openYears) {
        await updateNamHoc(y.id, buildPayload({ tenNamHoc: y.tenNamHoc || "", form: toFormFromYear(y), trangThai: "DA_DONG" }));
      }
      const res = await updateNamHoc(selectedYear.id, buildPayload({ tenNamHoc: selectedYear.tenNamHoc || "", form: toFormFromYear(selectedYear), trangThai: "DANG_MO" }));
      const updated = res?.data?.data;
      setYears((prev) =>
        prev.map((y) => {
          if (y.id === selectedYear.id) return updated || { ...y, trangThai: "DANG_MO" };
          if ((y.trangThai || y.trang_thai) === "DANG_MO") return { ...y, trangThai: "DA_DONG" };
          return y;
        }),
      );
      if (updated) setSelectedYear(updated);
      notifySuccess(`Đã đặt ${selectedYear.tenNamHoc} làm năm học hiện tại.`);
    } catch {
      notifyError("Không thể cập nhật năm học hiện tại.");
    } finally {
      setSaving(false);
    }
  };

  const handleLockYear = async () => {
    if (!selectedYear) return;
    try {
      setSaving(true);
      const res = await updateNamHoc(selectedYear.id, buildPayload({ tenNamHoc: selectedYear.tenNamHoc || "", form: toFormFromYear(selectedYear), trangThai: "DA_DONG" }));
      const updated = res?.data?.data;
      setYears((prev) =>
        prev.map((y) => (y.id === selectedYear.id ? updated || { ...y, trangThai: "DA_DONG" } : y))
      );
      if (updated) setSelectedYear(updated);
      notifySuccess(`Đã khóa năm học ${selectedYear.tenNamHoc}.`);
    } catch {
      notifyError("Không thể khóa năm học.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (targetYear, e) => {
    e.stopPropagation();
    setDeleteModal({ open: true, year: targetYear });
  };

  const handleDeleteConfirm = async () => {
    const targetYear = deleteModal.year;
    if (!targetYear) return;
    try {
      setSaving(true);
      await deleteNamHoc(targetYear.id);
      const newYears = years.filter((y) => y.id !== targetYear.id);
      setYears(newYears);
      if (selectedYear?.id === targetYear.id) {
        setSelectedYear(newYears[0] || null);
      }
      notifySuccess(`Đã xóa năm học ${targetYear.tenNamHoc}.`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể xóa năm học.";
      notifyError(msg);
    } finally {
      setSaving(false);
      setDeleteModal({ open: false, year: null });
    }
  };

  const getBadgeStatus = (y) => {
    if (y.trangThai === "DANG_MO" || y.trang_thai === "DANG_MO") return { label: "Hiện hành", type: "success" };

    const startYear = parseInt(y.tenNamHoc.split("-")[0]);
    const currentYearObj = years.find(yr => yr.trangThai === "DANG_MO" || yr.trang_thai === "DANG_MO");

    if (!currentYearObj) return { label: "Đã khóa", type: "warning" };

    const currentStart = parseInt(currentYearObj.tenNamHoc.split("-")[0]);
    if (startYear <= currentStart - 2) return { label: "Lưu trữ", type: "neutral" };

    return { label: "Đã khóa", type: "warning" };
  };

  const selectedBadge = selectedYear ? getBadgeStatus(selectedYear) : null;
  const isSelectedOngoing = selectedBadge?.label === "Hiện hành";

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <PageHeader
        title="Năm học & Học kỳ"
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm năm học
          </button>
        }
      />

      <div className="p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">

          {/* CỘT TRÁI: DANH SÁCH NĂM HỌC */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Danh sách năm học</h3>
            {loading ? (
              <div className="text-sm text-slate-500">Đang tải...</div>
            ) : (
              <div className="flex flex-col gap-2">
                {years.map((y) => {
                  const isActive = selectedYear?.id === y.id;
                  const badgeInfo = getBadgeStatus(y);
                  const countHk = hocKyList.filter(hk => hk.namHoc?.id === y.id || hk.nam_hoc_id === y.id).length || 2; // default 2

                  return (
                    <div
                      key={y.id}
                      onClick={() => setSelectedYear(y)}
                      className={`relative group cursor-pointer p-4 rounded-xl border transition-all ${isActive
                        ? "bg-blue-50/50 border-blue-200 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(y, e)}
                        className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa năm học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className={`text-base font-bold ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                        {y.tenNamHoc}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        {badgeInfo.type === 'success' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hiện hành
                          </span>
                        )}
                        {badgeInfo.type === 'warning' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Đã khóa
                          </span>
                        )}
                        {badgeInfo.type === 'neutral' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Lưu trữ
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {countHk} học kỳ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: CHI TIẾT NĂM HỌC */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            {selectedYear ? (
              <>
                {/* Header Chi Tiết */}
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 rounded-t-xl">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-3">
                      {selectedYear.tenNamHoc}
                      {selectedBadge?.type === 'success' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Hiện hành
                        </span>
                      )}
                      {selectedBadge?.type === 'warning' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Đã khóa
                        </span>
                      )}
                      {selectedBadge?.type === 'neutral' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          Lưu trữ
                        </span>
                      )}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSelectedOngoing ? (
                      <button
                        onClick={handleSetCurrentYear}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Đặt làm hiện hành
                      </button>
                    ) : (
                      <button
                        onClick={handleLockYear}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <Lock className="w-4 h-4" /> Khóa năm học
                      </button>
                    )}
                    <button
                      onClick={handleRestoreDefaults}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 transition-colors"
                      title="Khôi phục ngày mặc định"
                    >
                      <RotateCcw className="w-4 h-4" /> Khôi phục
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </div>

                {/* Form Học Kỳ */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Học kỳ I */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">I</div>
                        <h3 className="font-bold text-blue-900">Học kỳ I</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <LabeledDateField
                          label="Ngày bắt đầu"
                          value={form.hk1Start}
                          onChange={(v) => setForm((f) => ({ ...f, hk1Start: v }))}
                        />
                        <LabeledDateField
                          label="Ngày kết thúc"
                          value={form.hk1End}
                          onChange={(v) => setForm((f) => ({ ...f, hk1End: v }))}
                        />
                        <div className="pt-2 border-t border-slate-100">
                          <LabeledDateField
                            label="Hạn nhập điểm"
                            value={form.hk1Deadline}
                            onChange={(v) => setForm((f) => ({ ...f, hk1Deadline: v }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Học kỳ II */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">II</div>
                        <h3 className="font-bold text-blue-900">Học kỳ II</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <LabeledDateField
                          label="Ngày bắt đầu"
                          value={form.hk2Start}
                          onChange={(v) => setForm((f) => ({ ...f, hk2Start: v }))}
                        />
                        <LabeledDateField
                          label="Ngày kết thúc"
                          value={form.hk2End}
                          onChange={(v) => setForm((f) => ({ ...f, hk2End: v }))}
                        />
                        <div className="pt-2 border-t border-slate-100">
                          <LabeledDateField
                            label="Hạn nhập điểm"
                            value={form.hk2Deadline}
                            onChange={(v) => setForm((f) => ({ ...f, hk2Deadline: v }))}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 min-h-[400px]">
                {!loading && "Chưa có năm học nào. Hãy thêm năm học mới."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm Năm Học */}
      <SimpleModal
        open={createOpen}
        title="Thêm năm học mới"
        onClose={closeCreateModal}
      >
        <form className="space-y-6" onSubmit={handleCreateYear}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tên năm học *</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={createYearName}
              onChange={(e) => handleCreateYearNameChange(e.target.value)}
              placeholder="Ví dụ: 2026-2027"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Cột HK1 */}
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 text-sm">Học kỳ I</h4>
              <LabeledDateField
                label="Bắt đầu"
                value={createForm.hk1Start}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk1Start: v })); }}
              />
              <LabeledDateField
                label="Kết thúc"
                value={createForm.hk1End}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk1End: v })); }}
              />
              <LabeledDateField
                label="Hạn điểm"
                value={createForm.hk1Deadline}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk1Deadline: v })); }}
              />
            </div>

            {/* Cột HK2 */}
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="font-semibold text-blue-900 text-sm">Học kỳ II</h4>
              <LabeledDateField
                label="Bắt đầu"
                value={createForm.hk2Start}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk2Start: v })); }}
              />
              <LabeledDateField
                label="Kết thúc"
                value={createForm.hk2End}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk2End: v })); }}
              />
              <LabeledDateField
                label="Hạn điểm"
                value={createForm.hk2Deadline}
                onChange={(v) => { setIsManualForm(true); setCreateForm((f) => ({ ...f, hk2Deadline: v })); }}
              />
            </div>
          </div>

          {createError && (
            <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={closeCreateModal}>
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" disabled={creating}>
              {creating ? "Đang thêm..." : "Thêm năm học"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteModal({ open: false, year: null })} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-blue-900 text-center mb-2">Xóa năm học</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Bạn có chắc chắn muốn xóa năm học <strong>{deleteModal.year?.tenNamHoc}</strong>? Hành động này sẽ xóa các học kỳ liên quan và không thể hoàn tác.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                className="flex-1 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setDeleteModal({ open: false, year: null })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 bg-red-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                onClick={handleDeleteConfirm}
                disabled={saving}
              >
                {saving ? "Đang xóa..." : "Xóa năm học"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledDateField({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide text-[11px]">{label}</label>
      <input
        type="date"
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}