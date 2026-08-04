import React, { useState, useEffect } from 'react';
import { X, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../api/axiosClient';
import { notifyError } from '../../../utils/notify';

const ExamResultsModal = ({ exam, onClose }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchAttempts();
  }, [exam]);

  const fetchAttempts = async () => {
    if (!exam) return;
    try {
      setLoading(true);
      const res = await api.get(`/baikiemtra/teacher/exam/${exam.id}/attempts`);
      if (res.data?.success) {
        setAttempts(res.data.data);
      }
    } catch (error) {
      console.error(error);
      notifyError('Lỗi khi tải danh sách bài làm');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptDetail = async (attemptId) => {
    try {
      setLoadingDetail(true);
      setSelectedAttemptId(attemptId);
      const res = await api.get(`/baikiemtra/teacher/attempt/${attemptId}`);
      if (res.data?.success) {
        setAttemptDetail(res.data.data);
      }
    } catch (error) {
      console.error(error);
      notifyError('Lỗi khi tải chi tiết bài làm');
      setSelectedAttemptId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {selectedAttemptId ? 'Chi tiết bài làm' : `Kết quả bài kiểm tra - ${exam?.tieuDe}`}
          </h3>
          <button
            onClick={() => selectedAttemptId ? setSelectedAttemptId(null) : onClose()}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {selectedAttemptId && attemptDetail ? (
            // Chi tiết bài làm view
            <div>
              <div className="mb-6 flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                  <p className="font-semibold text-lg text-blue-900">Học sinh: {attemptDetail.tenHocSinh}</p>
                  <p className="text-sm text-blue-800">Nộp bài lúc: {new Date(attemptDetail.thoiGianNop).toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Điểm trắc nghiệm</p>
                  <p className="text-3xl font-extrabold text-blue-600">{attemptDetail.diemTracNghiem}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-bold text-lg text-gray-700 border-b pb-2">Chi tiết từng câu:</h4>
                {attemptDetail.chiTietBaiLams?.map((ct, index) => (
                  <div key={ct.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between mb-3">
                      <span className="font-medium text-gray-800">Câu {index + 1}: {ct.noiDungCauHoi}</span>
                      {ct.loaiCauHoi === 'TRAC_NGHIEM' ? (
                        <span className={`font-bold ${ct.diemDatDuoc > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {ct.diemDatDuoc} / {ct.diemToiDa}đ
                        </span>
                      ) : (
                        <span className="font-bold text-gray-500 italic">

                        </span>
                      )}
                    </div>

                    {ct.loaiCauHoi === 'TRAC_NGHIEM' ? (
                      <div className="text-sm text-gray-600">
                        <div className="flex flex-col space-y-2 mt-2">
                          <div className="flex items-center">
                            <span className="font-medium w-32">Trạng thái:</span>
                            {ct.diemDatDuoc > 0 ? (
                              <span className="text-green-600 flex items-center font-medium"><CheckCircle size={16} className="mr-1" /> Đúng</span>
                            ) : (
                              <span className="text-red-500 flex items-center font-medium"><XCircle size={16} className="mr-1" /> Sai hoặc Chưa làm</span>
                            )}
                          </div>
                          <div className="flex">
                            <span className="font-medium w-32">Học sinh chọn:</span>
                            <span className={ct.diemDatDuoc > 0 ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                              {ct.dapAnDaChon || <span className="text-gray-400 italic">Bỏ trống</span>}
                            </span>
                          </div>
                          {ct.diemDatDuoc === 0 && (
                            <div className="flex">
                              <span className="font-medium w-32">Đáp án đúng:</span>
                              <span className="text-green-700 font-medium">
                                {ct.dapAnDung}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-1">Câu trả lời của học sinh:</div>
                        <div className="bg-white p-3 border rounded border-gray-200 min-h-16 whitespace-pre-wrap">
                          {ct.cauTraLoiTuLuan || <span className="text-gray-400 italic">Học sinh bỏ trống câu này</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Danh sách học sinh view
            <div>
              {loading ? (
                <div className="text-center py-10">Đang tải danh sách bài làm...</div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border">
                  Chưa có học sinh nào nộp bài kiểm tra này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Học sinh</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Bắt đầu lúc</th>
                        <th className="px-4 py-3">Nộp bài lúc</th>
                        <th className="px-4 py-3">Điểm trắc nghiệm</th>
                        <th className="px-4 py-3 text-center rounded-tr-lg">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{attempt.tenHocSinh}</td>
                          <td className="px-4 py-3">
                            {attempt.trangThai === 'VI_PHAM_QUY_CHE' ? (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Vi phạm</span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Đã nộp</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{new Date(attempt.thoiGianBatDau).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3">{new Date(attempt.thoiGianNop).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3 font-bold text-blue-600">{attempt.diemTracNghiem}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => fetchAttemptDetail(attempt.id)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <Eye size={16} className="mr-1" /> Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResultsModal;
