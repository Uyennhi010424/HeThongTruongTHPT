import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import {
  buildStudentEmailPreview,
  formatPhoneDisplay
} from "./hocSinhUtils.js";

export default function HocSinhFormModal({
  modalOpen,
  editingStudent,
  form,
  setForm,
  formError,
  classesByGrade,
  parents,
  handleSubmit,
  onClose
}) {
  return (
    <SimpleModal
      open={modalOpen}
      title={editingStudent ? "Cập nhật học sinh" : "Thêm học sinh"}
      onClose={onClose}
      width={720}
    >
      <form className="form-grid form-grid-student" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Họ và tên</span>
          <input
            value={form.hoTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, hoTen: event.target.value }))
            }
            placeholder="vd: Nguyễn Văn A"
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
        <label className="form-field">
          <span>Lớp học</span>
          <select
            value={form.lopId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lopId: event.target.value }))
            }
          >
            <option value="">Chọn lớp</option>
            {classesByGrade.map((group) => (
              <optgroup key={group.grade} label={`Khối ${group.grade}`}>
                {group.items.map((lop) => (
                  <option key={lop.id} value={lop.id}>
                    {lop.tenLop}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Dân tộc</span>
          <input
            value={form.danTocTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, danTocTen: event.target.value }))
            }
            placeholder="vd: Kinh, Tày, Nùng..."
          />
        </label>
        <label className="form-field">
          <span>Tôn giáo</span>
          <input
            value={form.tonGiao}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, tonGiao: event.target.value }))
            }
            placeholder="vd: Không, Phật giáo..."
          />
        </label>
        <label className="form-field">
          <span>Số điện thoại</span>
          <input
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
            value={
              editingStudent ? form.email : buildStudentEmailPreview(form.hoTen)
            }
            readOnly
            placeholder="Tự động tạo theo tên học sinh"
          />
        </label>
        <label className="form-field">
          <span>Địa chỉ</span>
          <input
            value={form.diaChi}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, diaChi: event.target.value }))
            }
            placeholder="vd: 12 Nguyễn Trãi"
          />
        </label>
        <label className="form-field">
          <span>Năm nhập học</span>
          <input
            type="number"
            value={form.namNhapHoc}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, namNhapHoc: event.target.value }))
            }
            placeholder="vd: 2023"
          />
        </label>
        <label className="form-field">
          <span>Mã BHYT</span>
          <input
            value={form.maBhyt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maBhyt: event.target.value }))
            }
            placeholder="vd: BHYT1234"
          />
        </label>
        <label className="form-field">
          <span>Diện chính sách</span>
          <select
            value={form.dienChinhSach}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, dienChinhSach: event.target.value }))
            }
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        </label>
        <label className="form-field">
          <span>Trạng thái</span>
          <select
            value={form.trangThai}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                trangThai: Number(event.target.value)
              }))
            }
          >
            <option value={1}>Đang học</option>
            <option value={0}>Ngừng học</option>
          </select>
        </label>
        <div className="form-section-title">Thông tin phụ huynh</div>
        <label className="form-field">
          <span>Phụ huynh (đã có)</span>
          <select
            value={form.phuHuynhId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhId: event.target.value }))
            }
          >
            <option value="">Chọn phụ huynh có sẵn</option>
            {parents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.hoTen || `Phụ huynh #${item.id}`}
                {item.soDienThoai ? ` - ${formatPhoneDisplay(item.soDienThoai)}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Họ tên phụ huynh</span>
          <input
            value={form.phuHuynhHoTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhHoTen: event.target.value }))
            }
            placeholder="vd: Nguyễn Văn B"
          />
        </label>
        <label className="form-field">
          <span>SĐT phụ huynh</span>
          <input
            value={form.phuHuynhSdt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhSdt: event.target.value }))
            }
            placeholder="vd: 0901234567"
          />
        </label>
        <label className="form-field">
          <span>Email phụ huynh</span>
          <input
            value={form.phuHuynhEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhEmail: event.target.value }))
            }
            placeholder="vd: phuhuynh@gmail.com"
          />
        </label>
        <label className="form-field">
          <span>Nghề nghiệp phụ huynh</span>
          <input
            value={form.phuHuynhNgheNghiep}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                phuHuynhNgheNghiep: event.target.value
              }))
            }
            placeholder="vd: Kinh doanh"
          />
        </label>
        {formError && <div className="form-error">{formError}</div>}
        <div className="form-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={onClose}
          >
            Hủy
          </button>
          <button type="submit" className="btn-primary">
            {editingStudent ? "Cập nhật" : "Thêm học sinh"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
