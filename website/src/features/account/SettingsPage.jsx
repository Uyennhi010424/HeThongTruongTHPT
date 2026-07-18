import { useState, useEffect } from "react";
import PageHeader from "../../components/edu/PageHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { ROLES } from "../../utils/constants.js";
import { notifySuccess } from "../../utils/notify.js";

const SETTINGS_KEY = "httt_settings";

const defaultSettings = {
  theme: "light",
  notificationsEnabled: true,
  soundEnabled: false,
  compactMode: false
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...defaultSettings };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export default function SettingsPage() {
  const { role } = useAuth();
  const [settings, setSettings] = useState(loadSettings);
  const [cacheSize, setCacheSize] = useState("");

  useEffect(() => {
    // Tính kích thước cache
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += (key?.length || 0) + (value?.length || 0);
      }
      setCacheSize(total > 1024 ? `${(total / 1024).toFixed(1)} KB` : `${total} B`);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Áp dụng theme
    document.documentElement.setAttribute("data-theme", settings.theme);
    saveSettings(settings);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearCache = () => {
    try {
      // Xóa cache dữ liệu nhưng giữ lại auth và settings
      const keysToKeep = ["httt_settings"];
      const authKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) authKeys.push(key);
      }

      // Xóa localStorage (trừ settings)
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          allKeys.push(key);
        }
      }
      allKeys.forEach((key) => localStorage.removeItem(key));

      // Xóa sessionStorage (trừ auth)
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && !authKeys.includes(key)) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach((key) => sessionStorage.removeItem(key));

      setCacheSize("0 B");
      notifySuccess("Đã xóa bộ nhớ đệm thành công.");
    } catch {
      notifySuccess("Đã xóa bộ nhớ đệm.");
    }
  };

  const handleResetSettings = () => {
    setSettings({ ...defaultSettings });
    notifySuccess("Đã khôi phục cài đặt mặc định.");
  };

  const getRoleLabel = () => {
    switch (role) {
      case ROLES.ADMIN: return "Quản trị viên";
      case ROLES.GIAOVIEN: return "Giáo viên";
      case ROLES.HOCSINH: return "Học sinh";
      case ROLES.PHUHUYNH: return "Phụ huynh";
      default: return "";
    }
  };

  return (
    <div className="page users-page">
      <PageHeader title="Cài đặt" />

      <div className="card profile-card">
        <div className="profile-header-row">
          <div className="profile-header-meta">
            <div className="panel-title">Cài đặt hệ thống</div>
            <div className="panel-subtitle">Tùy chỉnh trải nghiệm cho tài khoản {getRoleLabel()}</div>
          </div>
        </div>

        <div className="settings-sections">
          {/* Giao diện */}
          <div className="settings-section">
            <div className="form-section-title">Giao diện</div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Chế độ hiển thị</div>
                <div className="settings-item-desc">Chọn giao diện sáng hoặc tối</div>
              </div>
              <div className="settings-item-control">
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting("theme", e.target.value)}
                  className="settings-select"
                >
                  <option value="light">Sáng (Light)</option>
                  <option value="dark">Tối (Dark)</option>
                </select>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Chế độ thu gọn</div>
                <div className="settings-item-desc">Giảm khoảng cách giữa các phần tử</div>
              </div>
              <div className="settings-item-control">
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting("compactMode", e.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Thông báo */}
          <div className="settings-section">
            <div className="form-section-title">Thông báo</div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Thông báo hệ thống</div>
                <div className="settings-item-desc">Nhận thông báo từ hệ thống</div>
              </div>
              <div className="settings-item-control">
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => updateSetting("notificationsEnabled", e.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Âm thanh thông báo</div>
                <div className="settings-item-desc">Phát âm thanh khi có thông báo mới</div>
              </div>
              <div className="settings-item-control">
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSetting("soundEnabled", e.target.checked)}
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Bộ nhớ */}
          <div className="settings-section">
            <div className="form-section-title">Bộ nhớ đệm</div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Dữ liệu bộ nhớ đệm</div>
                <div className="settings-item-desc">
                  Dữ liệu tạm thời được lưu trữ cục bộ · Dung lượng: {cacheSize || "Đang tính..."}
                </div>
              </div>
              <div className="settings-item-control">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={handleClearCache}
                >
                  Xóa cache
                </button>
              </div>
            </div>
          </div>

          {/* Khôi phục */}
          <div className="settings-section">
            <div className="form-section-title">Khôi phục</div>

            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Cài đặt mặc định</div>
                <div className="settings-item-desc">Khôi phục tất cả cài đặt về trạng thái ban đầu</div>
              </div>
              <div className="settings-item-control">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={handleResetSettings}
                >
                  Khôi phục
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
