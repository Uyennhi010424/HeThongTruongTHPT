import SimpleModal from "../../../components/modal/SimpleModal.jsx";

export default function HocSinhExcelImportModal({
  excelModalOpen,
  setExcelModalOpen,
  importing,
  excelError,
  excelWarning,
  excelSuccess,
  handleDownloadTemplate,
  handleExcelUpload
}) {
  return (
    <SimpleModal
      open={excelModalOpen}
      title="Nhập học sinh bằng file Excel"
      onClose={() => setExcelModalOpen(false)}
      width={760}
    >
      <div className="excel-import-wrap">
        <div className="table-meta" style={{ fontWeight: 700, color: "var(--navy-900)", marginBottom: 12 }}>
          Dùng đúng biểu mẫu Việt hóa. Cột bắt buộc: Họ tên, Lớp. Các cột ID học bạ /
          ID dân tộc / ID phụ huynh sẽ mặc định là 1 nếu để trống.
        </div>

        <div className="excel-actions">
          <button type="button" className="btn-outline" onClick={handleDownloadTemplate}>
            Tải biểu mẫu mẫu
          </button>
          <label className="btn-primary excel-upload-btn">
            {importing ? "Đang nhập..." : "Chọn file Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              disabled={importing}
            />
          </label>
        </div>

        {excelError && <div className="form-error">{excelError}</div>}
        {excelWarning && <div className="table-success">{excelWarning}</div>}
        {excelSuccess && <div className="table-success">{excelSuccess}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => setExcelModalOpen(false)}
          >
            Đóng
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
