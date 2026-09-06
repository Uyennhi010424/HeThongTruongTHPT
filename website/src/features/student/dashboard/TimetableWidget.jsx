import React, { useMemo } from "react";
import { CalendarDays, User } from "lucide-react";

import { formatDate } from "../../../utils/helpers.js";

const getDayLabel = (day) => {
  if (day === 8) return "Chủ nhật";
  return `Thứ ${day}`;
};

const TimetableWidget = ({ 
  timetable, 
  isSummerBreak, 
  isNotStartedYet, 
  schoolStartDate, 
  isExamWeek, 
  todayDay, 
  subjectColorMap, 
  getSubjectName 
}) => {
  const todayLabel = `${getDayLabel(todayDay)}, ${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  const todayTimetable = useMemo(() => {
    if (isSummerBreak || isNotStartedYet || isExamWeek) return [];
    return [...timetable]
      .filter((i) => i.thu === todayDay)
      .sort((a, b) => (a.tietBatDau || 0) - (b.tietBatDau || 0));
  }, [timetable, todayDay, isSummerBreak, isNotStartedYet, isExamWeek]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-600" />
          <h3 className="text-base font-bold text-slate-800">Lịch học hôm nay</h3>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{todayLabel}</span>
      </div>

      {todayTimetable.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <CalendarDays size={28} className={isExamWeek ? "text-red-400" : isNotStartedYet ? "text-blue-500" : "text-slate-300"} />
          </div>
          <div className={`font-semibold text-sm ${isExamWeek ? 'text-red-500' : isNotStartedYet ? 'text-blue-600' : 'text-slate-600'}`}>
            {isNotStartedYet 
              ? `Năm học mới bắt đầu từ ${schoolStartDate ? formatDate(schoolStartDate) : "07/09/2026"}`
              : isSummerBreak 
              ? "Đang trong thời gian nghỉ hè!" 
              : isExamWeek 
              ? "Tuần này là Tuần Thi" 
              : "Không có tiết học hôm nay"}
          </div>
          {isNotStartedYet && (
            <div className="text-slate-400 text-xs mt-1 max-w-[260px] leading-relaxed">
              Thời khóa biểu sẽ chính thức bắt đầu áp dụng từ ngày {schoolStartDate ? formatDate(schoolStartDate) : "07/09/2026"}.
            </div>
          )}
          {!isNotStartedYet && !isSummerBreak && !isExamWeek && <div className="text-slate-400 text-xs mt-1">Nghỉ ngơi thật tốt nhé!</div>}
          {isExamWeek && <div className="text-red-400 text-xs mt-1">Lịch học tạm dừng. Chúc bạn thi tốt!</div>}
        </div>
      ) : (
        <div className="overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
          <div className="relative pl-3 border-l-2 border-slate-100 flex flex-col gap-4 py-1">
            {todayTimetable.map((t, idx) => {
              const mid = t.monHoc?.id || t.monHocId;
              const sName = mid ? getSubjectName(mid) : "Không có lịch học";
              const color = mid ? (subjectColorMap[mid] || "#2563EB") : "#94a3b8";
              return (
                <div key={idx} className="relative">
                  <div
                    className="absolute w-3 h-3 rounded-full -left-[19px] top-1.5 border-2 border-white"
                    style={{ backgroundColor: color, boxShadow: "0 0 0 1px #e2e8f0" }}
                  ></div>

                  <div className="flex flex-col">
                    <div className="text-xs font-semibold text-slate-500 mb-1">
                      Tiết {t.tietBatDau}
                      {t.soTiet > 1 ? ` - ${t.tietBatDau + t.soTiet - 1}` : ""}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl rounded-tl-sm border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="font-bold text-slate-800 mb-1" style={{ color: color }}>
                        {sName}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <User size={14} className="text-slate-400" />
                          GV. {t.giaoVien?.hoTen || "--"}
                        </span>
                      </div>
                      {t.ghiChu && (
                        <div className="mt-2 inline-block px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded truncate border border-amber-100">
                          📝 {t.ghiChu}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableWidget;
