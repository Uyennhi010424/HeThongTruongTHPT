import SimpleModal from "../../../components/modal/SimpleModal.jsx";

export default function HocSinhExcelImportModal({ hooks }) {
  const {
    excelModalOpen, setExcelModalOpen,
    handleDownloadTemplate,
    handleExcelUpload,
    importing, excelError, excelSuccess
  } = hooks;

  return (
    <SimpleModal
      open={excelModalOpen}
      title="Nhập học sinh bằng file Excel"
      onClose={() => setExcelModalOpen(false)}
      width={760}
    >
      <div className="excel-import-wrap">
        <div className="table-meta">
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
