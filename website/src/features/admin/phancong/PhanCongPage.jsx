import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { getGiaoVien } from "../../../api/giaovienApi.js";
import { getMonHoc, createMonHoc } from "../../../api/monhocApi.js";
import { getLop } from "../../../api/lopApi.js";
import { autoAssignAll, createPhanCongDay, deletePhanCongDay, deletePhanCongDayById, getPhanCongDay } from "../../../api/phancongDayApi.js";
import axiosClient from "../../../api/axiosClient.js";
import { notifyError, notifySuccess } from "../../../utils/notify.js";
import { normalizeText } from "../../../utils/normalizeText.js";

const formatHocKy = (value) => (Number(value) === 2 ? "Học kỳ 2" : "Học kỳ 1");

const sortByAssignment = (a, b) => {
  const c1 = String(a?.lop || "").localeCompare(String(b?.lop || ""), "vi", { sensitivity: "base", numeric: true });
  if (c1 !== 0) return c1;
  const c2 = String(a?.mon || "").localeCompare(String(b?.mon || ""), "vi", { sensitivity: "base", numeric: true });
  if (c2 !== 0) return c2;
  return String(a?.gv || "").localeCompare(String(b?.gv || ""), "vi", { sensitivity: "base", numeric: true });
};

function FilterDropdown({ filterNamHoc, setFilterNamHoc, filterHocKy, setFilterHocKy, namHocList, setPage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasFilter = filterNamHoc || filterHocKy > 0;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="filter-dropdown-wrap" ref={ref}>
      <button type="button" className={`btn-outline filter-toggle ${hasFilter ? "filter-active" : ""}`} onClick={() => setOpen((v) => !v)} title="Lọc">
        <span className="material-symbols-outlined">filter_list</span>
        {hasFilter && <span className="filter-dot" />}
      </button>
      {open && (
        <div className="filter-dropdown">
          <div className="filter-dropdown-title">Lọc phân công</div>
          <label className="filter-dropdown-label">
            <span>Năm học</span>
            <select value={filterNamHoc} onChange={(e) => { setFilterNamHoc(e.target.value); setPage(1); }}>
              <option value="">Tất cả năm</option>
              {namHocList.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="filter-dropdown-label">
            <span>Học kỳ</span>
            <select value={filterHocKy} onChange={(e) => { setFilterHocKy(Number(e.target.value)); setPage(1); }}>
              <option value={0}>Tất cả HK</option>
              <option value={1}>Học kỳ 1</option>
              <option value={2}>Học kỳ 2</option>
            </select>
          </label>
          {hasFilter && (
            <button type="button" className="filter-clear" onClick={() => { setFilterNamHoc(""); setFilterHocKy(0); setPage(1); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function PhanCongPage() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedHocKy, setSelectedHocKy] = useState("Học kỳ 1");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto assign state
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoNamHoc, setAutoNamHoc] = useState("");
  const [autoHocKy, setAutoHocKy] = useState(1);

  // Filter state
  const [filterNamHoc, setFilterNamHoc] = useState("");
  const [filterHocKy, setFilterHocKy] = useState(0);
  const [keyword, setKeyword] = useState("");

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [deleteAllModal, setDeleteAllModal] = useState(false);

  const teacherCount = teachers.length;
  const subjectCount = subjects.length;
  const classCount = classes.length;

  const namHocList = useMemo(() => {
    const set = new Set(assignments.map((a) => a.namHoc).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    let result = assignments;
    if (filterNamHoc) result = result.filter((a) => a.namHoc === filterNamHoc);
    if (filterHocKy > 0) result = result.filter((a) => Number(a.hocKy) === filterHocKy);
    if (keyword.trim()) {
      const lower = keyword.toLowerCase();
      result = result.filter((a) =>
        [a.gv, a.ma, a.mon, a.lop]
          .filter(Boolean)
          .some((f) => String(f).toLowerCase().includes(lower))
      );
    }
    return result;
  }, [assignments, filterNamHoc, filterHocKy, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAssignments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAssignments.slice(start, start + PAGE_SIZE);
  }, [filteredAssignments, currentPage]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [gv, mh, lop, phanCong] = await Promise.all([getGiaoVien(), getMonHoc(), getLop(), getPhanCongDay()]);
        if (!active) return;
        setTeachers((gv?.data?.data || []).sort((a, b) => String(a?.hoTen || "").localeCompare(String(b?.hoTen || ""), "vi", { sensitivity: "base", numeric: true })));
        setSubjects(mh?.data?.data || []);
        setClasses(lop?.data?.data || []);
        const defaultNam = lop?.data?.data?.[0]?.namHoc || "";
        setAutoNamHoc(defaultNam);
        setFilterNamHoc(defaultNam);

        const rows = (phanCong?.data?.data || []).map((item) => ({
          id: item.id,
          gv: item.giaoVienHoTen || "--",
          ma: item.maGiaoVien || "",
          mon: item.monHocTen || "--",
          lop: item.tenLop || "--",
          hk: formatHocKy(item.hocKy),
          hocKy: item.hocKy,
          namHoc: item.namHoc || ""
        }));
        setAssignments(rows.sort(sortByAssignment));
        setPage(1);
      } catch {
        if (!active) return;
        setError("Không thể tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const handleAssign = async () => {
    setFormError("");
    const teacher = teachers.find((t) => String(t.id) === String(selectedTeacherId));
    if (!teacher) { setFormError("Vui lòng chọn giáo viên."); return; }
    if (!selectedSubject) { setFormError("Vui lòng chọn môn học."); return; }
    if (!selectedClassId) { setFormError("Vui lòng chọn lớp học."); return; }

    let mon = subjects.find((m) => normalizeText(m.tenMon) === normalizeText(selectedSubject));
    if (!mon) mon = subjects.find((m) => normalizeText(m.tenMon).includes(normalizeText(selectedSubject)));
    if (!mon) {
      try { mon = (await createMonHoc({ tenMon: selectedSubject, heSo: 1 }))?.data?.data; } catch {}
    }
    if (!mon) { setFormError("Môn học chưa có trong hệ thống."); return; }

    const lopObj = classes.find((c) => String(c.id) === String(selectedClassId));
    const namHocVal = lopObj?.namHoc || "";
    const hkInt = selectedHocKy === "Học kỳ 2" ? 2 : 1;

    try {
      setSaving(true);
      const res = await createPhanCongDay({
        giaoVienId: Number(selectedTeacherId), monHocId: mon.id,
        lopId: Number(selectedClassId), hocKy: hkInt, namHoc: namHocVal
      });
      const saved = res?.data?.data;
      if (!saved) throw new Error("Lỗi server");

      setAssignments((prev) => [{
        id: saved.id, gv: saved.giaoVienHoTen || teacher.hoTen,
        ma: saved.maGiaoVien || "", mon: saved.monHocTen || selectedSubject,
        lop: saved.tenLop || lopObj?.tenLop || "",
        hk: formatHocKy(saved.hocKy), hocKy: saved.hocKy,
        namHoc: saved.namHoc || namHocVal
      }, ...prev].sort(sortByAssignment));

      notifySuccess("Đã thêm phân công thành công.");
      setFormOpen(false);
      setSelectedSubject("");
      setSelectedClassId("");
    } catch (err) {
      setFormError(err?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!autoNamHoc) { notifyError("Nhập năm học."); return; }
    try {
      const res = await autoAssignAll(autoNamHoc, Number(autoHocKy));
      const createdCount = (res?.data?.data || []).length;
      notifySuccess(`Tạo ${createdCount} phân công thành công.`);
      axiosClient.invalidateCache("/phancong-day");
      const ph = await getPhanCongDay();
      const rows = (ph?.data?.data || []).map((item) => ({
        id: item.id, gv: item.giaoVienHoTen || "--", ma: item.maGiaoVien || "",
        mon: item.monHocTen || "--", lop: item.tenLop || "--",
        hk: formatHocKy(item.hocKy), hocKy: item.hocKy, namHoc: item.namHoc || ""
      })).sort(sortByAssignment);
      setAssignments(rows);
      setFilterNamHoc(autoNamHoc);
      setFilterHocKy(Number(autoHocKy));
      setPage(1);
      setAutoOpen(false);
    } catch (err) { notifyError(err?.response?.data?.message || "Thất bại."); }
  };

  const handleDeleteClick = (item) => {
    setDeleteModal({ open: true, item });
  };

  const handleDeleteAll = async () => {
    if (!filterNamHoc) { notifyError("Vui lòng chọn năm học trước khi xóa."); return; }
    try {
      const res = await deletePhanCongDay(filterNamHoc, filterHocKy > 0 ? filterHocKy : 0);
      const count = Number(res?.data?.data || 0);
      notifySuccess(`Đã xóa ${count} phân công.`);
      axiosClient.invalidateCache("/phancong-day");
      const ph = await getPhanCongDay();
      const rows = (ph?.data?.data || []).map((item) => ({
        id: item.id, gv: item.giaoVienHoTen || "--", ma: item.maGiaoVien || "",
        mon: item.monHocTen || "--", lop: item.tenLop || "--",
        hk: formatHocKy(item.hocKy), hocKy: item.hocKy, namHoc: item.namHoc || ""
      })).sort(sortByAssignment);
      setAssignments(rows);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể xóa.");
    } finally {
      setDeleteAllModal(false);
    }
  };

  const handleDeleteDiem = async () => {
    if (!filterNamHoc) { notifyError("Vui lòng chọn năm học."); return; }
    try {
      const params = { namHoc: filterNamHoc };
      if (filterHocKy > 0) params.hocKy = filterHocKy;
      const res = await deleteDiemBulk(params);
      const count = res?.data?.data?.deleted || 0;
      notifySuccess(`Đã xóa ${count} bản ghi điểm.`);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể xóa điểm.");
    } finally {
      setDeleteDiemModal(false);
    }
  };

  const handleDeleteTkb = async () => {
    if (!filterNamHoc) { notifyError("Vui lòng chọn năm học."); return; }
    try {
      const params = { namHoc: filterNamHoc };
      if (filterHocKy > 0) params.hocKy = filterHocKy;
      const res = await deleteThoiKhoaBieuBulk(params);
      const count = res?.data?.data?.deleted || 0;
      notifySuccess(`Đã xóa ${count} mục thời khóa biểu.`);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Không thể xóa TKB.");
    } finally {
      setDeleteTkbModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const item = deleteModal.item;
    if (!item) return;
    try {
      if (item.id) await deletePhanCongDayById(item.id);
      setAssignments((prev) => prev.filter((a) => a.id !== item.id));
      notifySuccess("Đã xóa phân công.");
    } catch {
      notifyError("Không thể xóa phân công.");
    } finally {
      setDeleteModal({ open: false, item: null });
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Phân công Giảng dạy"
        actions={
          <div className="users-actions" style={{ flexWrap: "nowrap" }}>
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo giáo viên, môn học, lớp"
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              />
            </div>
            <FilterDropdown
              filterNamHoc={filterNamHoc}
              setFilterNamHoc={setFilterNamHoc}
              filterHocKy={filterHocKy}
              setFilterHocKy={setFilterHocKy}
              namHocList={namHocList}
              setPage={setPage}
            />
            <button className="btn-primary" onClick={() => { setFormOpen(true); setFormError(""); }}>
              Thêm phân công
            </button>
            <button className="btn-outline" onClick={() => setAutoOpen(true)}>
              Tự động
            </button>
          </div>
        }
      />

     

      {/* Table */}
      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách phân công</div>
          </div>
          <div className="panel-pill">{filteredAssignments.length} phân công</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && !loading && filteredAssignments.length === 0 && (
          <div className="table-empty">Chưa có phân công nào.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head" style={{ gridTemplateColumns: "50px 1.2fr 1fr 1fr 100px 100px 100px" }}>
            <div>STT</div>
            <div>Giáo viên</div>
            <div>Môn học</div>
            <div>Lớp</div>
            <div style={{ textAlign: "center" }}>HK</div>
            <div style={{ textAlign: "center" }}>Năm</div>
            <div style={{ textAlign: "right" }}>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div className="table-row" key={`skeleton-${i}`} style={{ gridTemplateColumns: "50px 1.2fr 1fr 1fr 100px 100px 100px" }}>
                  <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
                  <div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
                </div>
              ))
            : pagedAssignments.map((r, idx) => (
                <div className="table-row" key={`${r.id || idx}-${r.lop}`} style={{ gridTemplateColumns: "50px 1.2fr 1fr 1fr 100px 100px 100px" }}>
                  <div className="table-id">{(currentPage - 1) * PAGE_SIZE + idx + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{r.gv}</div>
                    {r.ma && <div className="table-meta">{r.ma}</div>}
                  </div>
                  <div>
                    <span className="role-pill">{r.mon}</span>
                  </div>
                  <div>
                    <span className="role-pill">{r.lop}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>{r.hk}</div>
                  <div style={{ textAlign: "center" }}>{r.namHoc || "--"}</div>
                  <div className="table-actions">
                    <button
                      className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteClick(r)}
                      title="Xóa"
                    >
                      <MaterialIcon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn-outline btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              Trước
            </button>
            <div className="pagination-info">Trang {currentPage} / {totalPages}</div>
            <button className="btn-outline btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        )}
        {/* Delete All Button */}
        {filteredAssignments.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-outline"
              style={{ color: "#dc2626", borderColor: "#fca5a5" }}
              onClick={() => setDeleteAllModal(true)}
            >
              Xóa tất cả phân công
            </button>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      <SimpleModal open={formOpen} title="Thêm phân công" onClose={() => setFormOpen(false)}>
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleAssign(); }}>
          <label className="form-field">
            <span>Giáo viên *</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => { setSelectedTeacherId(e.target.value); setSelectedSubject(""); setSelectedClassId(""); }}
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.hoTen}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Môn học *</span>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">-- Chọn môn --</option>
              {(() => {
                const t = teachers.find((x) => String(x.id) === String(selectedTeacherId));
                if (t?.boMon) {
                  const parts = String(t.boMon).split(/[,;\/|]+/).map((s) => s.trim()).filter(Boolean);
                  if (parts.length) return parts.map((p) => <option key={p} value={p}>{p}</option>);
                }
                return subjects.map((m) => <option key={m.id} value={m.tenMon}>{m.tenMon}</option>);
              })()}
            </select>
          </label>
          <label className="form-field">
            <span>Lớp *</span>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
              <option value="">-- Chọn lớp --</option>
              {classes.slice().sort((a, b) => String(a.tenLop || "").localeCompare(String(b.tenLop || ""), "vi", { numeric: true })).map((l) => (
                <option key={l.id} value={l.id}>{l.tenLop}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Học kỳ *</span>
            <select value={selectedHocKy} onChange={(e) => setSelectedHocKy(e.target.value)}>
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ 2">Học kỳ 2</option>
            </select>
          </label>
          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => setFormOpen(false)}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Auto Assign Modal */}
      <SimpleModal open={autoOpen} title="Tự động phân công" onClose={() => setAutoOpen(false)}>
        <div className="form-grid">
          <p className="text-body-sm text-on-surface-variant">
            Tự động phân công giáo viên dạy các lớp theo bộ môn. Hệ thống sẽ tạo phân công cho tất cả giáo viên.
          </p>
          <label className="form-field">
            <span>Năm học *</span>
            <input value={autoNamHoc} onChange={(e) => setAutoNamHoc(e.target.value)} placeholder="2025-2026" />
          </label>
          <label className="form-field">
            <span>Học kỳ *</span>
            <select value={autoHocKy} onChange={(e) => setAutoHocKy(e.target.value)}>
              <option value={1}>Học kỳ 1</option>
              <option value={2}>Học kỳ 2</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn-outline" onClick={() => setAutoOpen(false)}>Hủy</button>
            <button type="button" className="btn-primary" onClick={handleAutoAssign}>
              Tự động phân công
            </button>
          </div>
        </div>
      </SimpleModal>

      {/* Delete Single Confirmation Modal */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, item: null })}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="delete-modal-title">Xác nhận xóa phân công</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa phân công <strong>{deleteModal.item?.gv}</strong> dạy <strong>{deleteModal.item?.mon}</strong> lớp <strong>{deleteModal.item?.lop}</strong>?
            </p>
            <p className="delete-modal-warning">Hành động này không thể hoàn tác.</p>
            <div className="delete-modal-actions">
              <button type="button" className="btn-outline" onClick={() => setDeleteModal({ open: false, item: null })}>
                Hủy
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>
                Xóa phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllModal && (
        <div className="modal-overlay" onClick={() => setDeleteAllModal(false)}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="delete-modal-title">Xóa tất cả phân công</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa <strong>tất cả {filteredAssignments.length} phân công</strong>
              {filterNamHoc ? ` năm ${filterNamHoc}` : ""}
              {filterHocKy > 0 ? ` học kỳ ${filterHocKy}` : ""}?
            </p>
            <p className="delete-modal-warning">Hành động này không thể hoàn tác.</p>
            <div className="delete-modal-actions">
              <button type="button" className="btn-outline" onClick={() => setDeleteAllModal(false)}>
                Hủy
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteAll}>
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
