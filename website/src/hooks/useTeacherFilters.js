import { useState, useEffect, useMemo } from "react";
import { getLop } from "../api/lopApi.js";
import { getMonHoc } from "../api/monhocApi.js";
import { getNamHoc } from "../api/namhocApi.js";
import { getPhanCongDay } from "../api/phancongDayApi.js";
import { getCurrentGiaoVien } from "../api/giaovienApi.js";
import { getChuNhiem } from "../api/chunhiemApi.js";
import { getVisibleAcademicYears, getActiveAcademicYear, sortClasses } from "../utils/helpers.js";

/**
 * Custom hook to manage teacher filters across pages.
 * Handles fetching list of years, semesters, grades, classes, and subjects.
 * Filters classes and subjects based on teacher assignments and homeroom status.
 */
export function useTeacherFilters({ showSubject = true, showGrade = true, showClass = true, defaultSemester = "HK1", homeroomOnly = false, teachOnly = false } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allNamHoc, setAllNamHoc] = useState([]);
  const [namHocList, setNamHocList] = useState([]);
  const [phanCongData, setPhanCongData] = useState([]);
  const [chuNhiemData, setChuNhiemData] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(defaultSemester);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  useEffect(() => {
    let active = true;

    const fetchBaseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          lopRes,
          monHocRes,
          namHocRes,
          phanCongRes,
          teacherRes,
          chuNhiemRes,
          hsRes
        ] = await Promise.all([
          getLop().catch(() => ({ data: { data: [] } })),
          showSubject ? getMonHoc().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          getPhanCongDay().catch(() => ({ data: { data: [] } })),
          getCurrentGiaoVien().catch(() => ({ data: { data: null } })),
          getChuNhiem().catch(() => ({ data: { data: [] } })),
          import("../api/hocsinhApi.js").then(m => m.getHocSinh().catch(() => ({ data: { data: [] } }))).catch(() => ({ data: { data: [] } }))
        ]);

        if (!active) return;

        setAllClasses(lopRes?.data?.data || []);
        setAllSubjects(monHocRes?.data?.data || []);
        
        setPhanCongData(phanCongRes?.data?.data || []);
        setChuNhiemData(chuNhiemRes?.data?.data || []);
        setCurrentTeacher(teacherRes?.data?.data || null);
        setAllStudents(hsRes?.data?.data || []);

        // Process academic years (only visible years <= current active year)
        const rawNamHoc = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawNamHoc);
        setAllNamHoc(visibleYears);
        const years = visibleYears
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean);
        
        setNamHocList(years);
        
        // Check active academic year (DANG_MO)
        const activeNamHoc = getActiveAcademicYear(rawNamHoc);
        let targetNamHoc = activeNamHoc?.tenNamHoc || years[0] || "";
        
        setSelectedNamHoc((prev) => prev || targetNamHoc);

        const now = new Date();
        if (activeNamHoc?.ngayBatDauHk2) {
          const startHk2 = new Date(activeNamHoc.ngayBatDauHk2 + "T00:00:00");
          const endHk2 = activeNamHoc.ngayKetThucHk2 ? new Date(activeNamHoc.ngayKetThucHk2 + "T23:59:59") : null;
          if (now >= startHk2 && (!endHk2 || now <= endHk2)) {
            setSelectedSemester((prev) => prev || "HK2");
          }
        }
      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu bộ lọc.");
        console.error("useTeacherFilters fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBaseData();
    return () => { active = false; };
  }, [showSubject, showClass]);

  // Derived state: Visible Classes
  const allowedClasses = useMemo(() => {
    if (!showClass) return [];
    if (!currentTeacher || allClasses.length === 0) return allClasses;

    // 2. Class they are homeroom teacher for
    const homeroomClassIds = new Set(
      chuNhiemData
        .filter((cn) => {
          const gvMatch = Number(cn?.giaoVienId ?? cn?.giaoVien?.id) === Number(currentTeacher.id);
          if (!gvMatch) return false;
          if (selectedNamHoc && cn?.namHoc && cn.namHoc !== selectedNamHoc) return false;
          return true;
        })
        .map((cn) => String(cn?.lopId ?? cn?.lop?.id ?? ""))
        .filter(Boolean)
    );

    if (homeroomOnly) {
      return allClasses.filter((c) => homeroomClassIds.has(String(c.id)));
    }

    // 1. Classes they teach
    const assignedClassIds = new Set(
      phanCongData
        .filter((p) => {
          const teacherMatch = Number(p?.giaoVienId ?? p?.giaoVien?.id) === Number(currentTeacher.id);
          if (!teacherMatch) return false;
          if (selectedNamHoc && p?.namHoc && p.namHoc !== selectedNamHoc) return false;
          if (selectedSemester) {
            const semNum = selectedSemester === "HK1" ? 1 : 2;
            if (p?.hocKy && Number(p.hocKy) !== semNum) return false;
          }
          return true;
        })
        .map((p) => String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? ""))
        .filter(Boolean)
    );

    if (assignedClassIds.size === 0 && homeroomClassIds.size === 0) {
      return [];
    }

    if (teachOnly) {
      return allClasses.filter((c) => assignedClassIds.has(String(c.id)));
    }

    return allClasses.filter(
      (c) => assignedClassIds.has(String(c.id)) || homeroomClassIds.has(String(c.id))
    );
  }, [allClasses, currentTeacher, phanCongData, chuNhiemData, showClass, homeroomOnly, teachOnly, selectedNamHoc, selectedSemester]);

  // Derived state: Available Grades from allowed classes
  const availableGrades = useMemo(() => {
    if (!showGrade || !showClass) return [];
    const gradeSet = new Set(
      allowedClasses
        .map((item) => item?.khoi)
        .filter((item) => item !== null && item !== undefined && String(item).trim() !== "")
    );
    return Array.from(gradeSet).sort((a, b) => Number(a) - Number(b));
  }, [allowedClasses, showGrade, showClass]);

  // Derived state: Filtered Classes by Grade
  const filteredClasses = useMemo(() => {
    if (!showClass) return [];
    let list = allowedClasses;
    if (selectedGrade && String(selectedGrade).toLowerCase() !== "all" && showGrade) {
      list = allowedClasses.filter((item) => String(item?.khoi || "") === String(selectedGrade));
    }
    return list.slice().sort(sortClasses);
  }, [allowedClasses, selectedGrade, showGrade, showClass]);

  // Auto-select first class when grade/classes change
  useEffect(() => {
    if (!showClass) return;
    if (filteredClasses.length > 0) {
      if (!filteredClasses.some(c => String(c.id) === selectedClassId)) {
        setSelectedClassId(String(filteredClasses[0].id));
      }
    } else {
      setSelectedClassId("");
    }
  }, [filteredClasses, selectedClassId, showClass]);

  // Derived state: Is current teacher the homeroom teacher of the selected class?
  const isHomeroomTeacherOfSelected = useMemo(() => {
    if (!currentTeacher || !selectedClassId) return false;
    
    return chuNhiemData.some((cn) => {
       const cnGvId = Number(cn?.giaoVienId ?? cn?.giaoVien?.id);
       const cnLopId = String(cn?.lopId ?? cn?.lop?.id);
       return cnGvId === Number(currentTeacher.id) && cnLopId === selectedClassId;
    });
  }, [currentTeacher, selectedClassId, chuNhiemData]);

  // Derived state: Allowed Subjects
  const allowedSubjects = useMemo(() => {
    if (!showSubject || allSubjects.length === 0 || !selectedClassId || !currentTeacher) {
      return allSubjects; 
    }

    // If they are homeroom teacher for the selected class, and teachOnly is not true, they can SEE all subjects.
    if (!teachOnly && isHomeroomTeacherOfSelected) {
      return allSubjects;
    }

    // Otherwise, they can only see subjects they are explicitly assigned to teach in this class.
    const assignedSubjectIds = new Set(
      phanCongData
        .filter((p) => {
          const pTeacherId = Number(p?.giaoVienId ?? p?.giaoVien?.id);
          const pClassId = String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? "");
          if (pTeacherId !== Number(currentTeacher.id) || pClassId !== selectedClassId) return false;
          if (selectedNamHoc && p?.namHoc && p.namHoc !== selectedNamHoc) return false;
          if (selectedSemester) {
            const semNum = selectedSemester === "HK1" ? 1 : 2;
            if (p?.hocKy && Number(p.hocKy) !== semNum) return false;
          }
          return true;
        })
        .map((p) => String(p?.monHocId ?? p?.monHoc?.id ?? ""))
        .filter(Boolean)
    );

    return allSubjects.filter((s) => assignedSubjectIds.has(String(s.id)));
  }, [showSubject, allSubjects, selectedClassId, currentTeacher, isHomeroomTeacherOfSelected, phanCongData, teachOnly, selectedNamHoc, selectedSemester]);

  // Derived state: Taught subjects by this teacher in the selected class (used for disabling inputs)
  const taughtSubjectsInSelectedClass = useMemo(() => {
    if (!currentTeacher || !selectedClassId) return new Set();
    return new Set(
      phanCongData
        .filter((p) => {
          const pTeacherId = Number(p?.giaoVienId ?? p?.giaoVien?.id);
          const pClassId = String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? "");
          if (pTeacherId !== Number(currentTeacher.id) || pClassId !== selectedClassId) return false;
          if (selectedNamHoc && p?.namHoc && p.namHoc !== selectedNamHoc) return false;
          if (selectedSemester) {
            const semNum = selectedSemester === "HK1" ? 1 : 2;
            if (p?.hocKy && Number(p.hocKy) !== semNum) return false;
          }
          return true;
        })
        .map((p) => String(p?.monHocId ?? p?.monHoc?.id ?? ""))
        .filter(Boolean)
    );
  }, [currentTeacher, selectedClassId, phanCongData, selectedNamHoc, selectedSemester]);

  // Auto-select subject
  useEffect(() => {
    if (!showSubject) return;
    if (allowedSubjects.length > 0) {
      if (!allowedSubjects.some(s => String(s.id) === selectedSubjectId)) {
        setSelectedSubjectId(String(allowedSubjects[0].id));
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [allowedSubjects, selectedSubjectId, showSubject]);

  const selectedClassObj = useMemo(() => 
    allClasses.find(c => String(c.id) === selectedClassId) || null
  , [allClasses, selectedClassId]);

  const selectedSubjectObj = useMemo(() => 
    allSubjects.find(s => String(s.id) === selectedSubjectId) || null
  , [allSubjects, selectedSubjectId]);

  const isSelectedSubjectTaughtByMe = useMemo(() => {
    if (!selectedSubjectId) return false;
    return taughtSubjectsInSelectedClass.has(selectedSubjectId);
  }, [taughtSubjectsInSelectedClass, selectedSubjectId]);

  const resetFilters = () => {
    setSelectedGrade("all");
    setSelectedSemester(defaultSemester);
  };

  return {
    loading,
    error,
    currentTeacher,
    namHocList,
    availableGrades,
    filteredClasses,
    allowedSubjects,
    allStudents,
    allNamHoc,
    allSubjects,
    
    selectedNamHoc,
    setSelectedNamHoc,
    selectedSemester,
    setSelectedSemester,
    selectedGrade,
    setSelectedGrade,
    selectedClassId,
    setSelectedClassId,
    selectedSubjectId,
    setSelectedSubjectId,
    
    selectedClassObj,
    selectedSubjectObj,
    isHomeroomTeacherOfSelected,
    isSelectedSubjectTaughtByMe,
    resetFilters,
    
    // Pass raw data if needed
    phanCongData,
    chuNhiemData
  };
}
