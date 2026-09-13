import React, { useState, useEffect } from "react";
import SimpleModal from "../../../components/modal/SimpleModal.jsx";
import { formatDate, getGenderLabel, formatHocLuc, formatHanhKiem, formatPhoneDisplay } from "./hocSinhUtils.js";
import CachedAvatar from "../../../components/common/CachedAvatar.jsx";
import { getHocSinhLichSuHocTap } from "../../../api/hocsinhApi.js";
import { getParentsForStudent } from "../../../api/phuhuynhHocSinhApi.js";

export default function HocSinhViewModal({ hooks }) {
  const { viewModalOpen, setViewModalOpen, viewingStudent, parents } = hooks;
  const [lichSu, setLichSu] = useState([]);
  const [loadingLichSu, setLoadingLichSu] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);

  useEffect(() => {
    if (viewModalOpen && viewingStudent) {
      // 1. Initial parent info from viewingStudent or local parents cache
      const initialParent = viewingStudent.phuHuynh ||
        (viewingStudent.phuHuynhId ? (parents || []).find(p => Number(p.id) === Number(viewingStudent.phuHuynhId)) : null);
      
      setParentInfo(initialParent || null);

      // 2. Fetch linked parent from API for 100% guarantee
      if (viewingStudent.id) {
        setLoadingParent(true);
        getParentsForStudent(viewingStudent.id)
          .then((res) => {
            const fetched = res?.data?.data || [];
            if (fetched.length > 0) {
              setParentInfo(fetched[0]);
            } else if (initialParent) {
              setParentInfo(initialParent);
            } else if (viewingStudent.phuHuynhId) {
              const matched = (parents || []).find(p => Number(p.id) === Number(viewingStudent.phuHuynhId));
              if (matched) setParentInfo(matched);
            }
          })
          .catch((err) => {
            console.error("Error fetching parent for student:", err);
          })
          .finally(() => {
            setLoadingParent(false);
          });
      }

      // 3. Load study history
      setLoadingLichSu(true);
      getHocSinhLichSuHocTap(viewingStudent.id)
        .then(res => setLichSu(res.data?.data || []))
        .catch(err => console.error("Error loading lịch sử:", err))
        .finally(() => setLoadingLichSu(false));
    } else {
      setParentInfo(null);
      setLichSu([]);
    }
  }, [viewModalOpen, viewingStudent, parents]);

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
            <CachedAvatar
              username={viewingStudent.maHocSinh}
              role="student"
              src={viewingStudent.anhDaiDien}
              fallback={viewingStudent.hoTen ? viewingStudent.hoTen.charAt(0).toUpperCase() : "H"}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100"
              fallbackClassName="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl"
            />
            <div>
              <h3 className="text-xl font-bold text-blue-900">{viewingStudent.hoTen}</h3>
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
              <span className="block text-xs font-semibold text-slate-400 uppercase">Dân tộc</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.danToc || "Không rõ"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Tôn giáo</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.tonGiao || "Không"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Mã BHYT</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.maBhyt || "--"}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">Diện chính sách</span>
              <span className="text-sm font-medium text-slate-900">{viewingStudent.dienChinhSach ? "Có" : "Không"}</span>
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
            <h4 className="text-sm font-bold text-blue-900 mb-3">Thông tin phụ huynh</h4>
            {loadingParent && !parentInfo ? (
              <p className="text-sm font-medium text-slate-500 italic">Đang tải thông tin phụ huynh...</p>
            ) : parentInfo ? (
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Họ tên phụ huynh</span>
                  <span className="text-sm font-bold text-slate-900">
                    {parentInfo.hoTen || "--"}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">SĐT phụ huynh</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatPhoneDisplay(parentInfo.soDienThoai || parentInfo.sdt || "") || "--"}
                  </span>
                </div>
                {parentInfo.email && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Email phụ huynh</span>
                    <span className="text-sm font-medium text-slate-900 break-all">
                      {parentInfo.email}
                    </span>
                  </div>
                )}
                {parentInfo.ngheNghiep && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase">Nghề nghiệp</span>
                    <span className="text-sm font-medium text-slate-900">
                      {parentInfo.ngheNghiep}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 italic">Chưa có thông tin phụ huynh</p>
            )}
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100">
            <h4 className="text-sm font-bold text-blue-900 mb-3">Lịch sử học tập (Lên lớp/Chuyển lớp/Chuyển trường)</h4>
            {loadingLichSu ? (
              <p className="text-sm font-medium text-slate-500 italic">Đang tải dữ liệu...</p>
            ) : lichSu && lichSu.length > 0 ? (
              <div className="space-y-2">
                {lichSu.map((ls, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 flex-wrap gap-2">
                    <div className="flex flex-col gap-1">
                      <div>
                        <span className="font-bold text-slate-800">{ls.namHoc}</span>
                        <span className="mx-2 text-slate-400">|</span>
                        <span className="text-sm font-semibold text-slate-700">Lớp {ls.lopHoc?.tenLop}</span>
                      </div>
                      {(ls.diemTrungBinh != null || ls.hocLuc || ls.hanhKiem) && (
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {ls.diemTrungBinh != null && (
                            <span>Điểm TB: <span className="font-semibold text-slate-700">{ls.diemTrungBinh}</span></span>
                          )}
                          {ls.hocLuc && (
                            <span>Học lực: <span className="font-semibold text-slate-700">{formatHocLuc(ls.hocLuc)}</span></span>
                          )}
                          {ls.hanhKiem && (
                            <span>Hạnh kiểm: <span className="font-semibold text-slate-700">{formatHanhKiem(ls.hanhKiem)}</span></span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-2.5 py-1.5 text-xs font-bold rounded ${
                      ls.ketQua === 'Ở lại lớp' ? 'bg-red-100 text-red-700' :
                      ls.ketQua === 'Chuyển lớp' || (ls.ketQua && ls.ketQua.startsWith('Từ ')) ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      ls.ketQua === 'Tốt nghiệp' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {ls.ketQua || "Chưa có kết quả"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 italic">Chưa có lịch sử học tập</p>
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
