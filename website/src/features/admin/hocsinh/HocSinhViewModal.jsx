import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { formatDate, getGenderLabel } from "./hocSinhUtils.js";

export default function HocSinhViewModal({ hooks }) {
  const { viewModalOpen, setViewModalOpen, viewingStudent, parents } = hooks;

  return (
    <SimpleModal
      open={viewModalOpen}
      title="Chi tiết học sinh"
      onClose={() => setViewModalOpen(false)}
      width={600}
    >
      {viewingStudent && (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
              {viewingStudent.hoTen ? viewingStudent.hoTen.charAt(0).toUpperCase() : "H"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{viewingStudent.hoTen}</h3>
              <p className="text-sm font-medium text-slate-500">
                Khối {viewingStudent.lopHoc?.khoi || viewingStudent.lop?.khoi || "--"} • Lớp {viewingStudent.lopHoc?.tenLop || viewingStudent.lop?.tenLop || "--"}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Giới tính</span>
              <span className="text-sm font-medium text-slate-900">{getGenderLabel(viewingStudent.gioiTinh)}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Ngày sinh</span>
              <span className="text-sm font-medium text-slate-900">{formatDate(viewingStudent.ngaySinh) || "--"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Số điện thoại</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.sdt || "--"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Email</span>
              <span className="text-sm font-medium text-slate-900 break-all">{viewingStudent.email || "--"}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase">Địa chỉ</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.diaChi || "--"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Năm nhập học</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.namNhapHoc || "--"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Trạng thái</span>
              <span className="text-sm font-medium text-slate-900">
                {viewingStudent.trangThai === 1 ? "Đang học" : "Ngừng học"}
              </span>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Thông tin phụ huynh</h4>
            {viewingStudent.phuHuynh || viewingStudent.phuHuynhId ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Họ tên phụ huynh</span>
                  <span className="text-sm font-medium text-slate-900">
                    {viewingStudent.phuHuynh?.hoTen || (parents.find(p => p.id === viewingStudent.phuHuynhId)?.hoTen) || "--"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">SĐT phụ huynh</span>
                  <span className="text-sm font-medium text-slate-900">
                    {viewingStudent.phuHuynh?.soDienThoai || (parents.find(p => p.id === viewingStudent.phuHuynhId)?.soDienThoai) || "--"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 italic">Chưa có thông tin phụ huynh</p>
            )}
          </div>

          <div className="form-actions mt-6">
            <button
              type="button"
              className="btn-primary w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow-sm"
              onClick={() => setViewModalOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </SimpleModal>
  );
}
