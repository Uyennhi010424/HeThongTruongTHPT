import { useEffect, useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
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
    new Date(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  const fmt = (dt) => dt.toISOString().slice(0, 10);
  const hk1Start = makeDate(start, 9, 5);
  const hk1End = makeDate(start + 1, 1, 15);
  const hk1Deadline = new Date(hk1End.getTime() - 5 * 24 * 60 * 60 * 1000);
  const hk2Start = makeDate(start + 1, 1, 22);
  const hk2End = makeDate(start + 1, 5, 25);
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
  hk1Deadline: toDateOnly(
    readField(year, "deadlineNhapDiemHk1", "deadline_nhap_diem_hk1"),
  ),
  hk2Start: toDateOnly(readField(year, "ngayBatDauHk2", "ngay_bat_dau_hk2")),
  hk2End: toDateOnly(readField(year, "ngayKetThucHk2", "ngay_ket_thuc_hk2")),
  hk2Deadline: toDateOnly(
    readField(year, "deadlineNhapDiemHk2", "deadline_nhap_diem_hk2"),
  ),
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

  if (form.hk1Start > form.hk1End)
    return "Ngày bắt đầu học kỳ I phải trước ngày kết thúc.";
  if (form.hk2Start > form.hk2End)
    return "Ngày bắt đầu học kỳ II phải trước ngày kết thúc.";

  const diffDays = (later, earlier) => {
    if (!later || !earlier) return Infinity;
    const ms =
      new Date(later).setHours(0, 0, 0, 0) -
      new Date(earlier).setHours(0, 0, 0, 0);
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  };

  if (diffDays(form.hk1End, form.hk1Deadline) < 5)
    return "Hạn chót nhập điểm học kỳ I phải trước ngày kết thúc ít nhất 5 ngày.";
  if (diffDays(form.hk2End, form.hk2Deadline) < 5)
    return "Hạn chót nhập điểm học kỳ II phải trước ngày kết thúc ít nhất 5 ngày.";

  return "";
};

const currentSemesterLabel = (form) => {
  const now = new Date();
  const hk2Start = form.hk2Start ? new Date(form.hk2Start + "T00:00:00") : null;
  const hk1Start = form.hk1Start ? new Date(form.hk1Start + "T00:00:00") : null;
  if (hk2Start && now >= hk2Start) return "Học kỳ II";
  if (hk1Start && now >= hk1Start) return "Học kỳ I";
  return "Chưa bắt đầu";
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
  const [deleteModal, setDeleteModal] = useState({ open: false, year: null });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [yRes, hkRes] = await Promise.all([getNamHoc(), getHocKy()]);
        if (!active) return;
        const yData = yRes?.data?.data || [];
        setYears(yData);
        setHocKyList(hkRes?.data?.data || []);
        if (yData.length) {
          const activeYear = yData.find(
            (y) => (y.trangThai || y.trang_thai) === "DANG_MO",
          );
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
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateError("");
    setCreateYearName("");
    setCreateForm({ ...emptyConfig });
  };

  const handleCreateYearNameChange = (value) => {
    setCreateYearName(value);
    setCreateForm((prev) => {
      const hasManualDate = Object.values(prev).some(Boolean);
      return hasManualDate ? prev : inferConfigFromYearName(value);
    });
  };

  const handleCreateYear = async (event) => {
    event.preventDefault();
    setCreateError("");

    const trimmedName = createYearName.trim();
    if (!trimmedName) { setCreateError("Vui lòng nhập tên năm học."); return; }

    // Validate format YYYY-YYYY
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
      const nextYears = freshYears?.data?.data || [];
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

  const handleSetCurrentYear = async (targetYear) => {
    try {
      setSaving(true);
      const openYears = years.filter(
        (y) => (y.trangThai || y.trang_thai) === "DANG_MO" && y.id !== targetYear.id,
      );
      for (const y of openYears) {
        await updateNamHoc(y.id, buildPayload({ tenNamHoc: y.tenNamHoc || "", form: toFormFromYear(y), trangThai: "DA_DONG" }));
      }
      const res = await updateNamHoc(targetYear.id, buildPayload({ tenNamHoc: targetYear.tenNamHoc || "", form: toFormFromYear(targetYear), trangThai: "DANG_MO" }));
      const updated = res?.data?.data;
      setYears((prev) =>
        prev.map((y) => {
          if (y.id === targetYear.id) return updated || { ...y, trangThai: "DANG_MO" };
          if ((y.trangThai || y.trang_thai) === "DANG_MO") return { ...y, trangThai: "DA_DONG" };
          return y;
        }),
      );
      if (updated) setSelectedYear(updated);
      notifySuccess(`Đã đặt ${targetYear.tenNamHoc} làm năm học hiện tại.`);
    } catch {
      notifyError("Không thể cập nhật năm học hiện tại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (targetYear) => {
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

  const yearLabel = selectedYear?.tenNamHoc || "—";

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Năm học & Học kỳ"
        description="Quản lý mốc thời gian và hạn nhập điểm cho toàn hệ thống."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-sm"
          >
            <MaterialIcon name="add" />
            Thêm năm học
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[280px_1fr]">
        {/* ── Cột trái ── */}
        <aside className="flex flex-col gap-sm">
          <p className="mb-xs px-xs text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant/60">
            Danh sách năm học
          </p>

          {loading ? (
            <p className="text-body-sm text-outline">Đang tải...</p>
          ) : (
            years.map((y) => {
              const active = selectedYear?.id === y.id;
              const isOngoing = (y.trangThai || y.trang_thai) === "DANG_MO";
              return (
                <div
                  key={y.id}
                  className={`group/card relative w-full rounded-2xl border-2 transition-all ${
                    active
                      ? "border-primary bg-white shadow-sm"
                      : "border-transparent bg-surface-container-low hover:border-outline-variant/60 hover:bg-white"
                  }`}
                >
                  {/* Nút xóa — icon nhỏ góc trên phải, hiện khi hover card */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(y)}
                    disabled={saving}
                    title="Xóa năm học"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant/30 opacity-0 transition-all group-hover/card:opacity-100 hover:!text-error hover:bg-error/8 disabled:pointer-events-none"
                  >
                    <MaterialIcon name="close" className="text-[16px]" />
                  </button>

                  {/* Phần tên + badge — click để chọn */}
                  <button
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className="w-full px-md pt-md pb-md text-left"
                  >
                    <div className="flex items-center justify-between gap-sm pr-4">
                      <span
                        className={`text-body-lg font-bold tracking-tight ${
                          active ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {y.tenNamHoc}
                      </span>
                      {isOngoing ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Hiện tại
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] text-on-surface-variant/60 ring-1 ring-outline-variant/40">
                          Đã đóng
                        </span>
                      )}
                    </div>

                    {/* Nút đặt làm hiện tại — chỉ hiện với năm đã đóng */}
                    {!isOngoing && (
                      <div
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => { e.stopPropagation(); handleSetCurrentYear(y); }}
                        className="mt-sm inline-flex items-center gap-xs text-label-sm font-medium text-primary hover:underline"
                      >
                        <MaterialIcon name="check_circle" className="text-[13px]" />
                        Đặt làm năm hiện tại
                      </div>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {/* Trạng thái học kỳ hiện tại */}
          <div className="mt-md rounded-2xl border border-outline-variant/30 bg-surface-container-low px-md py-md">
            <p className="text-label-sm text-on-surface-variant/60">Đang ở</p>
            <p className="mt-xs text-body-lg font-bold text-on-surface">
              {currentSemesterLabel(form)}
            </p>
            <p className="mt-xs text-label-sm text-on-surface-variant/60">
              {hocKyList.length
                ? `${hocKyList.length} học kỳ đã cấu hình`
                : "Chưa có học kỳ"}
            </p>
          </div>
        </aside>

        {/* ── Cột phải ── */}
        <section className="rounded-2xl border border-outline-variant/30 bg-white px-xl py-xl">
          {/* Header */}
          <div className="mb-xl flex items-start justify-between">
            <div>
              <h2 className="text-headline-md font-bold text-on-surface">
                Cấu hình năm học
              </h2>
              <p className="mt-xs text-body-sm text-on-surface-variant">
                {yearLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestoreDefaults}
              className="mt-xs text-label-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
            >
              Khôi phục mặc định
            </button>
          </div>

          <form className="space-y-xl" onSubmit={handleSave}>
            {[
              { n: 1, prefix: "hk1", title: "Học kỳ I" },
              { n: 2, prefix: "hk2", title: "Học kỳ II" },
            ].map((hk, idx) => (
              <div key={hk.prefix}>
                {/* Divider giữa 2 kỳ */}
                {idx > 0 && (
                  <div className="mb-xl border-t border-outline-variant/30" />
                )}

                <div className="mb-lg flex items-center gap-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary">
                    {hk.n}
                  </span>
                  <h3 className="text-body-lg font-semibold text-on-surface">
                    {hk.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
                  <LabeledDateField
                    label="Ngày bắt đầu"
                    value={form[`${hk.prefix}Start`]}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [`${hk.prefix}Start`]: v }))
                    }
                  />
                  <LabeledDateField
                    label="Ngày kết thúc"
                    value={form[`${hk.prefix}End`]}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [`${hk.prefix}End`]: v }))
                    }
                  />
                  <LabeledDateField
                    label="Hạn nhập điểm"
                    value={form[`${hk.prefix}Deadline`]}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, [`${hk.prefix}Deadline`]: v }))
                    }
                    hint="Ít nhất 5 ngày trước khi kết thúc"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-md border-t border-outline-variant/20 pt-lg">
              <button
                type="button"
                onClick={() => selectedYear && setForm(toFormFromYear(selectedYear))}
                className="btn-outline"
              >
                Hủy thay đổi
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* ── Modal tạo năm học ── */}
      <SimpleModal
        open={createOpen}
        title="Thêm năm học mới"
        onClose={closeCreateModal}
        width={680}
      >
        <form className="space-y-lg" onSubmit={handleCreateYear}>
          <LabeledDateField
            label="Tên năm học"
            asText
            value={createYearName}
            onChange={handleCreateYearNameChange}
            placeholder="Ví dụ: 2026-2027"
          />

          {[
            { n: 1, prefix: "hk1", title: "Học kỳ I" },
            { n: 2, prefix: "hk2", title: "Học kỳ II" },
          ].map((hk, idx) => (
            <div key={hk.prefix}>
              {idx > 0 && <div className="border-t border-outline-variant/30" />}
              <p className="mb-md mt-lg flex items-center gap-sm text-body-sm font-semibold text-on-surface-variant">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  {hk.n}
                </span>
                {hk.title}
              </p>
              <div className="grid grid-cols-3 gap-md">
                <LabeledDateField
                  label="Bắt đầu"
                  value={createForm[`${hk.prefix}Start`]}
                  onChange={(v) =>
                    setCreateForm((f) => ({ ...f, [`${hk.prefix}Start`]: v }))
                  }
                />
                <LabeledDateField
                  label="Kết thúc"
                  value={createForm[`${hk.prefix}End`]}
                  onChange={(v) =>
                    setCreateForm((f) => {
                      const def = v
                        ? new Date(new Date(v).getTime() - 5 * 86400000)
                            .toISOString()
                            .slice(0, 10)
                        : f[`${hk.prefix}Deadline`];
                      return {
                        ...f,
                        [`${hk.prefix}End`]: v,
                        [`${hk.prefix}Deadline`]:
                          !f[`${hk.prefix}Deadline`] ||
                          new Date(f[`${hk.prefix}Deadline`]) > new Date(def)
                            ? def
                            : f[`${hk.prefix}Deadline`],
                      };
                    })
                  }
                />
                <LabeledDateField
                  label="Hạn nhập điểm"
                  value={createForm[`${hk.prefix}Deadline`]}
                  onChange={(v) =>
                    setCreateForm((f) => ({ ...f, [`${hk.prefix}Deadline`]: v }))
                  }
                />
              </div>
            </div>
          ))}

          {createError && (
            <p className="rounded-xl border border-error/20 bg-error/5 px-md py-sm text-body-sm text-error">
              {createError}
            </p>
          )}

          <div className="flex justify-end gap-md border-t border-outline-variant/20 pt-md">
            <button type="button" className="btn-outline" onClick={closeCreateModal}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Đang thêm..." : "Thêm năm học"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, year: null })}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="delete-modal-title">Xác nhận xóa năm học</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa năm học <strong>{deleteModal.year?.tenNamHoc}</strong>?
            </p>
            <p className="delete-modal-warning">
              Hành động này sẽ xóa cả học kỳ liên quan. Không thể hoàn tác.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteModal({ open: false, year: null })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
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

/**
 * Field dùng chung — date hoặc text input
 */
function LabeledDateField({ label, value, onChange, hint, asText, placeholder }) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-label-sm font-medium text-on-surface-variant">
        {label}
      </label>
      {asText ? (
        <input
          type="text"
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="date"
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && (
        <p className="text-label-sm text-on-surface-variant/50">{hint}</p>
      )}
    </div>
  );
}