import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPhuHuynh, updateCurrentPhuHuynh } from "../../api/phuhuynhApi.js";
import { notifyError, notifySuccess } from "../../utils/notify.js";

export default function ParentProfileEdit() {
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    hoTen: "",
    soDienThoai: "",
    email: "",
    ngheNghiep: ""
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getCurrentPhuHuynh();
        if (!active) return;
        const p = res?.data?.data;
        if (p) {
          setParent(p);
          setFormData({
            hoTen: p.hoTen || "",
            soDienThoai: p.soDienThoai || "",
            email: p.email || "",
            ngheNghiep: p.ngheNghiep || ""
          });
        }
      } catch {
        if (!active) return;
        notifyError("Không thể tải thông tin phụ huynh.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hoTen) {
      notifyError("Họ tên không được để trống!");
      return;
    }
    try {
      setSaving(true);
      await updateCurrentPhuHuynh(formData);
      notifySuccess("Cập nhật hồ sơ thành công!");
      navigate("/parent/profile");
    } catch (error) {
      notifyError(error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 min-h-screen bg-slate-50">Đang tải thông tin...</div>;
  }

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight flex items-center gap-3">
          Chỉnh sửa hồ sơ phụ huynh
        </h2>
        <p className="text-slate-500 text-[14px] mt-2">
          Cập nhật thông tin cá nhân và thông tin liên hệ.
        </p>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  name="hoTen"
                  className="w-full px-4 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl text-slate-700" 
                  value={formData.hoTen} 
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input 
                  type="text"
                  name="soDienThoai"
                  className="w-full px-4 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl text-slate-700" 
                  value={formData.soDienThoai} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  name="email"
                  className="w-full px-4 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl text-slate-700" 
                  value={formData.email} 
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                <input 
                  type="text"
                  name="ngheNghiep"
                  className="w-full px-4 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl text-slate-700" 
                  value={formData.ngheNghiep} 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white text-slate-600 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                onClick={() => navigate("/parent/profile")}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
