import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createMonHoc,
  deleteMonHoc,
  getMonHoc,
  updateMonHoc
} from "../../../api/monhocApi.js";
import { normalizeStrict } from "../../../utils/normalizeText.js";

const REMARK_ONLY_SUBJECTS = [
  { tenMon: "Giáo dục thể chất (GDTC)", heSo: 0 },
  { tenMon: "Âm nhạc", heSo: 0 },
  { tenMon: "Nội dung giáo dục địa phương (GDĐP)", heSo: 0 },
  { tenMon: "Hoạt động trải nghiệm, hướng nghiệp (HĐTN, HN)", heSo: 0 }
];

const SCORE_AND_REMARK_SUBJECTS = [
  { tenMon: "Toán", heSo: 2 },
  { tenMon: "Ngữ văn", heSo: 2 },
  { tenMon: "Tiếng Anh", heSo: 1 },
  { tenMon: "Vật lí", heSo: 1 },
  { tenMon: "Hóa học", heSo: 1 },
  { tenMon: "Sinh học", heSo: 1 },
  { tenMon: "Lịch sử", heSo: 1 },
  { tenMon: "Địa lí", heSo: 1 },
  { tenMon: "Giáo dục kinh tế và pháp luật (GDKT&PL)", heSo: 1 },
  { tenMon: "Tin học", heSo: 1 },
  { tenMon: "Công nghệ", heSo: 1 },
  { tenMon: "GDQP-AN", heSo: 1 }
];

const STANDARD_SUBJECTS = [...REMARK_ONLY_SUBJECTS, ...SCORE_AND_REMARK_SUBJECTS];

const REMARK_ONLY_KEYWORDS = new Set(REMARK_ONLY_SUBJECTS.map((item) => normalizeStrict(item.tenMon)));

const getEvaluationLabel = (subject) => {
  const key = normalizeStrict(subject?.tenMon);
  if (REMARK_ONLY_KEYWORDS.has(key) || Number(subject?.heSo) === 0) {
    return "Nhận xét (Đạt/Chưa đạt)";
  }
  return "Nhận xét + điểm số";
};

export default function MonHocList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formError, setFormError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, subject: null });
  const [form, setForm] = useState({
    tenMon: "",
    nhomDanhGia: "DIEM_SO",
    soDtxHocKy: 3,
    khoiApDung: ["10", "11", "12"],
    moTa: ""
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getMonHoc();
      const data = response?.data?.data || [];
      const sorted = [...data].sort((a, b) => {
        const aScore = getEvaluationLabel(a) === "Nhận xét + điểm số" ? 0 : 1;
        const bScore = getEvaluationLabel(b) === "Nhận xét + điểm số" ? 0 : 1;
        if (aScore !== bScore) return aScore - bScore;
        return String(a?.tenMon || "").localeCompare(String(b?.tenMon || ""), "vi", {
          sensitivity: "base"
        });
      });
      setSubjects(sorted);
    } catch (err) {
      setError("Không thể tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchSubjectsSafe = async () => {
      if (!active) return;
      await fetchSubjects();
    };

    fetchSubjectsSafe();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const stats = useMemo(() => {
    const total = subjects.length;
    const scoreAndRemark = subjects.filter(
      (item) => getEvaluationLabel(item) === "Nhận xét + điểm số"
    ).length;
    const remarkOnly = total - scoreAndRemark;
    return { total, scoreAndRemark, remarkOnly };
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (!keyword.trim()) return subjects;
    const lower = keyword.toLowerCase();
    return subjects.filter((item) =>
      [item.tenMon, getEvaluationLabel(item)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, subjects]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  }, [filteredSubjects.length, pageSize]);

  const pagedSubjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const openCreate = () => {
    setEditingSubject(null);
    setForm({
      tenMon: "",
      nhomDanhGia: "DIEM_SO",
      soDtxHocKy: 3,
      khoiApDung: ["10", "11", "12"],
      moTa: ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingSubject(item);
    setForm({
      tenMon: item.tenMon || "",
      nhomDanhGia: item.nhomDanhGia || "DIEM_SO",
      soDtxHocKy: item.soDtxHocKy ?? 3,
      khoiApDung: item.khoiApDung ? item.khoiApDung.split(",") : ["10", "11", "12"],
      moTa: item.moTa || ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleAddStandardSubjects = async () => {
    try {
      setError("");
      setSuccessMessage("");

      const existingMap = new Map(
        subjects.map((item) => [normalizeStrict(item.tenMon), item])
      );

      const missing = STANDARD_SUBJECTS.filter(
        (item) => !existingMap.has(normalizeStrict(item.tenMon))
      );

      if (!missing.length) {
        setSuccessMessage("Danh mục môn học đã đủ theo quy định.");
        return;
      }

      const createdResults = await Promise.allSettled(
        missing.map((item) => createMonHoc({ tenMon: item.tenMon, heSo: item.heSo }))
      );

      const createdCount = createdResults.filter((item) => item.status === "fulfilled").length;
      const failedCount = createdResults.length - createdCount;

      await fetchSubjects();
      if (failedCount > 0) {
        setError(`Đã thêm ${createdCount} môn, ${failedCount} môn chưa thêm được.`);
      } else {
        setSuccessMessage(`Đã thêm đủ ${createdCount} môn theo quy định.`);
      }
    } catch {
      setError("Không thể bổ sung danh mục môn học.");
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteModal({ open: true, subject: item });
  };

  const handleDeleteConfirm = async () => {
    const item = deleteModal.subject;
    if (!item) return;
    try {
      await deleteMonHoc(item.id);
      setSubjects((prev) => prev.filter((row) => row.id !== item.id));
      setError("");
      setSuccessMessage("Xóa môn học thành công.");
    } catch (err) {
      setError("Không thể xóa môn học.");
      setSuccessMessage("");
    } finally {
      setDeleteModal({ open: false, subject: null });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    // Validate tên môn
    const tenMon = form.tenMon.trim();
    if (!tenMon) {
      setFormError("Vui lòng nhập tên môn.");
      return;
    }

    // Kiểm tra tên môn không chứa ký tự lạ
    const validNamePattern = /^[A-ZÀ-Ỹa-zà-ỹ0-9\s&().,]+$/;
    if (!validNamePattern.test(tenMon)) {
      setFormError("Tên môn chỉ được chứa chữ cái, số và ký tự &().,");
      return;
    }

    // Kiểm tra tên môn có nghĩa
    const words = tenMon.split(/\s+/).filter(Boolean);
    if (words.length < 1) {
      setFormError("Vui lòng nhập tên môn.");
      return;
    }

    // Kiểm tra có dấu tiếng Việt (thanh dấu hoặc ký tự đặc biệt VN)
    // Tiếng Việt có dấu: àáảãạăắằẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ
    const vietnameseDiacritics = /[àáảãạăắằẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
    if (!vietnameseDiacritics.test(tenMon)) {
      setFormError("Tên môn phải có dấu tiếng Việt (vd: Toán, Ngữ văn, Địa lí).");
      return;
    }

    // Với tên 1 từ: phải có ít nhất 4 chữ cái (vd: Toán, Sinh, Sử)
    // Với tên nhiều từ: mỗi từ phải có ít nhất 2 chữ cái và bắt đầu bằng chữ hoa
    if (words.length === 1) {
      if (words[0].length < 4) {
        setFormError("Tên môn phải có ít nhất 4 chữ cái (vd: Toán, Sinh).");
        return;
      }
      if (!/^[A-ZÀ-Ỹ]/.test(words[0])) {
        setFormError("Tên môn phải bắt đầu bằng chữ hoa (vd: Toán).");
        return;
      }
    } else {
      // Nhiều từ: mỗi từ phải bắt đầu bằng chữ hoa và có ít nhất 2 chữ cái
      for (const w of words) {
        if (w.length < 2) {
          setFormError("Mỗi từ phải có ít nhất 2 chữ cái.");
          return;
        }
        if (!/^[A-ZÀ-Ỹ]/.test(w)) {
          setFormError("Mỗi từ phải bắt đầu bằng chữ hoa (vd: Ngữ văn, Tiếng Anh).");
          return;
        }
      }
    }

    // Kiểm tra trùng tên môn
    const normalizedName = normalizeStrict(tenMon);
    const isDuplicate = subjects.some(
      (s) => normalizeStrict(s.tenMon) === normalizedName && s.id !== editingSubject?.id
    );
    if (isDuplicate) {
      setFormError(`Môn học "${tenMon}" đã tồn tại.`);
      return;
    }

    // Validate nhóm đánh giá
    if (!form.nhomDanhGia) {
      setFormError("Vui lòng chọn nhóm đánh giá.");
      return;
    }

    // Validate số ĐTX
    const soDtx = Number(form.soDtxHocKy);
    if (form.nhomDanhGia === "DIEM_SO" && (isNaN(soDtx) || soDtx < 1 || soDtx > 10)) {
      setFormError("Số ĐTX phải từ 1 đến 10.");
      return;
    }

    // Validate khối áp dụng
    if (!form.khoiApDung.length) {
      setFormError("Vui lòng chọn ít nhất 1 khối áp dụng.");
      return;
    }

    const payload = {
      tenMon: tenMon,
      nhomDanhGia: form.nhomDanhGia,
      soDtxHocKy: form.nhomDanhGia === "NHAN_XET" ? 0 : soDtx,
      khoiApDung: form.khoiApDung.join(","),
      moTa: form.moTa.trim() || null
    };

    try {
      if (editingSubject) {
        const response = await updateMonHoc(editingSubject.id, payload);
        const updated = response?.data?.data;
        setSubjects((prev) =>
          prev.map((row) => (row.id === editingSubject.id ? updated : row))
        );
      } else {
        const response = await createMonHoc(payload);
        const created = response?.data?.data;
        setSubjects((prev) => [created, ...prev]);
      }
      setError("");
      setSuccessMessage(editingSubject ? "Cập nhật môn học thành công." : "Thêm môn học thành công.");
      await fetchSubjects();
      setModalOpen(false);
    } catch (err) {
      setFormError("Không thể lưu môn học. Vui lòng thử lại.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục môn học"
        description="Theo dõi, cập nhật thông tin và hình thức đánh giá môn."
        actions={
          <div className="users-actions">
            <div className="dash-search users-search">
              <span className="dot" />
              <input
                placeholder="Tìm theo tên môn hoặc hình thức đánh giá"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={openCreate}>
              Thêm môn học
            </button>
          </div>
        }
      />

      <div className="users-stats">
        <div className="stat-card stat-blue">
          <div className="stat-label">Tổng môn</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat-card stat-sky">
          <div className="stat-label">Nhận xét + điểm số</div>
          <div className="stat-value">{loading ? "..." : stats.scoreAndRemark}</div>
        </div>
        <div className="stat-card stat-ice">
          <div className="stat-label">Nhận xét (Đạt/Chưa đạt)</div>
          <div className="stat-value">{loading ? "..." : stats.remarkOnly}</div>
        </div>
      </div>

      <div className="card users-table">
        <div className="table-header">
          <div>
            <div className="panel-title">Danh sách môn học</div>
          </div>
          <div className="panel-pill">{filteredSubjects.length} môn</div>
        </div>
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredSubjects.length === 0 && (
          <div className="table-empty">Không tìm thấy môn học phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head" style={{ gridTemplateColumns: "60px 1fr 200px 140px" }}>
            <div>STT</div>
            <div>Tên môn</div>
            <div style={{ textAlign: "center" }}>Đánh giá</div>
            <div style={{ textAlign: "right" }}>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div className="table-row" key={`skeleton-${index}`} style={{ gridTemplateColumns: "60px 1fr 200px 140px" }}>
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedSubjects.map((item, index) => (
                <div className="table-row" key={item.id} style={{ gridTemplateColumns: "60px 1fr 200px 140px" }}>
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="table-main">
                    <div className="table-title">{item.tenMon}</div>
                    <div className="table-meta">ID: {item.id}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span className="role-pill">{getEvaluationLabel(item)}</span>
                  </div>
                  <div className="table-actions">
                    <button
                      className="btn-outline btn-sm"
                      onClick={() => openEdit(item)}
                    >
                      Sửa
                    </button>
                    <button
                      className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteClick(item)}
                      title="Xóa"
                    >
                      <MaterialIcon name="delete" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
        <div className="pagination">
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Trước
          </button>
          <div className="pagination-info">
            Trang {page} / {totalPages}
          </div>
          <button
            className="btn-outline btn-sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            Sau
          </button>
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingSubject ? "Cập nhật môn học" : "Thêm môn học"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Tên môn *</span>
            <input
              value={form.tenMon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tenMon: event.target.value }))
              }
              placeholder="vd: Toán, Ngữ văn, Tiếng Anh..."
            />
          </label>

          <label className="form-field">
            <span>Nhóm đánh giá *</span>
            <select
              value={form.nhomDanhGia}
              onChange={(event) => {
                const val = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  nhomDanhGia: val,
                  soDtxHocKy: val === "NHAN_XET" ? 0 : 3
                }));
              }}
            >
              <option value="DIEM_SO">Nhận xét + Điểm số</option>
              <option value="NHAN_XET">Nhận xét (Đạt/Chưa đạt)</option>
            </select>
          </label>

          {form.nhomDanhGia === "DIEM_SO" && (
            <label className="form-field">
              <span>Số ĐTX mỗi học kỳ *</span>
              <input
                type="number"
                min={1}
                max={10}
                value={form.soDtxHocKy}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, soDtxHocKy: Number(event.target.value) }))
                }
              />
            </label>
          )}

          <div className="form-field">
            <span>Khối áp dụng *</span>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {["10", "11", "12"].map((khoi) => (
                <label key={khoi} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.khoiApDung.includes(khoi)}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        khoiApDung: event.target.checked
                          ? [...prev.khoiApDung, khoi]
                          : prev.khoiApDung.filter((k) => k !== khoi)
                      }));
                    }}
                  />
                  <span>Khối {khoi}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="form-field">
            <span>Mô tả</span>
            <input
              value={form.moTa}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, moTa: event.target.value }))
              }
              placeholder="Mô tả môn học (tùy chọn)"
            />
          </label>

          {formError && <div className="form-error">{formError}</div>}
          <div className="form-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Lưu
            </button>
          </div>
        </form>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, subject: null })}>
          <div className="modal-box delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h3 className="delete-modal-title">Xác nhận xóa môn học</h3>
            <p className="delete-modal-desc">
              Bạn có chắc chắn muốn xóa môn học <strong>{deleteModal.subject?.tenMon}</strong>?
            </p>
            <p className="delete-modal-warning">
              Hành động này không thể hoàn tác.
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDeleteModal({ open: false, subject: null })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteConfirm}
              >
                Xóa môn học
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
