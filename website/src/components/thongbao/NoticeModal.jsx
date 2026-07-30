import { useState, useEffect } from "react";
import { X, Clock, User, Bell, Award, AlertCircle, BarChart2 } from "lucide-react";
import { Trash2 } from "lucide-react";
import { getThread } from "../../api/thongbaoApi";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

export const getNoticeConfig = (notice) => {
  const title = (notice.tieuDe || "").toLowerCase();
  const role = notice.senderRole || notice.nguoiTao?.role || "";
  
  if (title.includes("khen") || title.includes("giỏi") || title.includes("xuất sắc"))
    return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: <Award size={18} />, label: "Khen thưởng" };
  if (title.includes("vắng") || title.includes("nghỉ") || title.includes("vi phạm") || title.includes("kỷ luật"))
    return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <AlertCircle size={18} />, label: "Vi phạm / Vắng" };
  if (title.includes("điểm") || title.includes("kiểm tra") || title.includes("thi"))
    return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: <BarChart2 size={18} />, label: "Kết quả học tập" };
  if (title.includes("nhắc") || title.includes("nhở") || title.includes("cảnh báo"))
    return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: <AlertCircle size={18} />, label: "Nhắc nhở" };
  if (role === "ADMIN" || role === "BGH")
    return { color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", icon: <Bell size={18} />, label: "Nhà trường" };
  
  return { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: <Bell size={18} />, label: "Thông báo" };
};

export default function NoticeModal({ notice, onClose, onHide }) {
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const cfg = getNoticeConfig(notice);

  useEffect(() => {
    if (!notice?.id) return;
    let active = true;
    getThread(notice.id)
      .then(r => { if (active) setThread(r?.data?.data || []); })
      .catch(() => { if (active) setThread([notice]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [notice?.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-5 ${cfg.bg} border-b ${cfg.border} flex items-start gap-4 shrink-0`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${cfg.color} bg-white shadow-sm border ${cfg.border}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 pt-1 min-w-0 pr-8">
            <div className={`text-[11px] font-bold ${cfg.color} mb-1 uppercase tracking-wider`}>{cfg.label}</div>
            <h3 className="font-bold text-slate-800 text-[16px] leading-snug">{notice.tieuDe}</h3>
            <div className="text-[12px] text-slate-500 mt-2 flex items-center gap-1.5">
              <Clock size={12} />
              {formatTime(notice.ngayDang || notice.createdAt)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-current ${cfg.color}`} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {thread.map(msg => {
                const role = msg.senderRole || msg.nguoiTao?.role;
                const label = role === "GIAO_VIEN" ? "GVCN" : role === "ADMIN" ? "Nhà trường" : "Phụ huynh";
                return (
                  <div key={msg.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User size={12} className="text-slate-500" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">{label}</span>
                      <span className="text-[12px] text-slate-400">· {formatTime(msg.ngayDang || msg.createdAt)}</span>
                    </div>
                    <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed pl-8 break-words">{msg.noiDung}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
          {onHide && (
            <button
              onClick={onHide}
              className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-[14px] hover:bg-red-100 transition-colors flex items-center gap-2"
              title="Xóa thông báo này"
            >
              <Trash2 size={16} />
              Xóa
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[14px] hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
