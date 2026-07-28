import { useState, useEffect } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getAdminConfigs, batchUpsertConfig } from "../../../api/adminConfigApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";
import AuditLogPage from "../audit/AuditLogPage.jsx";
import ImageUpload from "../../../components/common/ImageUpload.jsx";
import { useTheme } from "../../../contexts/ThemeContext.jsx";

const TABS = [
  { id: "interface", label: "Giao diện", icon: "palette" },
  { id: "audit", label: "Nhật ký hệ thống", icon: "history" },
  { id: "login_audit", label: "Nhật ký đăng nhập", icon: "login" },
];

const CONFIG_KEYS = {
  theme_mode: "light",
  theme_color: "#1d4ed8",
  system_name: "EduManager Pro",
  website_title: "EduManager Pro - Quản lý trường học",
  theme_logo: "/logo.png",
  theme_favicon: "/logo.png",
  theme_login_bg: "",
  theme_footer: "© 2026 EduManager Pro. All rights reserved.",
};

export default function SettingsPage() {
  const [tab, setTab] = useState("interface");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [configs, setConfigs] = useState({ ...CONFIG_KEYS });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getAdminConfigs();
        if (!active) return;
        const data = res?.data?.data;
        if (Array.isArray(data)) {
          const mapped = { ...CONFIG_KEYS };
          data.forEach((item) => {
            if (item.configKey && mapped.hasOwnProperty(item.configKey)) {
              mapped[item.configKey] = item.configValue || CONFIG_KEYS[item.configKey];
            }
          });
          setConfigs(mapped);
        }
      } catch {
        // Use defaults if API fails
      } finally {
        if (active) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const { updateThemeState } = useTheme();

  const updateConfig = (key, value) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!initialLoaded) return;
    updateThemeState(configs.theme_mode, configs.theme_color, configs.theme_logo, configs.theme_favicon, configs.system_name);
  }, [configs.theme_mode, configs.theme_color, configs.theme_logo, configs.theme_favicon, configs.system_name, initialLoaded]);

  const handleSaveAll = async (silent = false) => {
    setSaving(true);
    try {
      await batchUpsertConfig(configs);
      if (!silent) notifySuccess("Đã lưu cấu hình thành công!");
    } catch {
      notifyError("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!initialLoaded) return;
    const timer = setTimeout(() => {
      handleSaveAll(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [configs, initialLoaded]);

  if (loading) {
    return (
      <div className="space-y-lg">
        <PageHeader title="Cài đặt hệ thống" description="Đang tải..." />
        <div className="flex items-center justify-center py-3xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Cài đặt hệ thống"
        description="Quản lý giao diện và nhật ký hoạt động hệ thống."
      />

      {/* HORIZONTAL TABS */}
      <div className="flex gap-xl overflow-x-auto border-b border-outline-variant hide-scrollbar bg-surface p-2 rounded-t-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-semibold text-[14px] transition-all border-b-2 ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
            }`}
          >
            <MaterialIcon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-surface p-6 rounded-b-xl min-h-[500px]">
        {tab === "interface" && <InterfaceTab configs={configs} updateConfig={updateConfig} />}
        {tab === "audit" && (
          <div className="-mx-6 -my-6">
            <AuditLogPage isEmbedded={true} logType="system" />
          </div>
        )}
        {tab === "login_audit" && (
          <div className="-mx-6 -my-6">
            <AuditLogPage isEmbedded={true} logType="login" />
          </div>
        )}
      </div>
    </div>
  );
}

function InterfaceTab({ configs, updateConfig }) {
  return (
    <div className="grid grid-cols-1 gap-lg xl:grid-cols-3 max-w-full">
      <ConfigCard title="Định dạng website" icon="web">
        <Field label="Tên hệ thống" value={configs.system_name} onChange={(e) => updateConfig("system_name", e.target.value)} />
        <Field label="Tiêu đề Website (Title)" value={configs.website_title} onChange={(e) => updateConfig("website_title", e.target.value)} />
        <Field label="Footer" value={configs.theme_footer} onChange={(e) => updateConfig("theme_footer", e.target.value)} />
      </ConfigCard>

      <ConfigCard title="Giao diện & Màu sắc" icon="format_paint">
        <div className="grid grid-cols-2 gap-md">
          <Field label="Chế độ mặc định" select options={["light", "dark", "system"]} value={configs.theme_mode} onChange={(e) => updateConfig("theme_mode", e.target.value)} />
          <Field label="Màu chủ đạo" type="color" value={configs.theme_color} onChange={(e) => updateConfig("theme_color", e.target.value)} />
        </div>
      </ConfigCard>

      <ConfigCard title="Hình ảnh & Nhận diện" icon="image">
        <ImageUpload label="Logo hệ thống" value={configs.theme_logo} onChange={(val) => updateConfig("theme_logo", val)} />
      </ConfigCard>
    </div>
  );
}

function ConfigCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface shadow-sm overflow-hidden">
      <div className="border-b border-outline-variant bg-surface-container-low px-5 py-4 flex items-center gap-3">
        <MaterialIcon name={icon} className="text-primary" />
        <h3 className="font-title-md text-on-surface">{title}</h3>
      </div>
      <div className="p-5 space-y-md">
        {children}
      </div>
    </div>
  );
}

function Field({ label, type = "text", textarea, rows = 3, select, options = [], value, onChange, ...props }) {
  const isColor = type === "color";
  const inputClass = isColor
    ? "w-full h-10 rounded-lg border border-outline p-1 cursor-pointer outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary bg-surface"
    : "w-full rounded-lg border border-outline px-4 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-on-surface placeholder:text-on-surface-variant";
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-on-surface-variant">{label}</label>
      {textarea ? (
        <textarea rows={rows} className={inputClass} value={value || ""} onChange={onChange} {...props} />
      ) : select ? (
        <select className={inputClass} value={value || ""} onChange={onChange} {...props}>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={type} className={inputClass} value={value || ""} onChange={onChange} {...props} />
      )}
    </div>
  );
}
