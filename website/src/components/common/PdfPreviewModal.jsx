import React from "react";
import { FileText } from "lucide-react";
import { notifyError } from "../../utils/notify.js";

export default function PdfPreviewModal({ 
  isOpen, 
  onClose, 
  htmlContent, 
  pdfUrl, 
  title = "Xem trước Báo cáo PDF" 
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    if (htmlContent) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(htmlContent);
        win.document.close();
        win.print();
      } else {
        notifyError("Trình duyệt chặn popup. Vui lòng cho phép popup để in PDF.");
      }
    } else if (pdfUrl) {
      // Create a hidden iframe for printing PDF blob
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          iframe.contentWindow.print();
        } catch (e) {
          notifyError("Không thể in trực tiếp. Vui lòng sử dụng tính năng in của trình duyệt.");
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
          <div className="flex items-center gap-3 font-semibold">
            <FileText className="w-5 h-5" /> {title}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              In tài liệu
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
              Đóng
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 p-2">
          {htmlContent && (
            <iframe title="preview-pdf-html" srcDoc={htmlContent} className="w-full h-full border border-slate-200 rounded-lg shadow-sm bg-white" />
          )}
          {pdfUrl && (
            <iframe title="preview-pdf-blob" src={pdfUrl} className="w-full h-full border border-slate-200 rounded-lg shadow-sm bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}
