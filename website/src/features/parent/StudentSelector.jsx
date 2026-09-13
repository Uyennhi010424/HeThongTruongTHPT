import React from "react";
import { User, Users, ChevronDown } from "lucide-react";

/**
 * Dropdown chọn học sinh cho phụ huynh.
 * - Khi có 2 con trở lên: Hiển thị selector chuyển đổi giữa các con.
 * - Khi có 1 con: Hiển thị badge thông tin học sinh hiện tại.
 */
export default function StudentSelector({ students = [], selectedIndex = 0, onSelect }) {
  if (!students || students.length === 0) return null;

  if (students.length === 1) {
    const student = students[0];
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3.5 py-1.5 shadow-sm">
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
          <User size={13} />
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-slate-500 font-medium">Học sinh:</span>
          <span className="font-bold text-blue-900">{student.hoTen}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-700 text-xs font-semibold">
            {student.lop?.tenLop || student.lopHoc?.tenLop || "Chưa xếp lớp"}
          </span>
        </div>
      </div>
    );
  }

  const currentStudent = students[selectedIndex] || students[0];

  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-blue-200 bg-white px-3.5 py-1.5 shadow-sm hover:border-blue-300 transition-all">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
        <Users size={13} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-semibold text-slate-700 whitespace-nowrap">
          Đang xem con:
        </span>
        <div className="relative">
          <select
            className="appearance-none font-bold text-xs sm:text-sm text-blue-900 bg-blue-50/80 border border-blue-200 rounded-lg pl-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-blue-100/80 transition-colors"
            value={selectedIndex}
            onChange={(event) => onSelect && onSelect(Number(event.target.value))}
          >
            {students.map((student, index) => (
              <option key={student.id} value={index}>
                {student.hoTen} ({student.lop?.tenLop || student.lopHoc?.tenLop || "Chưa xếp lớp"})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
        </div>
      </div>
      <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 hidden sm:inline-block">
        {students.length} con
      </span>
    </div>
  );
}
