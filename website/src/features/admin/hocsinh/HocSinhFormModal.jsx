import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { formatPhoneDisplay, buildStudentEmailPreview, validateStudentAgeAndYear } from "./hocSinhUtils.js";

export default function HocSinhFormModal({ hooks }) {
  const {
    modalOpen, setModalOpen,
    editingStudent,
    form, setForm,
    formError, classesByGrade, parents,
    handleSubmit
  } = hooks;

  let selectedKhoi = null;
  for (const group of classesByGrade) {
    if (group.items.some(lop => String(lop.id) === String(form.lopHocId))) {
      selectedKhoi = group.grade;
      break;
    }
  }

  const ageError = validateStudentAgeAndYear(form.ngaySinh, form.namNhapHoc, selectedKhoi);
  
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = 2000; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <SimpleModal
      open={modalOpen}
      title={editingStudent ? "Cập nhật học sinh" : "Thêm học sinh"}
      onClose={() => setModalOpen(false)}
      width={720}
    >
      <form className="form-grid form-grid-student" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Họ và tên <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.hoTen}
            onChange={(event) => {
              const newName = event.target.value;
              setForm((prev) => ({ 
                ...prev, 
                hoTen: newName,
                email: buildStudentEmailPreview(newName)
              }));
            }}
            placeholder="vd: Nguyễn Văn A"
          />
        </label>
        <label className="form-field">
          <span>Ngày sinh <span style={{color: '#ef4444'}}>*</span></span>
          <input
            type="date"
            value={form.ngaySinh}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, ngaySinh: event.target.value }))
            }
          />
          {ageError && <div className="field-error-text" style={{color: 'red', fontSize: '0.85rem', marginTop: '4px'}}>{ageError}</div>}
        </label>
        <label className="form-field">
          <span>Giới tính <span style={{color: '#ef4444'}}>*</span></span>
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
          <span>Lớp học <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.lopHocId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lopHocId: event.target.value }))
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
          <span>Dân tộc <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.danTocTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, danTocTen: event.target.value }))
            }
            placeholder="vd: Kinh, Tày, Nùng..."
          />
        </label>
        <label className="form-field">
          <span>Tôn giáo <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.tonGiao || "Không"}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, tonGiao: event.target.value }))
            }
          >
            <option value="Không">Không</option>
            <option value="Phật giáo">Phật giáo</option>
            <option value="Công giáo">Công giáo</option>
            <option value="Thiên Chúa giáo">Thiên Chúa giáo</option>
            <option value="Cao Đài">Cao Đài</option>
            <option value="Hòa Hảo">Hòa Hảo</option>
            <option value="Tin Lành">Tin Lành</option>
            <option value="Hồi giáo">Hồi giáo</option>
            <option value="Khác">Khác</option>
            {form.tonGiao && !["Không", "Phật giáo", "Công giáo", "Thiên Chúa giáo", "Cao Đài", "Hòa Hảo", "Tin Lành", "Hồi giáo", "Khác"].includes(form.tonGiao) && (
              <option value={form.tonGiao}>{form.tonGiao}</option>
            )}
          </select>
        </label>
        <label className="form-field">
          <span>Số điện thoại <span style={{color: '#ef4444'}}>*</span></span>
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
          <span>Địa chỉ <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.diaChi}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, diaChi: event.target.value }))
            }
            placeholder="vd: 12 Nguyễn Trãi"
          />
        </label>
        <label className="form-field">
          <span>Năm nhập học <span style={{color: '#ef4444'}}>*</span></span>
          <select
            value={form.namNhapHoc || ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, namNhapHoc: event.target.value ? Number(event.target.value) : "" }))
            }
          >
            <option value="">Chọn năm nhập học</option>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Mã BHYT <span style={{color: '#ef4444'}}>*</span></span>
          <input
            value={form.maBhyt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maBhyt: event.target.value }))
            }
            placeholder="vd: BHYT1234"
          />
        </label>
        <label className="form-field">
          <span>Diện chính sách <span style={{color: '#ef4444'}}>*</span></span>
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
          <span>Trạng thái <span style={{color: '#ef4444'}}>*</span></span>
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
        
        <div className="form-section-title">Thông tin phụ huynh (Bắt buộc chọn hoặc nhập mới)</div>
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
          <span>Họ tên phụ huynh {!form.phuHuynhId && <span style={{color: '#ef4444'}}>*</span>}</span>
          <input
            value={form.phuHuynhHoTen}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phuHuynhHoTen: event.target.value }))
            }
            placeholder="vd: Nguyễn Văn B"
          />
        </label>
        <label className="form-field">
          <span>SĐT phụ huynh {!form.phuHuynhId && <span style={{color: '#ef4444'}}>*</span>}</span>
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
          <span>Nghề nghiệp phụ huynh {!form.phuHuynhId && <span style={{color: '#ef4444'}}>*</span>}</span>
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
        
        {formError && <div className="form-error col-span-2">{formError}</div>}
        
        <div className="form-actions col-span-2">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setModalOpen(false)}
          >
            Hủy
          </button>
          <button type="submit" className="btn-primary" disabled={!!ageError}>
            {editingStudent ? "Cập nhật" : "Thêm học sinh"}
          </button>
        </div>
      </form>
    </SimpleModal>
  );
}
