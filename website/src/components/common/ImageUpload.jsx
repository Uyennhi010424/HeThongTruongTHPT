import React, { useRef, useState } from "react";
import { uploadImage } from "../../api/uploadApi";
import { notifyError } from "../../utils/notify";

export default function ImageUpload({ label, value, onChange, placeholder = "Chọn ảnh..." }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notifyError("Kích thước ảnh tối đa 2MB");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadImage(file);
      const url = res?.data?.data?.url;
      if (url) {
        onChange(url);
      }
    } catch (err) {
      notifyError("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-600">{label}</label>
      <div className="flex flex-col gap-3">
        {value ? (
          <div className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 w-max">
            <img 
              src={value.startsWith("http") ? value : `http://localhost:8080${value}`} 
              alt={label} 
              className="h-24 w-auto max-w-full object-contain rounded-lg bg-white shadow-sm"
              onError={(e) => {
                // If it fails, fallback to local path (for default /logo.png etc)
                if (e.target.src !== value && value.startsWith('/')) {
                  e.target.src = value;
                }
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 p-1.5 rounded-lg hover:bg-white text-slate-700 tooltip"
                title="Đổi ảnh"
              >
                <span className="material-symbols-outlined !text-[18px]">edit</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500/90 p-1.5 rounded-lg hover:bg-red-500 text-white tooltip"
                title="Xóa ảnh"
              >
                <span className="material-symbols-outlined !text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center h-24 w-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-400 mb-1">add_photo_alternate</span>
                <span className="text-xs text-slate-500 font-medium">{placeholder}</span>
              </>
            )}
          </button>
        )}
        <input 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" 
        />
      </div>
    </div>
  );
}
