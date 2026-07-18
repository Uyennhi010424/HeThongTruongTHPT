import { useState, useEffect } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";
import { getAdminConfigs, batchUpsertConfig, testSmsConnection } from "../../../api/adminConfigApi.js";
import { notifySuccess, notifyError } from "../../../utils/notify.js";

const TABS = [
  { id: "sms", label: "Cấu hình SMS (ESMS)", icon: "sms" },
  { id: "ai", label: "Cấu hình AI (Gemini)", icon: "psychology" },
  { id: "general", label: "Cấu hình chung", icon: "settings" }
];

const CONFIG_KEYS = {
  sms_api_key: "",
  sms_api_secret: "",
  sms_brand_name: "",
  sms_template_absent: "Truong [TEN_TRUONG] thong bao: Hoc sinh [TEN_HS] lop [LOP] nghi hoc ngay [NGAY].",
  sms_template_score: "Ket qua hoc tap HK[HK] cua [TEN_HS]: Diem TB [DIEM_TB].",
  ai_api_key: "",
  ai_model: "Gemini 1.5 Flash",
  ai_temperature: "0.7",
  ai_auto_comment: "true",
  ai_learning_path: "true",
  ai_auto_exam: "false",
  school_name: "EduManager Pro - THPT",
  timezone: "(UTC+07:00) Bangkok, Hanoi",
  admin_email: "admin@school.edu.vn",
  allow_teacher_reset_student_pw: "false",
  maintenance_mode: "false"
};

export default function AdminConfigPage() {
  const [tab, setTab] = useState("sms");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
              mapped[item.configKey] = item.configValue || "";
            }
          });
          setConfigs(mapped);
        }
      } catch {
        // Use defaults if API fails
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const updateConfig = (key, value) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await batchUpsertConfig(configs);
      notifySuccess("Đã lưu cấu hình thành công!");
    } catch {
      notifyError("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-lg">
        <PageHeader title="Cấu hình Hệ thống" description="Đang tải cấu hình..." />
        <div className="flex items-center justify-center py-3xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        title="Cấu hình Hệ thống"
        description="Thiết lập tham số cho dịch vụ tin nhắn SMS, tích hợp AI và các cấu hình vận hành chung."
        actions={
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-sm rounded-xl bg-primary px-xl py-sm font-label-md text-on-primary shadow-md transition-all hover:scale-[1.02] disabled:opacity-70"
          >
            <MaterialIcon name="save" />
            {saving ? "Đang lưu..." : "Lưu tất cả thay đổi"}
          </button>
        }
      />

      <div className="flex gap-xl overflow-x-auto border-b border-outline-variant">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-sm whitespace-nowrap px-md py-sm font-label-md transition-all ${
              tab === t.id ? "tab-active" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <MaterialIcon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sms" && <SmsTab configs={configs} updateConfig={updateConfig} />}
      {tab === "ai" && <AiTab configs={configs} updateConfig={updateConfig} />}
      {tab === "general" && <GeneralTab configs={configs} updateConfig={updateConfig} />}
    </div>
  );
}

function SmsTab({ configs, updateConfig }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSmsConnection();
      const data = res?.data?.data;
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Lỗi kết nối server" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
      <div className="space-y-lg md:col-span-2">
        <ConfigCard title="API Key & Authentication" icon="api">
          <Field
            label="ESMS API Key"
            type="password"
            value={configs.sms_api_key}
            onChange={(e) => updateConfig("sms_api_key", e.target.value)}
            placeholder="Nhập API Key"
          />
          <Field
            label="Secret Key"
            type="password"
            value={configs.sms_api_secret}
            onChange={(e) => updateConfig("sms_api_secret", e.target.value)}
            placeholder="Nhập Secret Key"
          />
          <Field
            label="Brand Name"
            value={configs.sms_brand_name}
            onChange={(e) => updateConfig("sms_brand_name", e.target.value)}
            placeholder="Tên thương hiệu SMS"
          />
        </ConfigCard>
        <ConfigCard title="Template tin nhắn mặc định" icon="message">
          <Field
            label="Thông báo vắng học"
            textarea
            rows={3}
            value={configs.sms_template_absent}
            onChange={(e) => updateConfig("sms_template_absent", e.target.value)}
          />
          <Field
            label="Thông báo kết quả học tập"
            textarea
            rows={3}
            value={configs.sms_template_score}
            onChange={(e) => updateConfig("sms_template_score", e.target.value)}
          />
        </ConfigCard>
      </div>
      <div className="space-y-lg">
        <div className="rounded-xl border border-secondary/20 bg-secondary-container/10 p-xl">
          <h4 className="mb-md font-label-md text-secondary">Trạng thái kết nối</h4>

          {testResult ? (
            <div className={`mb-lg flex items-center gap-sm rounded-lg p-md text-body-sm ${
              testResult.success
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              <MaterialIcon name={testResult.success ? "check_circle" : "error"} />
              {testResult.message}
            </div>
          ) : (
            <p className="mb-lg flex items-center gap-sm font-bold text-on-surface-variant">
              <MaterialIcon name="info" />
              Nhập API Key và nhấn Kiểm tra kết nối
            </p>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full rounded-lg border border-outline-variant py-sm font-label-md text-on-surface-variant transition-all hover:bg-secondary-container/30 disabled:opacity-50"
          >
            {testing ? (
              <span className="flex items-center justify-center gap-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Đang kiểm tra...
              </span>
            ) : (
              "Kiểm tra kết nối"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AiTab({ configs, updateConfig }) {
  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
      <div className="space-y-lg md:col-span-2">
        <ConfigCard title="Google Gemini API" icon="key">
          <Field
            label="API Key"
            type="password"
            value={configs.ai_api_key}
            onChange={(e) => updateConfig("ai_api_key", e.target.value)}
            placeholder="AIza..."
          />
          <div className="grid grid-cols-2 gap-md">
            <Field
              label="Model Version"
              select
              value={configs.ai_model}
              onChange={(e) => updateConfig("ai_model", e.target.value)}
              options={["Gemini 1.5 Flash", "Gemini 1.5 Pro"]}
            />
            <div>
              <label className="mb-xs block font-label-md text-on-surface-variant">
                Temperature: {configs.ai_temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={configs.ai_temperature}
                onChange={(e) => updateConfig("ai_temperature", e.target.value)}
                className="w-full accent-secondary"
              />
            </div>
          </div>
        </ConfigCard>
        <ConfigCard title="Kích hoạt tính năng AI" icon="toggle_on">
          <Toggle
            label="Tự động nhận xét học bạ"
            checked={configs.ai_auto_comment === "true"}
            onChange={(v) => updateConfig("ai_auto_comment", v ? "true" : "false")}
          />
          <Toggle
            label="Gợi ý lộ trình học tập"
            checked={configs.ai_learning_path === "true"}
            onChange={(v) => updateConfig("ai_learning_path", v ? "true" : "false")}
          />
          <Toggle
            label="Tự động soạn thảo bài kiểm tra"
            checked={configs.ai_auto_exam === "true"}
            onChange={(v) => updateConfig("ai_auto_exam", v ? "true" : "false")}
          />
        </ConfigCard>
      </div>
      <div className="rounded-xl bg-surface-container p-xl">
        <h4 className="text-headline-md font-semibold text-primary">Nâng tầm giáo dục</h4>
        <p className="mt-xs text-body-sm text-on-surface-variant">
          Tích hợp AI giúp giảm khối lượng công việc hành chính cho giáo viên.
        </p>
      </div>
    </div>
  );
}

function GeneralTab({ configs, updateConfig }) {
  return (
    <ConfigCard title="Cấu hình hệ thống chung" icon="language" className="max-w-2xl">
      <div className="grid grid-cols-2 gap-lg">
        <Field
          label="Tên hệ thống"
          value={configs.school_name}
          onChange={(e) => updateConfig("school_name", e.target.value)}
        />
        <Field
          label="Múi giờ"
          select
          value={configs.timezone}
          onChange={(e) => updateConfig("timezone", e.target.value)}
          options={["(UTC+07:00) Bangkok, Hanoi", "(UTC+00:00) London", "(UTC-05:00) New York"]}
        />
      </div>
      <Field
        label="Email quản trị viên"
        type="email"
        value={configs.admin_email}
        onChange={(e) => updateConfig("admin_email", e.target.value)}
      />
      <Toggle
        label="Cho phép giáo viên tự reset mật khẩu học sinh"
        checked={configs.allow_teacher_reset_student_pw === "true"}
        onChange={(v) => updateConfig("allow_teacher_reset_student_pw", v ? "true" : "false")}
      />
      <Toggle
        label="Bật chế độ bảo trì hệ thống"
        checked={configs.maintenance_mode === "true"}
        onChange={(v) => updateConfig("maintenance_mode", v ? "true" : "false")}
      />
    </ConfigCard>
  );
}

function ConfigCard({ title, icon, children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-surface-container bg-surface-container-lowest p-xl shadow-card ${className}`}
    >
      <h3 className="mb-lg flex items-center gap-sm text-headline-md font-semibold text-primary">
        <MaterialIcon name={icon} />
        {title}
      </h3>
      <div className="space-y-md">{children}</div>
    </div>
  );
}

function Field({ label, type = "text", textarea, rows = 3, select, options = [], value, onChange, ...props }) {
  const inputClass =
    "w-full rounded-lg border border-outline-variant bg-surface-bright p-md font-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-secondary";
  return (
    <div>
      <label className="mb-xs block font-label-md text-on-surface-variant">{label}</label>
      {textarea ? (
        <textarea rows={rows} className={inputClass} value={value || ""} onChange={onChange} {...props} />
      ) : select ? (
        <select className={inputClass} value={value || ""} onChange={onChange} {...props}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={type} className={inputClass} value={value || ""} onChange={onChange} {...props} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/30 py-sm last:border-0">
      <p className="font-label-md text-on-surface">{label}</p>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-white after:transition-all peer-checked:bg-secondary peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
