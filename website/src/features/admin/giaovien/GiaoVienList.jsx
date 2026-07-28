import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  createGiaoVien,
  deleteGiaoVien,
  getGiaoVien,
  updateGiaoVien
} from "../../../api/giaovienApi.js";
import { getLop } from "../../../api/lopApi.js";
import { createUser, getUsers } from "../../../api/userApi.js";
import Pagination from "../../../components/common/Pagination.jsx";
import CachedAvatar from "../../../components/common/CachedAvatar.jsx";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeTeacher = (teacher) => {
  if (!teacher) return teacher;
  return {
    ...teacher,
    sdt: teacher.sdt || teacher.soDienThoai || ""
  };
};

const getGenderLabel = (value) => {
  if (value === true) return "Nam";
  if (value === false) return "Nữ";
  return "--";
};

const getApiErrorMessage = (err, fallback) => {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
};

const normalizeEmailPart = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildTeacherEmailPreview = (fullName) => {
  const normalized = normalizeEmailPart(fullName);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (!parts.length) return "";

  const firstLetters = parts.slice(0, -1).map((part) => part[0]).join("");
  const lastName = parts[parts.length - 1];
  const localPart = `${firstLetters}${lastName}` || "giaovien";
  return `${localPart}c3@tdn.edu.vn`;
};

const notifyUsersUpdated = () => {
  window.dispatchEvent(new Event("users-updated"));
  window.localStorage.setItem("usersUpdatedAt", String(Date.now()));
};

export default function GiaoVienList() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { searchQuery: keyword, setSearchPlaceholder, setIsSearchVisible } = useAdminSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: "true",
    boMon: "",
    trinhDo: "",
    sdt: "",
    email: ""
  });

  const ensureTeacherUserAccount = async (teacher, fallbackFullName = "") => {
    const candidate =
      String(teacher?.email || "").trim() || buildTeacherEmailPreview(fallbackFullName);

    if (!candidate) return;

    try {
      const usersResponse = await getUsers();
      const users = usersResponse?.data?.data || [];
      const normalizedCandidate = candidate.toLowerCase();

      const exists = users.some((user) => {
        const username = String(user?.username || "").trim().toLowerCase();
        const email = String(user?.email || "").trim().toLowerCase();
        return username === normalizedCandidate || email === normalizedCandidate;
      });

      if (exists) return;

      await createUser({
        username: candidate,
        email: candidate,
        password: "Abc1234@",
        status: 1,
        role: "GIAOVIEN"
      });
    } catch {
      // Keep teacher creation successful even if fallback account creation fails.
    }
  };

  const isHomeroomTeacher = (teacher) => Boolean(teacher?.isGvcn);

  useEffect(() => {
    setSearchPlaceholder("Tìm kiếm giáo viên...");
    setIsSearchVisible(true);
    return () => {
      setSearchPlaceholder("Tìm kiếm...");
      setIsSearchVisible(true);
    };
  }, [setSearchPlaceholder, setIsSearchVisible]);

  useEffect(() => {
    let active = true;

    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError("");
        const [teacherResult, classResult] = await Promise.allSettled([
          getGiaoVien(),
          getLop()
        ]);
        if (!active) return;

        if (teacherResult.status !== "fulfilled") {
          setError("Không thể tải danh sách giáo viên.");
          setTeachers([]);
          return;
        }

        setTeachers((teacherResult.value?.data?.data || []).map(normalizeTeacher));
        setClasses(
          classResult.status === "fulfilled" ? classResult.value?.data?.data || [] : []
        );
      } catch (err) {
        if (!active) return;
        setError("Không thể tải danh sách giáo viên.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTeachers();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = teachers.length;
    const maleCount = teachers.filter((item) => item.gioiTinh === true).length;
    const femaleCount = teachers.filter((item) => item.gioiTinh === false).length;
    const homeroomCount = teachers.filter((item) => isHomeroomTeacher(item)).length;
    return { total, maleCount, femaleCount, homeroomCount };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!keyword.trim()) return teachers;
    const lower = keyword.toLowerCase();
    return teachers.filter((teacher) =>
      [teacher.hoTen, teacher.boMon, teacher.trinhDo, teacher.sdt, teacher.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(lower))
    );
  }, [keyword, teachers]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  }, [filteredTeachers.length, pageSize]);

  const pagedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreate = () => {
    setEditingTeacher(null);
    setForm({
      hoTen: "",
      ngaySinh: "",
      gioiTinh: "true",
      boMon: "",
      trinhDo: "",
      sdt: "",
      email: ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      hoTen: teacher.hoTen || "",
      ngaySinh: formatDateInput(teacher.ngaySinh),
      gioiTinh: String(teacher.gioiTinh ?? true),
      boMon: teacher.boMon || "",
      trinhDo: teacher.trinhDo || "",
      sdt: teacher.sdt || "",
      email: teacher.email || ""
    });
    setFormError("");
    setSuccessMessage("");
    setModalOpen(true);
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Xóa giáo viên ${teacher.hoTen}?`)) return;
    try {
      await deleteGiaoVien(teacher.id);
      setTeachers((prev) => prev.filter((item) => item.id !== teacher.id));
      setError("");
      setSuccessMessage("Xóa giáo viên thành công.");
    } catch (err) {
      setError("Không thể xóa giáo viên.");
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!form.hoTen.trim()) {
      setFormError("Vui lòng nhập họ tên.");
      return;
    }

    const payload = {
      hoTen: form.hoTen.trim(),
      ngaySinh: form.ngaySinh || null,
      gioiTinh: form.gioiTinh === "true",
      boMon: form.boMon.trim() || null,
      trinhDo: form.trinhDo.trim() || null,
      soDienThoai: form.sdt.trim() || null,
      email: editingTeacher
        ? form.email.trim() || null
        : buildTeacherEmailPreview(form.hoTen) || null
    };

    try {
      let savedTeacher = null;
      if (editingTeacher) {
        const response = await updateGiaoVien(editingTeacher.id, payload);
        const updated = normalizeTeacher(response?.data?.data);
        if (!updated.username && editingTeacher.username) {
          updated.username = editingTeacher.username;
        }
        savedTeacher = updated;
        setTeachers((prev) =>
          prev.map((item) => (item.id === editingTeacher.id ? updated : item))
        );
      } else {
        const response = await createGiaoVien(payload);
        const created = normalizeTeacher(response?.data?.data);
        const normalizedCreated = {
          ...created,
          email: created?.email || buildTeacherEmailPreview(form.hoTen)
        };
        savedTeacher = normalizedCreated;
        setTeachers((prev) => [normalizedCreated, ...prev]);
        await ensureTeacherUserAccount(normalizedCreated, form.hoTen);
        notifyUsersUpdated();
      }

      setError("");
      setSuccessMessage(
        editingTeacher ? "Cập nhật giáo viên thành công." : "Thêm giáo viên thành công."
      );
      setModalOpen(false);
    } catch (err) {
      setFormError(
        getApiErrorMessage(err, "Không thể lưu hồ sơ giáo viên. Vui lòng thử lại.")
      );
      setSuccessMessage("");
    }
  };

  return (
    <div className="page users-page">
      <PageHeader
        title="Danh mục giáo viên"
        description={loading ? "Đang tải dữ liệu..." : `Tổng cộng: ${stats.total} giáo viên (${stats.maleCount} nam, ${stats.femaleCount} nữ) - ${stats.homeroomCount} GVCN`}
        actions={
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 ml-auto">
            <button className="btn-primary" onClick={openCreate}>
              Thêm giáo viên
            </button>
          </div>
        }
      />


      <div className="card users-table">
        {error && <div className="table-empty">{error}</div>}
        {!error && successMessage && <div className="table-success">{successMessage}</div>}
        {!error && !loading && filteredTeachers.length === 0 && (
          <div className="table-empty">Không tìm thấy giáo viên phù hợp.</div>
        )}
        <div className="table-grid">
          <div className="table-row table-head">
            <div>STT</div>
            <div>Giáo viên</div>
            <div>Bộ môn</div>
            <div>Trình độ</div>
            <div>Liên hệ</div>
            <div>Chủ nhiệm</div>
            <div>Thao tác</div>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="table-row"
                  key={`skeleton-${index}`}
                  style={{ gridTemplateColumns: "80px 1.2fr 1fr 1fr 1.2fr 140px 160px" }}
                >
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                </div>
              ))
            : pagedTeachers.map((teacher, index) => (
                <div
                  className="table-row"
                  key={teacher.id}
                  style={{ gridTemplateColumns: "80px 1.2fr 1fr 1fr 1.2fr 140px 160px" }}
                >
                  <div className="table-id">{(page - 1) * pageSize + index + 1}</div>
                  <div className="flex items-center gap-3">
                    <CachedAvatar
                      username={teacher.username || teacher.email}
                      role="teacher"
                      src={teacher.anhDaiDien}
                      fallback={(() => {
                        const parts = (teacher.hoTen || "G").trim().split(" ");
                        return parts[parts.length - 1].charAt(0).toUpperCase();
                      })()}
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-indigo-100"
                      fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0"
                    />
                    <div className="table-main" style={{ margin: 0, padding: 0 }}>
                      <div className="table-title">{teacher.hoTen}</div>
                      <div className="table-meta">
                        {formatDate(teacher.ngaySinh) || "--"} • {getGenderLabel(teacher.gioiTinh)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="table-title">{teacher.boMon || "--"}</div>
                  </div>
                  <div>
                    <div className="table-title">{teacher.trinhDo || "--"}</div>
                  </div>
                  <div className="table-email">
                    {teacher.sdt || "--"}
                    <div className="table-meta">{teacher.email || ""}</div>
                  </div>
                  <div>
                    <span className={`status-pill ${isHomeroomTeacher(teacher) ? "status-active" : ""}`}>
                      {isHomeroomTeacher(teacher) ? "Có" : "Không"}
                    </span>
                    {isHomeroomTeacher(teacher) && (
                      <div className="table-meta">
                        {teacher.tenLopChuNhiem || "--"}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(teacher)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredTeachers.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <SimpleModal
        open={modalOpen}
        title={editingTeacher ? "Cập nhật giáo viên" : "Thêm giáo viên"}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid form-grid-teacher" onSubmit={handleSubmit}>
          <div className="form-section-title">Thông tin cá nhân</div>
          <label className="form-field">
            <span>Họ và tên</span>
            <input
              value={form.hoTen}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  hoTen: event.target.value,
                  email: editingTeacher ? prev.email : buildTeacherEmailPreview(event.target.value)
                }))
              }
              placeholder="vd: Nguyễn Văn A"
              required
            />
          </label>
          <label className="form-field">
            <span>Ngày sinh</span>
            <input
              type="date"
              value={form.ngaySinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
              }
            />
          </label>
          <label className="form-field">
            <span>Giới tính</span>
            <select
              value={form.gioiTinh}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gioiTinh: event.target.value }))
              }
            >
              <option value="true">Nam</option>
              <option value="false">Nữ</option>
            </select>
          </label>

          <div className="form-section-title">Thông tin chuyên môn</div>
          <label className="form-field">
            <span>Bộ môn</span>
            <input
              value={form.boMon}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, boMon: event.target.value }))
              }
              placeholder="vd: Toán"
            />
          </label>
          <label className="form-field">
            <span>Trình độ</span>
            <input
              value={form.trinhDo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, trinhDo: event.target.value }))
              }
              placeholder="vd: Cử nhân"
            />
          </label>

          <div className="form-section-title">Thông tin liên hệ</div>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              type="tel"
              value={form.sdt}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sdt: event.target.value }))
              }
              placeholder="vd: 0901234567"
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              type="email"
              value={editingTeacher ? form.email : buildTeacherEmailPreview(form.hoTen)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="vd: nvanc3@tdn.edu.vn"
              readOnly={!editingTeacher}
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
    </div>
  );
}