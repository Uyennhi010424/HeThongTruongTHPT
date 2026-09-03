import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Edit3, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import api from '../../../api/axiosClient';
import { notifyError, notifySuccess } from '../../../utils/notify';
import { useConfirm } from '../../../contexts/ConfirmContext.jsx';
import Pagination from '../../../components/common/Pagination.jsx';

const StudentBaiKiemTra = () => {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [currentAttemptId, setCurrentAttemptId] = useState(null);
  const sessionTokenRef = useRef(null);
  const [answers, setAnswers] = useState({});
  
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [examResult, setExamResult] = useState(null);
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // Bố cục 3x3 = 9 bài kiểm tra / trang

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/baikiemtra/student?_t=${new Date().getTime()}`);
      if (res.data?.success) {
        setExams(res.data.data);
      }
    } catch (error) {
      console.error(error);
      notifyError('Lỗi khi tải danh sách bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date().getTime();
    const start = new Date(exam.thoiGianBatDau).getTime();
    const end = new Date(exam.thoiGianKetThuc).getTime();
    
    if (now < start) return 'CHUA_DEN_GIO';
    if (now > end) return 'DA_KET_THUC';
    return 'DANG_MO';
  };

  const [timeLeft, setTimeLeft] = useState(0);

  const handleSubmit = async (isAuto = false) => {
    if (!currentAttemptId) return;
    
    if (!isAuto && !(await confirm('Bạn có chắc chắn muốn nộp bài?'))) return;

    try {
      const payload = Object.keys(answers).map(cauHoiId => {
        const qId = parseInt(cauHoiId);
        const question = currentExam.cauHois.find(q => q.id === qId);
        
        if (question?.loaiCauHoi === 'TU_LUAN') {
          return {
            cauHoiId: qId,
            cauTraLoiTuLuan: answers[cauHoiId]
          };
        }
        
        return {
          cauHoiId: qId,
          dapAnId: answers[cauHoiId]
        };
      });
      
      const res = await api.post(`/baikiemtra/submit/${currentAttemptId}`, payload);
      if (res.data?.success) {
        if (isAuto) {
          notifyError('Cảnh báo vi phạm hoặc Hết giờ! Bài thi của bạn đã được nộp tự động.');
        } else {
          notifySuccess('Nộp bài thành công!');
        }
        setIsTakingExam(false);
        fetchExams(); // Refresh exam list to update status and score!
      }
    } catch (error) {
      notifyError(error.response?.data?.message || 'Lỗi khi nộp bài');
    }
  };

  // Timer and Session logic
  useEffect(() => {
    let timer;
    let sessionCheckTimer;
    
    if (isTakingExam && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      sessionCheckTimer = setInterval(async () => {
        if (!currentAttemptId || !sessionTokenRef.current) return;
        try {
          const res = await api.get(`/baikiemtra/attempt/${currentAttemptId}/check-session?sessionToken=${sessionTokenRef.current}`);
          if (res.data?.success && res.data.data === false) {
             clearInterval(timer);
             clearInterval(sessionCheckTimer);
             setIsTakingExam(false);
             notifyError('Có thiết bị khác đang làm bài kiểm tra này. Bạn đã bị thoát ra.');
             fetchExams();
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
      
    } else if (isTakingExam && timeLeft === 0) {
      handleSubmit(true);
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(sessionCheckTimer);
    };
  }, [isTakingExam, timeLeft, currentAttemptId]);

  const handleStart = async (exam) => {
    const status = getExamStatus(exam);
    if (status === 'CHUA_DEN_GIO') {
      notifyError('Chưa đến giờ làm bài!');
      return;
    }
    if (status === 'DA_KET_THUC') {
      notifyError('Bài kiểm tra đã kết thúc!');
      return;
    }

    if (await confirm('Bạn đã sẵn sàng? Thời gian sẽ bắt đầu tính ngay khi bạn vào.')) {
      try {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionTokenRef.current = token;
        const res = await api.post(`/baikiemtra/${exam.id}/start?sessionToken=${token}`);
        if (res.data?.success) {
          setCurrentAttemptId(res.data.data.id);
          const detailRes = await api.get(`/baikiemtra/student/${exam.id}`);
          if (detailRes.data?.success) {
            setCurrentExam(detailRes.data.data);
            setAnswers({}); // Reset answers
            setIsTakingExam(true);
            setTimeLeft(detailRes.data.data.thoiGianLamBai * 60);
          }
        }
      } catch (error) {
        notifyError(error.response?.data?.message || 'Lỗi khi bắt đầu làm bài');
      }
    }
  };

  // Anti-cheat simulation
  useEffect(() => {
    const handleBlur = () => {
      if (isTakingExam) {
        handleSubmit(true);
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isTakingExam]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isTakingExam) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">{currentExam.tieuDe}</h2>
            <div className="flex items-center text-red-600 font-bold text-xl">
              <Clock size={24} className="mr-2" /> 
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {currentExam.cauHois?.length > 0 ? currentExam.cauHois.map((q, qIndex) => (
            <div key={q.id} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-4">Câu {qIndex + 1} ({q.diem}đ): {q.noiDung}</h3>
              {q.loaiCauHoi === 'TRAC_NGHIEM' ? (
                <div className="space-y-3">
                  {q.dapAns?.map((da, i) => {
                    const isSelected = answers[q.id] === da.id;
                    return (
                      <button 
                        key={da.id} 
                        onClick={() => setAnswers({...answers, [q.id]: da.id})}
                        className={`w-full text-left px-4 py-3 border rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-300 hover:bg-blue-50'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {da.noiDung}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Nhập câu trả lời tự luận của bạn vào đây..."
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                  />
                </div>
              )}
            </div>
          )) : (
            <div className="mb-6 p-4 text-center text-gray-500">
              Chưa có câu hỏi nào.
            </div>
          )}
          
          <div className="text-center">
            <button 
              onClick={() => handleSubmit(false)}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md"
            >
              Nộp bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleViewResult = async (examId) => {
    try {
      const res = await api.get(`/baikiemtra/student/${examId}/result`);
      if (res.data?.success) {
        setExamResult(res.data.data);
        setResultModalVisible(true);
      }
    } catch (error) {
      notifyError('Không thể tải chi tiết kết quả');
    }
  };

  const totalPages = Math.ceil(exams.length / pageSize) || 1;
  const paginatedExams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return exams.slice(start, start + pageSize);
  }, [exams, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  return (
    <div className="p-6 max-w-7xl mx-auto relative pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight mb-1">Bài kiểm tra của tôi</h2>
          <p className="text-sm font-medium text-slate-500">Danh sách các bài kiểm tra trực tuyến định kỳ và thường xuyên.</p>
        </div>
        {exams.length > 0 && (
          <div className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Tổng cộng: <strong className="text-blue-600">{exams.length}</strong> bài kiểm tra
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="font-medium">Đang tải danh sách bài kiểm tra...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100 font-medium">
          Hiện tại không có bài kiểm tra nào.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedExams.map(item => {
              const status = getExamStatus(item);
              
              let statusBadge = null;
              if (status === 'CHUA_DEN_GIO') {
                statusBadge = (
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center">
                    <AlertCircle size={12} className="mr-1" /> Chưa đến giờ
                  </span>
                );
              } else if (status === 'DA_KET_THUC') {
                statusBadge = (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center">
                    <XCircle size={12} className="mr-1" /> Đã kết thúc
                  </span>
                );
              } else {
                statusBadge = (
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" /> Đang mở
                  </span>
                );
              }

              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h3 className="text-lg font-bold text-slate-800 leading-tight flex-1 line-clamp-2">{item.tieuDe}</h3>
                      {statusBadge}
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p><span className="font-semibold text-slate-700">Môn học:</span> {item.tenMonHoc}</p>
                      <p><span className="font-semibold text-slate-700">Giáo viên:</span> {item.tenGiaoVien}</p>
                      <p><span className="font-semibold text-slate-700">Thời gian làm bài:</span> {item.thoiGianLamBai} phút</p>
                      <p><span className="font-semibold text-slate-700">Bắt đầu:</span> {new Date(item.thoiGianBatDau).toLocaleString('vi-VN')}</p>
                      <p><span className="font-semibold text-slate-700">Kết thúc:</span> {new Date(item.thoiGianKetThuc).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleStart(item)}
                      disabled={status !== 'DANG_MO' || item.trangThaiLamBai === 'HET_LAN_LAM_BAI'}
                      className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition-all
                        ${(status === 'DANG_MO' && item.trangThaiLamBai !== 'HET_LAN_LAM_BAI') ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                    >
                      <Edit3 size={16} className="mr-2" />
                      {item.trangThaiLamBai === 'HET_LAN_LAM_BAI' ? 'Đã nộp bài' : (status === 'CHUA_DEN_GIO' ? 'Chưa mở' : status === 'DA_KET_THUC' ? 'Đã đóng' : (item.trangThaiLamBai === 'DANG_LAM' ? 'Tiếp tục làm bài' : 'Làm bài ngay'))}
                    </button>
                    {item.trangThaiLamBai === 'HET_LAN_LAM_BAI' && item.diemDatDuoc != null && (
                      <div className="mt-3 text-center">
                        <span 
                          onClick={() => handleViewResult(item.id)}
                          className="text-sm text-slate-600 hover:text-blue-600 font-medium cursor-pointer inline-flex items-center gap-1"
                        >
                          Xem kết quả: <strong className="text-blue-700 text-base">{item.diemDatDuoc} điểm</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={exams.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[9, 18, 27]}
            />
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModalVisible && examResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">Chi tiết kết quả làm bài</h3>
              <button onClick={() => setResultModalVisible(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-blue-900 border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-semibold text-lg">Học sinh: {examResult.tenHocSinh}</p>
                <p className="text-sm">Bắt đầu: {new Date(examResult.thoiGianBatDau).toLocaleString('vi-VN')}</p>
                <p className="text-sm">Nộp bài: {new Date(examResult.thoiGianNop).toLocaleString('vi-VN')}</p>
                <p className="text-sm mt-1">Trạng thái: <span className="font-medium text-red-600">{examResult.trangThai === 'VI_PHAM_QUY_CHE' ? 'Vi phạm quy chế' : 'Đã nộp bài'}</span></p>
              </div>
              <div className="text-center bg-white p-4 rounded-xl shadow-sm border border-blue-100 min-w-32">
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Tổng điểm</p>
                <p className="text-3xl font-extrabold text-blue-600">{examResult.tongDiem} <span className="text-base text-gray-400 font-medium">/10</span></p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg text-gray-700 border-b pb-2">Chi tiết từng câu:</h4>
              {examResult.chiTietBaiLams?.map((ct, index) => (
                <div key={ct.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between mb-3">
                    <span className="font-medium text-gray-800">Câu {index + 1}: {ct.noiDungCauHoi}</span>
                    {ct.loaiCauHoi === 'TRAC_NGHIEM' ? (
                      <span className={`font-bold ${ct.diemDatDuoc > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {ct.diemDatDuoc} / {ct.diemToiDa}đ
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 italic">
                        Chưa chấm điểm
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
                          <span className="font-medium w-32">Bạn đã chọn:</span>
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
                      <div className="font-medium mb-1">Câu trả lời:</div>
                      <div className="bg-white p-3 border rounded border-gray-200 min-h-16 whitespace-pre-wrap">
                        {ct.cauTraLoiTuLuan || <span className="text-gray-400 italic">Không có câu trả lời</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {(!examResult.chiTietBaiLams || examResult.chiTietBaiLams.length === 0) && (
                <p className="text-center text-gray-500 italic py-4">Không có dữ liệu chi tiết câu hỏi.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentBaiKiemTra;

