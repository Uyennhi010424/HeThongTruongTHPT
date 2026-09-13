import { useEffect, useCallback, useState, useRef } from "react";
import { MessageSquare, Bell, ChevronRight, Send, Inbox, X, Clock, User, AlertCircle, Award, BarChart2, MessageCircle } from "lucide-react";
import { getThongBao, getConversationByHocSinh, replyThongBao, getThread, createThongBao } from "../../api/thongbaoApi.js";
import { notifySuccess, notifyError } from "../../utils/notify.js";
import useParentStudents from "../../hooks/useParentStudents.js";
import StudentSelector from "./StudentSelector.jsx";
import NoticeModal from "../../components/thongbao/NoticeModal";
import BaoCongThongBaoUI from "../../components/common/BaoCongThongBaoUI.jsx";
import { webSocketService } from "../../utils/websocket.js";

const formatTimeShort = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

/* ── Hộp chat GVCN ─────────────────────────────────────────────── */
function GvcnChatBox({ studentId }) {
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchConversation = useCallback(async () => {
    if (!studentId) return;
    try {
      const res = await getConversationByHocSinh(studentId);
      const allMsgs = res?.data?.data || [];
      // Lọc bỏ tin nhắn SLL (bảng điểm) khỏi chat box
      const filtered = allMsgs.filter(m => !((m.tieuDe || "").toLowerCase().startsWith("[sll]") && m.senderRole === "ADMIN"));
      setConversation(filtered);
    } catch {
      setConversation([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    setLoading(true);
    fetchConversation();

    if (studentId) {
      webSocketService.connect(() => {
        webSocketService.subscribe(`/topic/chat/${studentId}`, (newMsg) => {
          setConversation(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            if ((newMsg.tieuDe || "").toLowerCase().startsWith("[sll]") && newMsg.senderRole === "ADMIN") {
              return prev;
            }
            return [...prev, newMsg];
          });
        });
      });
      return () => {
        webSocketService.unsubscribe(`/topic/chat/${studentId}`);
      };
    }
  }, [fetchConversation, studentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyText]);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      // Tìm tin nhắn gốc từ GVCN để reply vào thread
      const rootMsg = conversation.find(
        m => !m.isReply && (m.senderRole === "GIAO_VIEN" || m.nguoiTao?.role === "GIAO_VIEN")
      );

      if (rootMsg) {
        // Đã có thread → reply vào thread đó
        await replyThongBao(rootMsg.id, {
          tieuDe: `Re: ${rootMsg.tieuDe}`,
          noiDung: replyText.trim(),
          loai: "REPLY"
        });
      } else {
        // Chưa có thread → phụ huynh chủ động tạo tin nhắn mới gửi GVCN
        await createThongBao({
          tieuDe: "[SLL] Phụ huynh liên hệ",
          noiDung: replyText.trim(),
          loai: "GIAO_VIEN",
          senderRole: "PHU_HUYNH",
          hocSinh: { id: studentId },
          isReply: false
        });
      }

      notifySuccess("Đã gửi tin nhắn!");
      setReplyText("");
      await fetchConversation();
    } catch {
      notifyError("Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 bg-blue-600 shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-[15px]">Trao đổi với Giáo viên chủ nhiệm</div>
          <div className="text-[12px] text-blue-100">Phản hồi trực tiếp với GVCN của con bạn</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-blue-400" />
            </div>
            <p className="text-slate-600 font-semibold text-[15px]">Chưa có tin nhắn nào</p>
            <p className="text-slate-400 text-sm mt-1">Bạn có thể nhắn tin trực tiếp cho Giáo viên chủ nhiệm bên dưới</p>
          </div>
        ) : (
          conversation.map(msg => {
            const isTeacher = msg.senderRole === "GIAO_VIEN" || msg.nguoiTao?.role === "GIAO_VIEN";
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${isTeacher ? "self-start" : "self-end"}`}>
                <div className={`text-[11px] text-slate-400 mb-1 px-1 ${isTeacher ? "text-left" : "text-right"}`}>
                  <strong className={isTeacher ? "text-blue-600" : "text-slate-600"}>{isTeacher ? "GVCN" : "Phụ huynh"}</strong>
                  {" · "}{formatTimeShort(msg.ngayDang)}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  isTeacher 
                    ? "bg-white text-slate-800 rounded-tl-sm border border-slate-200" 
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}>
                  {!msg.isReply && (
                    <div className="text-[12px] font-bold opacity-80 mb-1.5">{msg.tieuDe}</div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.noiDung}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập nội dung phản hồi cho giáo viên..."
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all custom-scrollbar"
            style={{ minHeight: 46, maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            className={`h-[46px] w-[46px] rounded-xl flex items-center justify-center shrink-0 transition-all ${
              (!replyText.trim() || sending) 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send size={18} className="ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ── Màn hình chính ───────────────────────────────────────────── */
export default function ParentThongBao() {
  const { students, currentStudent, selectedIndex, selectStudent, loading: studentsLoading } = useParentStudents();
  const [allNotices, setAllNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const currentStudentRef = useRef(currentStudent);
  useEffect(() => {
    currentStudentRef.current = currentStudent;
  }, [currentStudent]);
  
  // State for locally hidden notices
  const [hiddenNotices, setHiddenNotices] = useState(() => {
    try {
      const stored = localStorage.getItem("parentHiddenNotices");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleHideNotice = (noticeId) => {
    const newHidden = [...hiddenNotices, noticeId];
    setHiddenNotices(newHidden);
    localStorage.setItem("parentHiddenNotices", JSON.stringify(newHidden));
    setSelectedNotice(null);
  };

  const fetchNotices = useCallback(async () => {
    try {
      const res = await getThongBao();
      const all = res?.data?.data || [];
      const filtered = all.filter(n => {
        const dt = (n.doiTuong || n.loai || "").split(",").map(s => s.trim());
        return (dt.includes("PHU_HUYNH") || dt.includes("ALL")) &&
          !n.isReply &&
          n.senderRole !== "PHU_HUYNH" &&
          (!n.hocSinh || n.hocSinh.id === currentStudentRef.current?.id);
      });
      setAllNotices(filtered.sort((a, b) => new Date(b.ngayDang) - new Date(a.ngayDang)));
    } catch {
      setAllNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  }, [currentStudent]);

  useEffect(() => { 
    fetchNotices(); 
  }, [fetchNotices]);

  useEffect(() => { 
    
    // Đăng ký nhận thông báo real-time
    webSocketService.connect(() => {
      webSocketService.subscribe('/topic/notifications', (newNotice) => {
        // Chỉ thêm nếu là thông báo dành cho phụ huynh hoặc ALL, và không phải reply
        const dt = (newNotice.doiTuong || newNotice.loai || "").split(",").map(s => s.trim());
        if ((dt.includes("PHU_HUYNH") || dt.includes("ALL")) && 
            !newNotice.isReply && 
            newNotice.senderRole !== "PHU_HUYNH" &&
            (!newNotice.hocSinh || newNotice.hocSinh.id === currentStudentRef.current?.id)) {
          setAllNotices(prev => {
            if (prev.find(n => n.id === newNotice.id)) return prev;
            return [newNotice, ...prev];
          });
        }
      });
      
      // Lắng nghe cả thông báo riêng tư (nếu có recipientId)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.id) {
            webSocketService.subscribe(`/topic/user/${user.id}`, (newNotice) => {
              if (!newNotice.isReply && (!newNotice.hocSinh || newNotice.hocSinh.id === currentStudentRef.current?.id)) {
                setAllNotices(prev => {
                  if (prev.find(n => n.id === newNotice.id)) return prev;
                  return [newNotice, ...prev];
                });
              }
            });
          }
        } catch(e) {}
      }
    });

    return () => {
      webSocketService.unsubscribe('/topic/notifications');
      // Unsubscribe user specific topic would need exact topic string, keeping simple for now
    };
  }, [fetchNotices]);

  const displayNotices = allNotices.filter(n => !hiddenNotices.includes(n.id));

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto h-full flex flex-col">
      {/* Page header */}
      <div className="mb-6 shrink-0 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
            Hộp thư & Trao đổi
          </h2>
          <p className="text-slate-500 text-[14px] mt-2">
            Theo dõi thông báo từ nhà trường và trao đổi trực tiếp với Giáo viên chủ nhiệm
          </p>
        </div>
        <StudentSelector students={students} selectedIndex={selectedIndex} onSelect={selectStudent} />
      </div>

      <div className="flex-1 w-full mx-auto flex flex-col h-[calc(100vh-160px)] min-h-[500px] overflow-y-auto custom-scrollbar">
        {loadingNotices ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <BaoCongThongBaoUI 
            notices={displayNotices}
            onNoticeClick={(notice) => setSelectedNotice(notice)}
          />
        )}
      </div>

      {/* Floating Chat Box */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none">
        {/* Chat Window */}
        {chatOpen && (
          <div className="w-[360px] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4 pointer-events-auto transform transition-all animate-in slide-in-from-bottom-5">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button onClick={() => setChatOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            {studentsLoading ? (
              <div className="flex-1 flex justify-center items-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
              </div>
            ) : currentStudent ? (
              <GvcnChatBox studentId={currentStudent.id} />
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center bg-white p-8 text-center">
                <User size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-500 font-semibold text-[16px]">Không tìm thấy thông tin học sinh</p>
                <p className="text-slate-400 text-[14px] mt-1">Vui lòng chọn học sinh để trao đổi với giáo viên</p>
              </div>
            )}
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="pointer-events-auto w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {chatOpen ? <X size={24} /> : <MessageCircle size={28} />}
        </button>
      </div>

      {selectedNotice && (
        <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
      )}
    </div>
  );
}

