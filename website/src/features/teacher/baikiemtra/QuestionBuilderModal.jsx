import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Edit } from 'lucide-react';
import api from '../../../api/axiosClient';
import { notifySuccess, notifyError, notifyInfo } from '../../../utils/notify';

const QuestionBuilderModal = ({ exam, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    loaiCauHoi: 'TRAC_NGHIEM',
    noiDung: '',
    diem: 1,
    dapAns: [
      { noiDung: '', laDapAnDung: true },
      { noiDung: '', laDapAnDung: false },
      { noiDung: '', laDapAnDung: false },
      { noiDung: '', laDapAnDung: false },
    ]
  });

  useEffect(() => {
    if (exam?.cauHois) {
      setQuestions(exam.cauHois);
    } else {
      // Fetch if not populated
      fetchExamDetails();
    }
  }, [exam]);

  const [editQuestionId, setEditQuestionId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchExamDetails = async () => {
    try {
      const res = await api.get(`/baikiemtra/${exam.id}?t=${new Date().getTime()}`);
      if (res.data?.success) {
        const fetchedQuestions = res.data.data.cauHois || [];
        setQuestions(fetchedQuestions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.noiDung) {
      notifyInfo('Vui lòng nhập nội dung câu hỏi');
      return;
    }
    
    if (newQuestion.loaiCauHoi === 'TRAC_NGHIEM') {
      const hasCorrect = newQuestion.dapAns.some(d => d.laDapAnDung);
      if (!hasCorrect) {
        notifyInfo('Vui lòng chọn 1 đáp án đúng');
        return;
      }
      const allFilled = newQuestion.dapAns.every(d => d.noiDung.trim() !== '');
      if (!allFilled) {
        notifyInfo('Vui lòng nhập đủ nội dung cho 4 đáp án');
        return;
      }
    }

    if (!newQuestion.diem || newQuestion.diem <= 0 || newQuestion.diem > 10) {
      notifyInfo('Điểm số phải lớn hơn 0 và tối đa là 10');
      return;
    }

    const currentTotalScore = questions.reduce((acc, q) => acc + (q.id === editQuestionId ? 0 : q.diem), 0);
    if (currentTotalScore + newQuestion.diem > 10) {
      notifyInfo(`Tổng điểm bài kiểm tra không được vượt quá 10. Điểm hiện tại: ${currentTotalScore}`);
      return;
    }

    try {
      setLoading(true);
      
      let res;
      if (editQuestionId) {
        res = await api.put(`/baikiemtra/cauhoi/${editQuestionId}`, newQuestion);
      } else {
        res = await api.post(`/baikiemtra/${exam.id}/cauhoi`, newQuestion);
      }
      
      if (res.data?.success) {
        notifySuccess(editQuestionId ? 'Cập nhật câu hỏi thành công' : 'Thêm câu hỏi thành công');
        
        setNewQuestion({
          loaiCauHoi: 'TRAC_NGHIEM',
          noiDung: '',
          diem: 1,
          dapAns: [
            { noiDung: '', laDapAnDung: true },
            { noiDung: '', laDapAnDung: false },
            { noiDung: '', laDapAnDung: false },
            { noiDung: '', laDapAnDung: false },
          ]
        });
        setEditQuestionId(null);
        await fetchExamDetails();
      }
    } catch (error) {
      notifyError(error.response?.data?.message || (editQuestionId ? 'Lỗi khi cập nhật câu hỏi' : 'Lỗi khi thêm câu hỏi'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    try {
      const res = await api.delete(`/baikiemtra/cauhoi/${id}`);
      if (res.data?.success) {
        notifySuccess('Xóa câu hỏi thành công');
        if (editQuestionId === id) {
          setEditQuestionId(null);
          setNewQuestion({
            loaiCauHoi: 'TRAC_NGHIEM',
            noiDung: '',
            diem: 1,
            dapAns: [
              { noiDung: '', laDapAnDung: true },
              { noiDung: '', laDapAnDung: false },
              { noiDung: '', laDapAnDung: false },
              { noiDung: '', laDapAnDung: false },
            ]
          });
        }
        await fetchExamDetails();
      }
    } catch (error) {
      notifyError(error.response?.data?.message || 'Lỗi khi xóa câu hỏi');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEditClick = (q) => {
    setEditQuestionId(q.id);
    setNewQuestion({
      loaiCauHoi: q.loaiCauHoi,
      noiDung: q.noiDung,
      diem: q.diem,
      dapAns: q.dapAns ? q.dapAns.map(da => ({
        noiDung: da.noiDung,
        laDapAnDung: da.laDapAnDung
      })) : [
        { noiDung: '', laDapAnDung: true },
        { noiDung: '', laDapAnDung: false },
        { noiDung: '', laDapAnDung: false },
        { noiDung: '', laDapAnDung: false },
      ]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-xl font-bold text-gray-800">Soạn câu hỏi - {exam?.tieuDe}</h3>
          <button 
            onClick={() => {
              const currentTotalScore = questions.reduce((acc, q) => acc + q.diem, 0);
              if (currentTotalScore > 0 && currentTotalScore !== 10) {
                notifyError(`Tổng điểm bài kiểm tra phải bằng 10. Điểm hiện tại: ${currentTotalScore}`);
                return;
              }
              onClose();
            }} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: Add/Edit Question Form */}
          <div className="border rounded-lg p-4 bg-gray-50 h-max">
            <h4 className="font-semibold text-lg mb-4">{editQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newQuestion.loaiCauHoi}
                  onChange={(e) => setNewQuestion({...newQuestion, loaiCauHoi: e.target.value})}
                >
                  <option value="TRAC_NGHIEM">Trắc nghiệm</option>
                  <option value="TU_LUAN">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  value={newQuestion.noiDung}
                  onChange={(e) => setNewQuestion({...newQuestion, noiDung: e.target.value})}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điểm số</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={newQuestion.diem === null || isNaN(newQuestion.diem) ? '' : newQuestion.diem}
                  onChange={(e) => setNewQuestion({...newQuestion, diem: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                />
              </div>

              {newQuestion.loaiCauHoi === 'TRAC_NGHIEM' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-medium text-gray-700">Các đáp án (Chọn đáp án đúng)</label>
                  {newQuestion.dapAns.map((da, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name="correctAnswer"
                        checked={da.laDapAnDung}
                        onChange={() => {
                          const newDapAns = newQuestion.dapAns.map((d, i) => ({
                            ...d,
                            laDapAnDung: i === idx
                          }));
                          setNewQuestion({...newQuestion, dapAns: newDapAns});
                        }}
                        className="w-5 h-5 text-blue-600"
                      />
                      <input 
                        type="text" 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                        value={da.noiDung}
                        onChange={(e) => {
                          const newDapAns = [...newQuestion.dapAns];
                          newDapAns[idx].noiDung = e.target.value;
                          setNewQuestion({...newQuestion, dapAns: newDapAns});
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <button 
                  onClick={handleAddQuestion}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editQuestionId ? <Save size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                  {loading ? 'Đang lưu...' : (editQuestionId ? 'Lưu thay đổi' : 'Lưu câu hỏi')}
                </button>
                {editQuestionId && (
                  <button 
                    onClick={() => {
                      setEditQuestionId(null);
                      setNewQuestion({
                        loaiCauHoi: 'TRAC_NGHIEM',
                        noiDung: '',
                        diem: 1,
                        dapAns: [
                          { noiDung: '', laDapAnDung: true },
                          { noiDung: '', laDapAnDung: false },
                          { noiDung: '', laDapAnDung: false },
                          { noiDung: '', laDapAnDung: false },
                        ]
                      });
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right side: List of Questions */}
          <div className="border rounded-lg p-4 bg-white overflow-y-auto max-h-[70vh]">
            <h4 className="font-semibold text-lg mb-4 flex justify-between">
              Danh sách câu hỏi 
              <span className="text-blue-600 text-sm">{questions.length} câu - Tổng điểm: {questions.reduce((acc, q) => acc + q.diem, 0)}</span>
            </h4>
            
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có câu hỏi nào trong đề thi này.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={q.id} className={`border rounded-lg p-3 shadow-sm relative group ${editQuestionId === q.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="font-medium text-gray-800 mb-2 pr-16">
                      Câu {index + 1} ({q.diem}đ) - {q.loaiCauHoi === 'TRAC_NGHIEM' ? 'Trắc nghiệm' : 'Tự luận'}:
                    </div>
                    <div className="text-gray-700 mb-3 whitespace-pre-wrap">{q.noiDung}</div>
                    
                    {q.loaiCauHoi === 'TRAC_NGHIEM' && q.dapAns && (
                      <div className="pl-4 space-y-1">
                        {q.dapAns.map((da, i) => (
                          <div key={i} className={`text-sm ${da.laDapAnDung ? 'text-green-600 font-semibold flex items-center' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}. {da.noiDung}
                            {da.laDapAnDung && <span className="ml-2 text-xs bg-green-100 px-2 py-0.5 rounded text-green-800">Đáp án đúng</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(q)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa câu hỏi"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(q.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t pt-4">
          <button 
            onClick={() => {
              const currentTotalScore = questions.reduce((acc, q) => acc + q.diem, 0);
              if (currentTotalScore > 0 && currentTotalScore !== 10) {
                notifyError(`Tổng điểm bài kiểm tra phải bằng 10. Điểm hiện tại: ${currentTotalScore}`);
                return;
              }
              notifySuccess('Đã lưu bài kiểm tra!');
              onClose();
            }}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm"
          >
            Hoàn tất & Lưu bài kiểm tra
          </button>
        </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Xóa câu hỏi</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBuilderModal;
