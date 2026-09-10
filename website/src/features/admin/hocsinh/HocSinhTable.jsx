import { useState } from "react";
import { Edit, Trash2, ArrowRightLeft, School, ChevronDown, Calendar, Mail, Phone, User, Shield } from "lucide-react";
import { formatDate, formatPhoneDisplay, getGenderLabel } from "./hocSinhUtils.js";
import Pagination from "../../../components/common/Pagination.jsx";
import CachedAvatar from "../../../components/common/CachedAvatar.jsx";

export default function HocSinhTable({ hooks }) {
  const {
    loading, error, successMessage, pagedStudents, 
    page, pageSize, setPageSize, totalPages, filteredStudents,
    setPage, openEdit, handleDelete, setViewingStudent, setViewModalOpen,
    setTransferClassModalOpen, setTransferSchoolModalOpen, setTransferringStudent
  } = hooks;

  const [expandedStudentId, setExpandedStudentId] = useState(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col p-4 sm:p-6">
      {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}
      {!error && successMessage && <div className="p-4 mb-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold">{successMessage}</div>}

      {/* ── Desktop Full Table View (>= 1024px) ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200">
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">STT</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[220px]">Học sinh</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Lớp</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[180px]">Liên hệ</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32 whitespace-nowrap">Năm nhập học</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 whitespace-nowrap text-center">Trạng thái</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-6 mx-auto animate-pulse"></div></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse shrink-0 aspect-square"></div>
                      <div className="space-y-1.5 w-full">
                        <div className="h-4 bg-slate-100 rounded w-32 animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16 animate-pulse"></div></td>
                  <td className="px-4 py-4 space-y-1.5">
                    <div className="h-4 bg-slate-100 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-slate-100 rounded w-32 animate-pulse"></div>
                  </td>
                  <td className="px-4 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-12 mx-auto animate-pulse"></div></td>
                  <td className="px-4 py-4 text-center"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto animate-pulse"></div></td>
                  <td className="px-4 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-24 ml-auto animate-pulse"></div></td>
                </tr>
              ))
            ) : pagedStudents.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-slate-500 font-medium">
                  Không tìm thấy học sinh nào phù hợp.
                </td>
              </tr>
            ) : (
              pagedStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-sm font-bold text-slate-400 text-center">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        setViewingStudent(student);
                        setViewModalOpen(true);
                      }}
                    >
                      <CachedAvatar
                        username={student.maHocSinh}
                        role="student"
                        src={student.anhDaiDien}
                        fallback={student.hoTen ? student.hoTen.charAt(0).toUpperCase() : "H"}
                        className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-indigo-100"
                        fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 aspect-square group-hover:bg-indigo-100 transition-colors"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.hoTen}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {formatDate(student.ngaySinh) || "--"} • {getGenderLabel(student.gioiTinh)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                      {student.lopHoc?.tenLop || student.lop?.tenLop || "--"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-slate-800">{formatPhoneDisplay(student.sdt) || "--"}</div>
                    <div className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{student.email || "--"}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
                    {student.namNhapHoc || "--"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {student.trangThai === 1 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang học
                      </span>
                    ) : student.trangThai === 3 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200" title={student.truongChuyenDen ? `Chuyển đến: ${student.truongChuyenDen}` : ""}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Chuyển trường
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Ngừng học
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setTransferringStudent(student);
                          setTransferClassModalOpen(true);
                        }}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Chuyển lớp"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setTransferringStudent(student);
                          setTransferSchoolModalOpen(true);
                        }}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Chuyển trường"
                      >
                        <School className="w-4 h-4" />
                      </button>
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

      {/* ── Mobile / Tablet Accordion Card View (< 1024px) ── */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={`m-skeleton-${idx}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 aspect-square" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))
        ) : pagedStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">Không tìm thấy học sinh nào phù hợp.</div>
        ) : (
          pagedStudents.map((student, idx) => {
            const isExpanded = expandedStudentId === student.id;
            return (
              <div
                key={student.id}
                className={`rounded-xl border transition-all duration-200 bg-white overflow-hidden ${
                  isExpanded ? "border-blue-300 shadow-sm" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Collapsed Header */}
                <div
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                      {(page - 1) * pageSize + idx + 1}
                    </div>
                    <CachedAvatar
                      username={student.maHocSinh}
                      role="student"
                      src={student.anhDaiDien}
                      fallback={student.hoTen ? student.hoTen.charAt(0).toUpperCase() : "H"}
                      className="w-10 h-10 rounded-full object-cover shrink-0 aspect-square border border-indigo-100"
                      fallbackClassName="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 aspect-square"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">{student.hoTen}</span>
                        {(student.lopHoc?.tenLop || student.lop?.tenLop) && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {student.lopHoc?.tenLop || student.lop?.tenLop}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                        {student.maHocSinh || "--"} • {student.sdt || student.email || (student.trangThai === 1 ? "Đang học" : "Ngừng học")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(student)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
                      aria-label="Xem chi tiết"
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-600" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details ("Show xuống") */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Mã HS: <strong className="text-slate-800">{student.maHocSinh || "--"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>Ngày sinh: <strong className="text-slate-800">{formatDate(student.ngaySinh) || "--"}</strong> ({getGenderLabel(student.gioiTinh)})</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>SĐT: {student.sdt ? <a href={`tel:${student.sdt}`} className="font-bold text-blue-600 hover:underline">{student.sdt}</a> : <strong className="text-slate-800">--</strong>}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">Email: {student.email ? <a href={`mailto:${student.email}`} className="font-bold text-blue-600 hover:underline">{student.email}</a> : <strong className="text-slate-800">--</strong>}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                        <User className="w-4 h-4 text-purple-500 shrink-0" />
                        <span>Năm nhập học: <strong className="text-slate-800">{student.namNhapHoc || "--"}</strong></span>
                      </div>
                    </div>

                    {/* Action Bar on Mobile */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          setViewingStudent(student);
                          setViewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Xem hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          setTransferringStudent(student);
                          setTransferClassModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Chuyển lớp
                      </button>
                      <button
                        onClick={() => {
                          setTransferringStudent(student);
                          setTransferSchoolModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition-colors inline-flex items-center gap-1"
                      >
                        <School className="w-3.5 h-3.5" /> Chuyển trường
                      </button>
                      <button
                        onClick={() => handleDelete(student)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors ml-auto inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Pagination */}
      <div className="mt-4 pt-3 border-t border-slate-100">
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
