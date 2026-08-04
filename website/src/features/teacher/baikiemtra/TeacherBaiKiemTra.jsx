import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, ClipboardList } from 'lucide-react';
import api from '../../../api/axiosClient';
import useAuth from '../../../hooks/useAuth';
import QuestionBuilderModal from './QuestionBuilderModal';
import ExamResultsModal from './ExamResultsModal';
import { notifySuccess, notifyError } from '../../../utils/notify';
import { useConfirm } from '../../../contexts/ConfirmContext.jsx';

const TeacherBaiKiemTra = () => {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);
  
  // Metadata cho Create Exam
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    tieuDe: '',
    thoiGianLamBai: '',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    soLanLamBai: 1,
    lopHocId: '',
    monHocId: ''
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/baikiemtra/teacher?_t=${new Date().getTime()}`);
      if (res.data?.success) {
        setExams(res.data.data);
      }
    } catch (error) {
      console.error(error);
      notifyError("Lỗi khi tải danh sách bài kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const res = await api.get(`/baikiemtra/teacher/metadata`);
      if (res.data?.success) {
        const { classes, subjects } = res.data.data;
        setClasses(classes || []);
        setSubjects(subjects || []);
        if (classes?.length > 0 && subjects?.length > 0) {
          setFormData(prev => ({
            ...prev,
            lopHocId: classes[0].id,
            monHocId: subjects[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Lỗi tải danh sách lớp/môn', error);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchMetadata();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validate thời gian
    const start = new Date(formData.thoiGianBatDau).getTime();
    const end = new Date(formData.thoiGianKetThuc).getTime();
    const durationMs = parseInt(formData.thoiGianLamBai) * 60 * 1000;
    
    if (end < start + durationMs) {
      notifyError(`Thời gian kết thúc phải cách thời gian bắt đầu ít nhất ${formData.thoiGianLamBai} phút!`);
      return;
    }
    
    try {
      const payload = {
        ...formData,
        giaoVienId: user?.id || 1
      };
      const res = await api.post('/baikiemtra', payload);
      if (res.data?.success) {
        notifySuccess("Tạo bài kiểm tra thành công");
        setIsModalVisible(false);
        fetchExams();
      }
    } catch (error) {
      notifyError("Lỗi khi tạo bài kiểm tra");
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này? Toàn bộ câu hỏi và kết quả làm bài sẽ bị xóa vĩnh viễn."))) return;
    try {
      const res = await api.delete(`/baikiemtra/${id}`);
      if (res.data?.success) {
        notifySuccess("Xóa bài kiểm tra thành công");
        fetchExams();
      }
    } catch (error) {
      console.error(error);
      notifyError(error.response?.data?.message || "Lỗi khi xóa bài kiểm tra");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight">Quản lý bài kiểm tra</h2>
        <button 
          onClick={() => setIsModalVisible(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Tạo bài mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lớp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Môn học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian (phút)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bắt đầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map(exam => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{exam.tieuDe}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.tenLopHoc}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.tenMonHoc}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.thoiGianLamBai}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exam.thoiGianBatDau ? new Date(exam.thoiGianBatDau).toLocaleString('vi-VN') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setSelectedExamForQuestions(exam)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit size={16} className="mr-1" /> Soạn câu hỏi
                        </button>
                        <button 
                          onClick={() => setSelectedExamForResults(exam)}
                          className="text-emerald-600 hover:text-emerald-900 flex items-center"
                        >
                          <ClipboardList size={16} className="mr-1" /> Kết quả
                        </button>
                        <button 
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 size={16} className="mr-1" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Chưa có bài kiểm tra nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Tạo bài kiểm tra mới</h3>
              <button onClick={() => setIsModalVisible(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.tieuDe}
                  onChange={(e) => setFormData({...formData, tieuDe: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.lopHocId}
                    onChange={(e) => setFormData({...formData, lopHocId: parseInt(e.target.value)})}
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                  {subjects.length <= 1 ? (
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                      value={subjects[0]?.name || "Đang tải..."}
                      disabled
                      readOnly
                    />
                  ) : (
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.monHocId}
                      onChange={(e) => setFormData({...formData, monHocId: parseInt(e.target.value)})}
                    >
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian làm bài (phút)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.thoiGianLamBai}
                    onChange={(e) => setFormData({...formData, thoiGianLamBai: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần làm bài tối đa</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.soLanLamBai}
                    onChange={(e) => setFormData({...formData, soLanLamBai: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                <input 
                  required
                  type="datetime-local" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.thoiGianBatDau}
                  onChange={(e) => setFormData({...formData, thoiGianBatDau: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                <input 
                  required
                  type="datetime-local" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.thoiGianKetThuc}
                  onChange={(e) => setFormData({...formData, thoiGianKetThuc: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalVisible(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExamForQuestions && (
        <QuestionBuilderModal 
          exam={selectedExamForQuestions}
          onClose={() => setSelectedExamForQuestions(null)}
        />
      )}

      {selectedExamForResults && (
        <ExamResultsModal 
          exam={selectedExamForResults} 
          onClose={() => setSelectedExamForResults(null)} 
        />
      )}
    </div>
  );
};

export default TeacherBaiKiemTra;

