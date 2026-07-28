import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getDiemProgressSummary } from "../../../api/diemApi.js";
import { getNamHoc } from "../../../api/namhocApi.js";
import { useAdminSearch } from "../../../contexts/AdminSearchContext.jsx";
import DiemProgressTable from "./DiemProgressTable.jsx";

export default function AdminNhapDiemPage() {
  const [namHoc, setNamHoc] = useState("2024-2025");
  const [hocKy, setHocKy] = useState(1);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
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
        if (years.length > 0) {
          const active = years.find((nh) => nh.trangThai === "DANG_MO");
          if (active && active.tenNamHoc) {
            setNamHoc(active.tenNamHoc);
          } else {
            const unique = [...new Set(years.map(y => y.tenNamHoc || y.namHoc).filter(Boolean))].sort().reverse();
            if (unique.length > 0) setNamHoc(unique[0]);
          }
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
