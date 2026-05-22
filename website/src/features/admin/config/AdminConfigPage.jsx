import { useState } from "react";
import MaterialIcon from "../../../components/edu/MaterialIcon.jsx";
import PageHeader from "../../../components/edu/PageHeader.jsx";

const TABS = [
  { id: "sms", label: "Cấu hình SMS (ESMS)", icon: "sms" },
  { id: "ai", label: "Cấu hình AI (Gemini)", icon: "psychology" },
  { id: "general", label: "Cấu hình chung", icon: "settings" }
];

export default function AdminConfigPage() {
  const [tab, setTab] = useState("sms");
  const [saving, setSaving] = useState(false);

  const handleSaveAll = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Đã lưu cấu hình (demo UI).");
    }, 1200);
  };

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

      {tab === "sms" && <SmsTab />}
      {tab === "ai" && <AiTab />}
      {tab === "general" && <GeneralTab />}
    </div>
  );
}

function SmsTab() {
  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
      <div className="space-y-lg md:col-span-2">
        <ConfigCard title="API Key & Authentication" icon="api">
          <Field label="ESMS API Key" type="password" defaultValue="" placeholder="Nhập API Key" />
          <Field label="Secret Key" type="password" placeholder="Nhập Secret Key" />
        </ConfigCard>
        <ConfigCard title="Template tin nhắn mặc định" icon="message">
          <Field
            label="Thông báo vắng học"
            textarea
            rows={3}
            defaultValue="Truong [TEN_TRUONG] thong bao: Hoc sinh [TEN_HS] lop [LOP] nghi hoc ngay [NGAY]."
          />
          <Field
            label="Thông báo kết quả học tập"
            textarea
            rows={3}
            defaultValue="Ket qua hoc tap HK[HK] cua [TEN_HS]: Diem TB [DIEM_TB]."
          />
        </ConfigCard>
      </div>
      <div className="space-y-lg">
        <div className="rounded-xl border border-secondary/20 bg-secondary-container/10 p-xl">
          <h4 className="mb-md font-label-md text-secondary">Trạng thái kết nối</h4>
          <p className="mb-lg flex items-center gap-sm font-bold text-green-600">
            <MaterialIcon name="check_circle" />
            Sẵn sàng kết nối ESMS
          </p>
          <button
            type="button"
            className="w-full rounded-lg border border-secondary py-sm font-label-md text-secondary hover:bg-secondary/5"
          >
            Kiểm tra kết nối
          </button>
        </div>
      </div>
    </div>
  );
}

function AiTab() {
  return (
    <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
      <div className="space-y-lg md:col-span-2">
        <ConfigCard title="Google Gemini API" icon="key">
          <Field label="API Key" type="password" placeholder="AIza..." />
          <div className="grid grid-cols-2 gap-md">
            <Field label="Model Version" select options={["Gemini 1.5 Flash", "Gemini 1.5 Pro"]} />
            <div>
              <label className="mb-xs block font-label-md text-on-surface-variant">Temperature</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full accent-secondary" />
            </div>
          </div>
        </ConfigCard>
        <ConfigCard title="Kích hoạt tính năng AI" icon="toggle_on">
          <Toggle label="Tự động nhận xét học bạ" defaultChecked />
          <Toggle label="Gợi ý lộ trình học tập" defaultChecked />
          <Toggle label="Tự động soạn thảo bài kiểm tra" />
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

function GeneralTab() {
  return (
    <ConfigCard title="Cấu hình hệ thống chung" icon="language" className="max-w-2xl">
      <div className="grid grid-cols-2 gap-lg">
        <Field label="Tên hệ thống" defaultValue="EduManager Pro - THPT" />
        <Field label="Múi giờ" select options={["(UTC+07:00) Bangkok, Hanoi"]} />
      </div>
      <Field label="Email quản trị viên" type="email" defaultValue="admin@school.edu.vn" />
      <label className="flex items-center gap-md">
        <input type="checkbox" className="h-5 w-5 rounded text-secondary focus:ring-secondary" />
        <span className="font-body-md">Cho phép giáo viên tự reset mật khẩu học sinh</span>
      </label>
      <label className="flex items-center gap-md">
        <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-secondary focus:ring-secondary" />
        <span className="font-body-md">Bật chế độ bảo trì hệ thống</span>
      </label>
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

function Field({ label, type = "text", textarea, rows = 3, select, options = [], ...props }) {
  const inputClass =
    "w-full rounded-lg border-outline-variant bg-surface-bright p-md font-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-secondary";
  return (
    <div>
      <label className="mb-xs block font-label-md text-on-surface-variant">{label}</label>
      {textarea ? (
        <textarea rows={rows} className={inputClass} {...props} />
      ) : select ? (
        <select className={inputClass} {...props}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={type} className={inputClass} {...props} />
      )}
    </div>
  );
}

function Toggle({ label, defaultChecked }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/30 py-sm last:border-0">
      <p className="font-label-md text-on-surface">{label}</p>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" className="peer sr-only" defaultChecked={defaultChecked} />
        <div className="h-6 w-11 rounded-full bg-outline-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:bg-white after:transition-all peer-checked:bg-secondary peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
