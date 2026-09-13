import { useEffect, useState } from "react";
import { getThongBao } from "../../../api/thongbaoApi.js";
import { getCurrentGiaoVien } from "../../../api/giaovienApi.js";
import axiosClient from "../../../api/axiosClient.js";
import ThongBaoInbox from "./ThongBaoInbox.jsx";
import AdminRequestTab from "./AdminRequestTab.jsx";
import ParentContactTab from "./ParentContactTab.jsx";
import { getChuNhiem } from "../../../api/chunhiemApi.js";
import { webSocketService } from "../../../utils/websocket.js";



export default function TeacherThongBao() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [teacher, setTeacher] = useState(null);
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [allNotices, setAllNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async (hideLoading = false) => {
    try {
      if (!hideLoading) setLoading(true);
      const [teacherRes, noticeRes, chuNhiemRes] = await Promise.all([
        getCurrentGiaoVien().catch(() => null),
        getThongBao().catch(() => null),
        getChuNhiem().catch(() => null)
      ]);
      if (teacherRes?.data?.data) {
        const teacherData = teacherRes.data.data;
        setTeacher(teacherData);
        
        if (chuNhiemRes?.data?.data) {
          const chuNhiems = chuNhiemRes.data.data;
          const isHR = chuNhiems.some(cn => Number(cn?.giaoVien?.id ?? cn?.giaoVienId) === Number(teacherData.id));
          setIsHomeroom(isHR);
        }
      }
      if (noticeRes?.data?.data) {
        setAllNotices(noticeRes.data.data);
      }
    } catch {
      // ignore
    } finally {
      if (!hideLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let active = true;
    let userId = null;
    let subUser = null;

    const setupWebSocket = async () => {
      try {
        const userRes = await axiosClient.get("/users/me");
        if (active && userRes.data?.data) {
          userId = userRes.data.data.id;
          webSocketService.connect(() => {
            subUser = webSocketService.subscribe(`/topic/user/${userId}`, (newMessage) => {
              setAllNotices(prev => {
                if (prev.find(n => n.id === newMessage.id)) return prev;
                return [newMessage, ...prev];
              });
            });
          });
        }
      } catch {}
    };

    if (teacher) {
      setupWebSocket();
    }

    return () => {
      active = false;
      if (userId && subUser) webSocketService.unsubscribe(`/topic/user/${userId}`, subUser);
    };
  }, [teacher]);

  // Lọc thông báo cho các Tab
  const bghNotices = allNotices.filter(n => {
    const dt = (n.doiTuong || n.loai || "").split(",").map(r => r.trim());
    return (dt.includes("GIAO_VIEN") || dt.includes("ALL") || 
      (dt.includes("ADMIN") && n.senderRole === "GIAO_VIEN")) &&
      n.senderRole !== "PHU_HUYNH" && n.nguoiTao?.role !== "PHU_HUYNH";
  });
  const parentMessages = allNotices.filter(n => {
    const dt = (n.doiTuong || n.loai || "").split(",").map(r => r.trim());
    return dt.includes("PHU_HUYNH") || n.senderRole === "PHU_HUYNH" || n.nguoiTao?.role === "PHU_HUYNH";
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Thông báo & Liên lạc</h2>
          <p className="text-sm text-gray-500">Quản lý hộp thư, yêu cầu và sổ liên lạc điện tử</p>
        </div>
      </div>



      {/* TABS */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("inbox")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
            activeTab === 'inbox' 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">inbox</span>
          Liên hệ BGH / Admin
          {activeTab === 'inbox' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md"></div>}
        </button>
        {isHomeroom && (
          <button 
            onClick={() => setActiveTab("parent")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'parent' 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">family_restroom</span>
            Liên hệ phụ huynh
            {activeTab === 'parent' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-md"></div>}
          </button>
        )}
      </div>

      {/* TABS CONTENT */}
      <div className="transition-opacity duration-300">
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-blue-500 text-4xl">autorenew</span>
          </div>
        ) : (
          <>
            {activeTab === "inbox" && <ThongBaoInbox notices={bghNotices} onRefresh={() => fetchInitialData(true)} teacher={teacher} />}
            {activeTab === "parent" && isHomeroom && <ParentContactTab teacher={teacher} parentMessages={parentMessages} onRefresh={() => fetchInitialData(true)} />}
          </>
        )}
      </div>
    </div>
  );
}
