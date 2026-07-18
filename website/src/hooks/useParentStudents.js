import { useEffect, useState } from "react";
import { getCurrentPhuHuynh, getStudentsByPhuHuynhId } from "../api/phuhuynhApi.js";

/**
 * Hook chung cho tất cả trang phụ huynh.
 * Tải danh sách học sinh liên kết và cho phép chọn con.
 */
export default function useParentStudents() {
  const [students, setStudents] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const parentRes = await getCurrentPhuHuynh();
        if (!active) return;
        const parent = parentRes?.data?.data;
        if (!parent?.id) {
          setError("Không tìm thấy thông tin phụ huynh.");
          setLoading(false);
          return;
        }

        const studentsRes = await getStudentsByPhuHuynhId(parent.id);
        if (!active) return;
        const list = studentsRes?.data?.data || [];
        setStudents(list);

        if (list.length === 0) {
          setError("Chưa có học sinh nào được liên kết.");
        }
      } catch {
        if (!active) return;
        setError("Không thể tải danh sách học sinh.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchStudents();
    return () => { active = false; };
  }, []);

  const currentStudent = students[selectedIndex] || null;

  const selectStudent = (index) => {
    if (index >= 0 && index < students.length) {
      setSelectedIndex(index);
    }
  };

  return {
    students,
    currentStudent,
    selectedIndex,
    selectStudent,
    loading,
    error
  };
}
