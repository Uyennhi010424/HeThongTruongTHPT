import { useCallback, useEffect, useState } from "react";
import axiosClient from "../../../api/axiosClient.js";
import { useConfirm } from "../../../contexts/ConfirmContext.jsx";

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function BackupPage({ isEmbedded = false }) {
  const { confirm } = useConfirm();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosClient.get("/admin/backup/list");
      setBackups(response?.data?.data || []);
    } catch {
      setError("Không thể tải danh sách bản sao lưu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const response = await axiosClient.post("/admin/backup/create");
      const result = response?.data?.data;
      setSuccess(result?.message || "Tạo bản sao lưu thành công.");
      await fetchBackups();
    } catch {
      setError("Không thể tạo bản sao lưu.");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (filename) => {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const token = localStorage.getItem("httt_token") || sessionStorage.getItem("httt_token");
    const url = `${baseURL}/admin/backup/download?filename=${encodeURIComponent(filename)}`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);

    if (token) {
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          setError("Không thể tải file sao lưu.");
        });
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRestore = async (filename) => {
    const confirmed = await confirm(
      `Bạn có chắc chắn muốn phục hồi cơ sở dữ liệu từ file "${filename}"?\n\n` +
        "Thao tác này sẽ GHI ĐÈ dữ liệu hiện tại. Hãy chắc chắn bạn đã sao lưu trước khi thực hiện."
    );
    if (!confirmed) return;

    try {
      setRestoring(filename);
      setError("");
      setSuccess("");
      await axiosClient.post(
        `/admin/backup/restore?filename=${encodeURIComponent(filename)}`
      );
      setSuccess(`Phục hồi thành công từ: ${filename}`);
    } catch {
      setError(`Không thể phục hồi từ file: ${filename}`);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className={isEmbedded ? "" : "p-6 max-w-6xl mx-auto"}>
      {!isEmbedded && (
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-blue-900 tracking-tight">
            Sao lưu & Phục hồi
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý bản sao lưu cơ sở dữ liệu hệ thống
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {creating ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Đang sao lưu...
            </span>
          ) : (
            "Tạo bản sao lưu mới"
          )}
        </button>
        <button
          onClick={fetchBackups}
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-blue-900">
            Danh sách bản sao lưu
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {backups.length} bản sao lưu
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <svg
              className="animate-spin h-6 w-6 mx-auto mb-3 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Đang tải...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có bản sao lưu nào. Nhấn "Tạo bản sao lưu mới" để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-600">STT</th>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Tên file
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Kích thước
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-600">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-600 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map((backup, index) => (
                  <tr key={backup.filename} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-mono text-gray-900">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5 text-blue-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                        {backup.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatFileSize(backup.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDateTime(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Tải về
                        </button>
                        <button
                          onClick={() => handleRestore(backup.filename)}
                          disabled={restoring === backup.filename}
                          className="px-3 py-1.5 text-sm border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {restoring === backup.filename
                            ? "Đang phục hồi..."
                            : "Phục hồi"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Lưu ý quan trọng</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>
                Thao tác phục hồi sẽ <strong>GHI ĐÈ</strong> toàn bộ dữ liệu
                hiện tại trong cơ sở dữ liệu.
              </li>
              <li>
                Hãy tạo bản sao lưu trước khi thực hiện phục hồi để tránh mất
                dữ liệu.
              </li>
              <li>
                Yêu cầu công cụ <code>mysqldump</code> và{" "}
                <code>mysql</code> được cài đặt trên server.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

