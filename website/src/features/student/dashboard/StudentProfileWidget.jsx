import React from "react";
import { User, Calendar, MapPin } from "lucide-react";

const StudentProfileWidget = ({ student, avatarSrc, selectedNamHoc, selectedHK, homeroomTeacher }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-6 border border-slate-100 flex-shrink-0">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200 overflow-hidden">
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800 truncate">
            {student?.hoTen || "Học sinh"}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
            <span className="font-medium">{student?.maHocSinh || "--"}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs">Đang học</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
        <div>
          <div className="text-slate-400 text-xs font-medium mb-1">Lớp</div>
          <div className="text-slate-700 font-semibold">{student?.lop?.tenLop || "--"}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-medium mb-1">GVCN</div>
          <div className="text-slate-700 font-semibold truncate" title={homeroomTeacher?.hoTen}>
            {homeroomTeacher?.hoTen || "--"}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-medium mb-1">Năm học</div>
          <div className="text-slate-700 font-semibold">{selectedNamHoc || "--"}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-medium mb-1">Học kỳ</div>
          <div className="text-slate-700 font-semibold">HK {selectedHK}</div>
        </div>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center gap-3">
          <User size={16} className="text-slate-400" />
          <span className="text-sm text-slate-600">
            Giới tính:{" "}
            <span className="font-medium text-slate-800">
              {student?.gioiTinh === "NAM" || student?.gioiTinh === "Nam" || student?.gioiTinh === "nam" || student?.gioiTinh === "true" || student?.gioiTinh === true
                ? "Nam"
                : student?.gioiTinh === "NU" || student?.gioiTinh === "Nữ" || student?.gioiTinh === "nu" || student?.gioiTinh === "nữ" || student?.gioiTinh === "false" || student?.gioiTinh === false
                ? "Nữ"
                : student?.gioiTinh || "--"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Calendar size={16} className="text-slate-400" />
          <span>
            Ngày sinh:{" "}
            <span className="font-medium text-slate-800">
              {student?.ngaySinh ? new Date(student.ngaySinh).toLocaleDateString("vi-VN") : "--"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <MapPin size={16} className="text-slate-400" />
          <span className="truncate">
            Địa chỉ:{" "}
            <span className="font-medium text-slate-800" title={student?.diaChi}>
              {student?.diaChi || "--"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileWidget;
