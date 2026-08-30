import React from 'react';
import { ChevronRight } from 'lucide-react';

const formatDateTimeDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
};

export default function BaoCongThongBaoUI({ notices, onNoticeClick }) {
  const handleNoticeClick = (notice) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('eduReadNoticeIds') || '[]');
      if (!readIds.includes(notice.id)) {
        const newReadIds = [...readIds, notice.id];
        localStorage.setItem('eduReadNoticeIds', JSON.stringify(newReadIds));
        window.dispatchEvent(new Event('storage')); // trigger update if needed
      }
    } catch (e) {}
    if (onNoticeClick) onNoticeClick(notice);
  };
  const featuredNotices = notices.slice(0, 2);
  const listNotices = notices.slice(2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full max-w-7xl mx-auto my-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">Thông báo</h2>
      
      {/* Tab */}
      <div className="flex border-b border-slate-200 mb-6">
        <div className="pb-3 border-b-2 border-blue-900 text-blue-900 font-medium px-2 flex items-center gap-2 cursor-pointer">
          Thông báo
          {notices.length > 0 && (
            <span className="w-5 h-5 rounded-full border border-blue-900 text-blue-900 text-xs flex items-center justify-center font-bold">
              {notices.length}
            </span>
          )}
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="text-slate-500 italic py-8 text-center">Không có thông báo nào.</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Featured Notices */}
          {featuredNotices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  className="flex flex-col border border-slate-200 hover:border-blue-900/30 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group bg-white"
                  onClick={() => handleNoticeClick(notice)}
                >
                  <div className="w-full h-48 sm:h-56 md:h-64 bg-orange-50/50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <img 
                      src="/images/notification_graphic.jpg" 
                      alt="Illustration" 
                      className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-1 bg-white">
                    <h3 className="text-[15px] font-bold text-slate-900 uppercase leading-snug group-hover:text-blue-900 transition-colors line-clamp-3">
                      {notice.tieuDe}
                    </h3>
                    <div className="mt-auto">
                      <div className="text-[13px] font-semibold text-red-500">
                        {formatDateTimeDateOnly(notice.ngayDang)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List Notices */}
          {listNotices.length > 0 && (
            <div className="flex flex-col gap-4 mt-2">
              {listNotices.map((notice) => (
                <div 
                  key={notice.id}
                  className="flex items-start gap-3 cursor-pointer group py-2"
                  onClick={() => handleNoticeClick(notice)}
                >
                  <ChevronRight className="w-5 h-5 text-orange-500 shrink-0 mt-[2px]" />
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[14px] font-bold text-slate-600 uppercase group-hover:text-blue-900 transition-colors leading-relaxed">
                      {notice.tieuDe}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">
                      {formatDateTimeDateOnly(notice.ngayDang)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
