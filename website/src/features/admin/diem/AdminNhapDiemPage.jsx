import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Send, CalendarDays, Loader2 } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getDiemProgressSummary, guiBangDiemTuDong } from "../../../api/diemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import { getVisibleAcademicYears, getActiveAcademicYear } from "../../../utils/helpers.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import DiemProgressTable from "./DiemProgressTable.jsx";

export default function AdminNhapDiemPage() {
  const currentSemester = 1;
  const [namHoc, setNamHoc] = useState("");
  const [hocKy, setHocKy] = useState(currentSemester);
  const [sendHocKy, setSendHocKy] = useState(currentSemester);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const [sending, setSending] = useState(false);
  const { searchQuery, setIsSearchVisible, setSearchPlaceholder } = useAdminSearch();

  useEffect(() => {
    setIsSearchVisible(true);
    setSearchPlaceholder("Tìm kiếm bảng điểm...");

    return () => {
      setIsSearchVisible(false);
      setSearchPlaceholder("Tìm kiếm...");
    };
  }, [setIsSearchVisible, setSearchPlaceholder]);

  useEffect(() => {
    getNamHoc()
      .then(res => {
        const years = res?.data?.data || [];
        const visible = getVisibleAcademicYears(years);
        const active = getActiveAcademicYear(years);
        if (active && active.tenNamHoc) {
          setNamHoc(active.tenNamHoc);
        } else if (visible.length > 0) {
          setNamHoc(visible[0].tenNamHoc);
        }
        setServerError(false);
      })
      .catch((err) => {
        const isConnRefused = !err.response; // no response = server down
        if (isConnRefused) {
          console.error("[AdminNhapDiemPage] Không thể kết nối Backend:", err.message);
          setServerError(true);
          setLoading(false);
        }
      });
  }, []);

  const fetchProgress = async () => {
    if (!namHoc || namHoc.length !== 9) return;
    setLoading(true);
    setServerError(false);
    try {
      const res = await getDiemProgressSummary({ namHoc, hocKy });
      setProgressData(res?.data?.data || []);
    } catch (err) {
      setProgressData([]);
      if (!err.response) {
        console.error("[AdminNhapDiemPage] Lỗi kết nối khi lấy tiến độ:", err.message);
        setServerError(true);
      } else {
        console.error("[AdminNhapDiemPage] Lỗi API:", err.response?.status, err.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [namHoc, hocKy]);

  const handleGuiBangDiem = async () => {
    try {
      setSending(true);
      const res = await guiBangDiemTuDong(sendHocKy);
      const msg = res?.data?.message || "Hệ thống đang tiến hành quét và gửi bảng điểm cho phụ huynh.";
      notifySuccess(msg);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Không thể thực hiện gửi bảng điểm. Vui lòng thử lại.";
      notifyError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (serverError) {
    return (
      <div className="space-y-lg">
        <PageHeader
          title="Quản lý điểm"
          description="Theo dõi tiến độ nhập điểm của giáo viên theo từng lớp và môn học."
        />
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <WifiOff className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-base font-semibold text-slate-700 mb-2">Không thể kết nối máy chủ</h3>
          <p className="text-sm text-slate-500 mb-6">Backend chưa sẵn sàng hoặc đang khởi động lại. Vui lòng thử lại sau.</p>
          <button
            onClick={fetchProgress}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Quản lý điểm"
        description="Theo dõi tiến độ nhập điểm của giáo viên theo từng lớp và môn học."
      />

      {/* Panel gửi bảng điểm cho phụ huynh */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Send size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-[15px]">Gửi bảng điểm cho phụ huynh</h3>
              <p className="text-slate-500 text-[13px]">Gửi tất cả điểm đã khóa sổ (LOCKED) chưa thông báo trong kỳ này vào hộp chat phụ huynh.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-slate-400" />
              <label className="text-[13px] text-slate-600 font-medium">Chọn kỳ gửi:</label>
              <select
                value={sendHocKy}
                onChange={e => setSendHocKy(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
              >
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
              </select>
            </div>
            <button
              onClick={handleGuiBangDiem}
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              {sending ? (
                <>Đang gửi... <Loader2 size={14} className="animate-spin" /></>
              ) : (
                <><Send size={14} /> Gửi ngay</>
              )}
            </button>
          </div>
        </div>
      </div>

      <DiemProgressTable 
        progressData={progressData}
        loading={loading}
        onRefresh={fetchProgress}
        namHoc={namHoc}
        setNamHoc={setNamHoc}
        hocKy={hocKy}
        setHocKy={setHocKy}
        searchQuery={searchQuery}
      />
    </div>
  );
}
