import { Edit, Trash2 } from "lucide-react";
import { formatDate, formatPhoneDisplay, getGenderLabel } from "./hocSinhUtils.js";
import Pagination from "../../../components/common/Pagination.jsx";

export default function HocSinhTable({ hooks }) {
  const {
    loading, error, successMessage, pagedStudents, 
    page, pageSize, setPageSize, totalPages, filteredStudents,
    setPage, openEdit, handleDelete, setViewingStudent, setViewModalOpen
  } = hooks;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {error && <div className="p-4 m-6 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}
      {!error && successMessage && <div className="p-4 m-6 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold">{successMessage}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">STT</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[240px]">Học sinh</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Năm nhập học</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8 animate-pulse"></div></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div></td>
                  <td className="px-6 py-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-32 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-16 ml-auto animate-pulse"></div></td>
                </tr>
              ))
            ) : pagedStudents.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">
                  Không tìm thấy học sinh nào phù hợp.
                </td>
              </tr>
            ) : (
              pagedStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        setViewingStudent(student);
                        setViewModalOpen(true);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-100 transition-colors">
                        {student.hoTen ? student.hoTen.charAt(0).toUpperCase() : "H"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.hoTen}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {formatDate(student.ngaySinh) || "--"} • {getGenderLabel(student.gioiTinh)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                      {student.lopHoc?.tenLop || student.lop?.tenLop || "--"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{formatPhoneDisplay(student.sdt) || "--"}</div>
                    <div className="text-xs text-slate-500 font-medium">{student.email || "--"}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-slate-700">
                    {student.namNhapHoc || "--"}
                  </td>
                  <td className="px-6 py-4">
                    {student.trangThai === 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang học
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Ngừng học
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 transition-opacity">
                      <button
                        onClick={() => openEdit(student)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Sửa học sinh"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-auto">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
          pageSizeOptions={[10, 15, 20, 50]}
        />
      </div>
    </div>
  );
}
