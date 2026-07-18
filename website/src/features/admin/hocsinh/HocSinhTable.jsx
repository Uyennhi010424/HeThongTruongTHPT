import { formatDate } from "../../../utils/helpers.js";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import {
  getGenderLabel,
  getStatusLabel,
  getStudentStatus,
  formatPhoneDisplay
} from "./hocSinhUtils.js";

export default function HocSinhTable({
  loading,
  error,
  successMessage,
  students,
  page,
  pageSize,
  totalPages,
  totalElements,
  openEdit,
  handleDelete,
  handlePageChange
}) {
  return (
    <div className="card users-table">
      <div className="table-header">
        <div>
          <div className="panel-title">Danh sách học sinh</div>
        </div>
        <div className="panel-pill">{totalElements} học sinh</div>
      </div>
      {error && <div className="table-empty">{error}</div>}
      {!error && successMessage && (
        <div className="table-success">{successMessage}</div>
      )}
      {!error && !loading && students.length === 0 && (
        <div className="table-empty">Không tìm thấy học sinh phù hợp.</div>
      )}
      <div className="table-grid student-list-grid">
        <div className="table-row table-head student-list-row">
          <div>STT</div>
          <div>Học sinh</div>
          <div>Lớp</div>
          <div>Liên hệ</div>
          <div>Năm nhập học</div>
          <div>Trạng thái</div>
          <div>Thao tác</div>
        </div>
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div className="table-row student-list-row" key={`skeleton-${index}`}>
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </div>
            ))
          : students.map((student, index) => (
              <div className="table-row student-list-row" key={student.id}>
                <div className="table-id">{page * pageSize + index + 1}</div>
                <div className="table-main">
                  <div className="table-title">{student.hoTen}</div>
                  <div className="table-meta">
                    {formatDate(student.ngaySinh) || "--"} •{" "}
                    {getGenderLabel(student.gioiTinh)}
                  </div>
                </div>
                <div>
                  <div className="table-title">
                    {student?.lop?.tenLop || "--"}
                  </div>
                </div>
                <div className="table-email">
                    {formatPhoneDisplay(student.sdt) || "--"}
                  <div className="table-meta">{student.email || ""}</div>
                </div>
                <div>
                  <div className="table-title">{student.namNhapHoc || "--"}</div>
                </div>
                <div>
                  {(() => {
                    const st = getStudentStatus(student);
                    const statusClass = st === 1 ? "status-active" : st === 2 ? "status-graduated" : "status-locked";
                    return (
                      <span className={`status-pill ${statusClass}`}>
                        {getStatusLabel(st)}
                      </span>
                    );
                  })()}
                </div>
                <div className="table-actions">
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => openEdit(student)}
                  >
                    Sửa
                  </button>
                  <button
                    className="rounded-lg p-sm text-outline hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(student)}
                    title="Ngừng học"
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
          onClick={() => handlePageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          Trước
        </button>
        <div className="pagination-info">
          Trang {page + 1} / {totalPages}
        </div>
        <button
          className="btn-outline btn-sm"
          onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
