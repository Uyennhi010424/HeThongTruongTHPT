import React from "react";
import { BookOpen, Clock, Award, Star } from "lucide-react";

const StatCardsWidget = ({ weekTimetable, subjectsCount, dtb, hanhKiemLabel, hkColor }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <BookOpen size={80} />
        </div>
        <div className="text-slate-500 text-xs font-semibold mb-1">Tiết học tuần này</div>
        <div className="text-3xl font-bold text-blue-600">
          {weekTimetable.reduce((acc, curr) => acc + (curr.soTiet || 1), 0)}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Clock size={80} />
        </div>
        <div className="text-slate-500 text-xs font-semibold mb-1">Số môn học</div>
        <div className="text-3xl font-bold text-amber-500">{subjectsCount}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Award size={80} />
        </div>
        <div className="text-slate-500 text-xs font-semibold mb-1">Điểm trung bình</div>
        <div className="text-3xl font-bold text-green-500">{dtb !== null ? dtb.toFixed(1) : "--"}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-200">
        <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Star size={80} />
        </div>
        <div className="text-slate-500 text-xs font-semibold mb-1">Hạnh kiểm</div>
        <div className="text-2xl font-bold mt-1" style={{ color: hkColor?.text || "#6b7280" }}>
          {hanhKiemLabel}
        </div>
      </div>
    </div>
  );
};

export default StatCardsWidget;
