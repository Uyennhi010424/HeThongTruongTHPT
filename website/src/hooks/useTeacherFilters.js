import { useState, useEffect, useMemo } from "react";
import { getLop } from "../api/lopApi.js";
import { getMonHoc } from "../api/monhocApi.js";
import { getNamHoc } from "../api/namhocApi.js";
import { getPhanCongDay } from "../api/phancongDayApi.js";
import { getCurrentGiaoVien } from "../api/giaovienApi.js";
import { getChuNhiem } from "../api/chunhiemApi.js";

/**
 * Custom hook to manage teacher filters across pages.
 * Handles fetching list of years, semesters, grades, classes, and subjects.
 * Filters classes and subjects based on teacher assignments and homeroom status.
 */
export function useTeacherFilters({ showSubject = true, showGrade = true, showClass = true, defaultSemester = "HK1", homeroomOnly = false, teachOnly = false } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allNamHoc, setAllNamHoc] = useState([]);
  const [namHocList, setNamHocList] = useState([]);
  const [phanCongData, setPhanCongData] = useState([]);
  const [chuNhiemData, setChuNhiemData] = useState([]);
  const [currentTeacher, setCurrentTeacher] = useState(null);

  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [selectedSemester, setSelectedSemester] = useState(defaultSemester);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Fetch base data
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          lopRes,
          monRes,
          namHocRes,
          phanCongRes,
          chuNhiemRes,
          teacherRes,
          hsRes
        ] = await Promise.all([
          showClass ? getLop().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
          showSubject ? getMonHoc().catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
          getNamHoc().catch(() => ({ data: { data: [] } })),
          getPhanCongDay().catch(() => ({ data: { data: [] } })),
          getChuNhiem().catch(() => ({ data: { data: [] } })),
          getCurrentGiaoVien().catch(() => null),
          import("../api/hocsinhApi.js").then(m => m.getHocSinh()).catch(() => ({ data: { data: [] } }))
        ]);

        if (!active) return;

        if (showClass) setAllClasses(lopRes?.data?.data || []);
        if (showSubject) {
          const rawSubjects = monRes?.data?.data || [];
          const filteredSubjects = rawSubjects.filter(s => {
            const name = (s.tenMon || "").toLowerCase();
            return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
          });
          setAllSubjects(filteredSubjects);
        }
        
        setPhanCongData(phanCongRes?.data?.data || []);
        setChuNhiemData(chuNhiemRes?.data?.data || []);
        setCurrentTeacher(teacherRes?.data?.data || null);
        setAllStudents(hsRes?.data?.data || []);

        // Process academic years
        const rawNamHoc = namHocRes?.data?.data || [];
        setAllNamHoc(rawNamHoc);
        const years = rawNamHoc
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean)
          .sort((a, b) => {
            const yearA = Number(String(a).match(/(\d{4})/)?.[1] || 0);
            const yearB = Number(String(b).match(/(\d{4})/)?.[1] || 0);
            return yearB - yearA;
          });
        
        setNamHocList(years);
        
        const now = new Date();
        // If month is >= 8 (September), year starts this year, else it started last year
        const currentYearValue = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const currentNamHocString = `${currentYearValue}-${currentYearValue + 1}`;
        
        let targetNamHoc = "";
        if (years.includes(currentNamHocString)) {
          targetNamHoc = currentNamHocString;
        } else {
          const activeNamHoc = rawNamHoc.find((nh) => nh.trangThai === "DANG_MO");
          targetNamHoc = activeNamHoc?.tenNamHoc || years[0] || "";
        }
        
        setSelectedNamHoc((prev) => prev || targetNamHoc);

      } catch (err) {
        if (!active) return;
        setError("Không thể tải dữ liệu bộ lọc.");
        console.error("useTeacherFilters fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [showSubject, showClass]);

  // Derived state: Visible Classes
  const allowedClasses = useMemo(() => {
    if (!showClass) return [];
    if (!currentTeacher || allClasses.length === 0) return allClasses;

    // 2. Class they are homeroom teacher for
    const homeroomClassIds = new Set(
      chuNhiemData
        .filter((cn) => Number(cn?.giaoVienId ?? cn?.giaoVien?.id) === Number(currentTeacher.id))
        .map((cn) => String(cn?.lopId ?? cn?.lop?.id ?? ""))
        .filter(Boolean)
    );

    if (homeroomOnly) {
      return allClasses.filter((c) => homeroomClassIds.has(String(c.id)));
    }

    // 1. Classes they teach
    const assignedClassIds = new Set(
      phanCongData
        .filter((p) => Number(p?.giaoVienId ?? p?.giaoVien?.id) === Number(currentTeacher.id))
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
  }, [allClasses, currentTeacher, phanCongData, chuNhiemData, showClass, homeroomOnly, teachOnly]);

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
    if (selectedGrade === "all" || !showGrade) return allowedClasses;
    return allowedClasses.filter((item) => String(item?.khoi || "") === selectedGrade);
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
          return pTeacherId === Number(currentTeacher.id) && pClassId === selectedClassId;
        })
        .map((p) => String(p?.monHocId ?? p?.monHoc?.id ?? ""))
        .filter(Boolean)
    );

    return allSubjects.filter((s) => assignedSubjectIds.has(String(s.id)));
  }, [showSubject, allSubjects, selectedClassId, currentTeacher, isHomeroomTeacherOfSelected, phanCongData, teachOnly]);

  // Derived state: Taught subjects by this teacher in the selected class (used for disabling inputs)
  const taughtSubjectsInSelectedClass = useMemo(() => {
    if (!currentTeacher || !selectedClassId) return new Set();
    return new Set(
      phanCongData
        .filter((p) => {
          const pTeacherId = Number(p?.giaoVienId ?? p?.giaoVien?.id);
          const pClassId = String(p?.lopId ?? p?.lop?.id ?? p?.lopHocId ?? "");
          return pTeacherId === Number(currentTeacher.id) && pClassId === selectedClassId;
        })
        .map((p) => String(p?.monHocId ?? p?.monHoc?.id ?? ""))
        .filter(Boolean)
    );
  }, [currentTeacher, selectedClassId, phanCongData]);

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
