import { useEffect, useMemo, useState } from "react";
import { getMonHoc } from "../../api/monhocApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getDiem, exportStudentScorecard } from "../../api/diemApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";
import { getHocBa } from "../../api/hocbaApi.js";
import { getToHopMonById } from "../../api/toHopMonApi.js";
import { getActiveAcademicYear, getVisibleAcademicYears } from "../../utils/helpers.js";
import { Download } from "lucide-react";
import PdfPreviewModal from "../../components/common/PdfPreviewModal.jsx";
import {
  getPolicyBySubject,
  createEmptySemester,
  calcSemesterAverage,
  classifyHocLuc,
  calcYearAverage
} from "../../utils/scorePolicy.js";

const getHocLucLabel = (value) => {
  switch (value) {
    case "TOT": return { label: "Tốt", color: "text-emerald-600" };
    case "GIOI": return { label: "Giỏi", color: "text-emerald-600" };
    case "KHA": return { label: "Khá", color: "text-blue-600" };
    case "DAT": return { label: "Đạt", color: "text-amber-500" };
    case "TRUNG_BINH": return { label: "Trung bình", color: "text-amber-500" };
    case "CHUA_DAT": return { label: "Chưa đạt", color: "text-red-500" };
    case "YEU":
    case "KEM": return { label: "Yếu", color: "text-red-500" };
    default: return { label: value || "--", color: "text-slate-600" };
  }
};

const getHanhKiemLabel = (value) => {
  switch (value) {
    case "TOT": return { label: "Tốt", color: "text-emerald-600" };
    case "KHA": return { label: "Khá", color: "text-blue-600" };
    case "TRUNG_BINH": return { label: "Trung bình", color: "text-amber-500" };
    case "YEU": return { label: "Yếu", color: "text-red-500" };
    default: return { label: value || "--", color: "text-slate-600" };
  }
};

export default function ScorePage() {
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [scoreRecords, setScoreRecords] = useState({});
  const [hanhKiemList, setHanhKiemList] = useState([]);
  const [hocBaList, setHocBaList] = useState([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [namHocList, setNamHocList] = useState([]);
  const [namHocListObj, setNamHocListObj] = useState([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("HK1");
  const [toHopMonIds, setToHopMonIds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [studentRes, subjectsRes, namHocRes] = await Promise.all([
          getCurrentHocSinh(),
          getMonHoc(),
          getNamHoc()
        ]);
        if (!active) return;

        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        let fetchedToHopMonIds = null;
        if (currentStudent?.lop?.toHopId) {
           try {
              const toHopRes = await getToHopMonById(currentStudent.lop.toHopId);
              fetchedToHopMonIds = toHopRes?.data?.data?.monHocIds || [];
              setToHopMonIds(fetchedToHopMonIds);
           } catch (err) {
              console.error("Lỗi fetch tổ hợp môn:", err);
           }
        }

        const rawSubjects = subjectsRes?.data?.data || [];
        const subjectList = rawSubjects.filter(s => {
          const name = (s.tenMon || "").toLowerCase();
          return !name.includes("shdc") && !name.includes("sinh hoạt lớp");
        });
        setSubjects(subjectList);

        const rawYears = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawYears);
        const years = visibleYears
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean);
        
        setNamHocList(years);
        setNamHocListObj(visibleYears);

        if (years.length > 0) {
          const activeYearObj = getActiveAcademicYear(visibleYears) || visibleYears[0];
          setSelectedNamHoc(activeYearObj?.tenNamHoc || years[0]);
        }

        if (!currentStudent?.id) {
          setLoading(false);
          return;
        }

        const diemsRes = await getDiem({ hocSinhId: currentStudent.id }).catch(() => null);

        if (!active) return;

        try {
          const diems = diemsRes?.data?.data || [];
          const records = {};

          const subjectById = subjectList.reduce((acc, s) => {
            acc[String(s.id)] = s;
            return acc;
          }, {});

          diems.forEach((d) => {
            const subjectId = d?.monHoc?.id;
            const namHocDiem = d?.namHoc; 
            const namHocStr = typeof namHocDiem === 'object' ? namHocDiem?.tenNamHoc : namHocDiem;

            if (!subjectId || !namHocStr) return;
            const key = `${namHocStr}_${subjectId}`;

            const subject = subjectById[String(subjectId)];
            if (!subject) return;
            const policy = getPolicyBySubject(subject);

            if (!records[key]) {
              records[key] = {
                HK1: { ...createEmptySemester(policy.txCount) },
                HK2: { ...createEmptySemester(policy.txCount) }
              };
            }

            const semesterKey = d?.hocKy === 2 ? "HK2" : "HK1";
            const value = d?.giaTriDiem == null ? "" : String(d.giaTriDiem);

            if (String(d?.loaiDiem || "").toUpperCase() === "TX") {
              const idx = Number(d?.soThuTu || 1) - 1;
              if (idx >= 0) {
                records[key][semesterKey].tx[idx] = value;
              }
            } else if (String(d?.loaiDiem || "").toUpperCase() === "GK") {
              records[key][semesterKey].gk = value;
            } else if (String(d?.loaiDiem || "").toUpperCase() === "CK") {
              records[key][semesterKey].ck = value;
            }

            if (d?.nhanXet) {
              records[key][semesterKey].nhanXet = d.nhanXet;
            }
          });

          setScoreRecords(records);
        } catch (e) {
          console.error("Lỗi parse điểm:", e);
        }

      } catch (err) {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 403) {
          setError("Bạn không có quyền xem điểm. Vui lòng liên hệ quản trị viên.");
        } else if (status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError("Không thể tải bảng điểm. Vui lòng thử lại sau.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchScores = async () => {
      if (!student?.id || !selectedNamHoc || !selectedSemester) return;
      try {
        setLoading(true);
        const activeYearObj = namHocListObj.find(y => y.tenNamHoc === selectedNamHoc);
        
        const [hkRes, hocBaRes] = await Promise.all([
          getHanhKiem({ hocSinhId: student.id, namHocId: activeYearObj?.id }).catch(() => null),
          getHocBa({ hocSinhId: student.id }).catch(() => null)
        ]);

        if (!active) return;

        setHanhKiemList(hkRes?.data?.data || []);
        setHocBaList(hocBaRes?.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchScores();
    return () => { active = false; };
  }, [student?.id, selectedNamHoc, selectedSemester, namHocListObj]);

  const handleExportPdf = async () => {
    if (!student?.id || !selectedNamHoc) return;
    try {
      setIsExporting(true);
      const res = await exportStudentScorecard({
        hocSinhId: student.id,
        hocKy: selectedSemester === "HK1" ? 1 : 2,
        namHoc: selectedNamHoc
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      setPdfUrl(url);
      setShowPdfPreview(true);
    } catch (err) {
      console.error(err);
      alert("Xuất PDF thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  const { scoredSubjects, commentSubjects } = useMemo(() => {
    const scored = [];
    const comment = [];
    
    const gradedSubjectIds = new Set(Object.keys(scoreRecords).map(k => Number(k.split("_")[1])).filter(Boolean));

    subjects.forEach((subject) => {
      const name = (subject.tenMon || "").toLowerCase();
      const isMandatory = name.includes("toán") || name.includes("ngữ văn") || name.includes("tiếng anh") || name.includes("ngoại ngữ") || name.includes("lịch sử") || name.includes("giáo dục thể chất") || name.includes("thể dục") || name.includes("quốc phòng") || name.includes("trải nghiệm") || name.includes("địa phương");
      
      let shouldDisplay = true;
      if (toHopMonIds && toHopMonIds.length > 0) {
         shouldDisplay = toHopMonIds.includes(subject.id) || isMandatory || gradedSubjectIds.has(subject.id);
      } else {
         shouldDisplay = true; 
      }

      if (!shouldDisplay) return;

      const policy = getPolicyBySubject(subject);
      if (policy.mode === "COMMENT") {
        comment.push(subject);
      } else {
        scored.push(subject);
      }
    });
    return { scoredSubjects: scored, commentSubjects: comment };
  }, [subjects, toHopMonIds, scoreRecords]);

  const semesterSummary = useMemo(() => {
    if (!student?.id || !selectedNamHoc) return null;

    const activeYearObj = namHocListObj.find(y => y.tenNamHoc === selectedNamHoc);

    let totalAvg = 0;
    let avgCount = 0;
    const yearAverages = [];
    const commentResults = [];

    if (selectedSemester === "CA_NAM") {
      scoredSubjects.forEach(subject => {
        const key = `${selectedNamHoc}_${subject.id}`;
        const record = scoreRecords[key];
        const policy = getPolicyBySubject(subject);
        const hk1 = { ...createEmptySemester(policy.txCount), ...(record?.["HK1"] || {}) };
        const hk2 = { ...createEmptySemester(policy.txCount), ...(record?.["HK2"] || {}) };
        const hk1Avg = calcSemesterAverage(hk1);
        const hk2Avg = calcSemesterAverage(hk2);
        const yearAvg = calcYearAverage(hk1Avg, hk2Avg);
        if (yearAvg !== null) {
          totalAvg += yearAvg;
          avgCount += 1;
          yearAverages.push(yearAvg);
        }
      });

      commentSubjects.forEach(subject => {
        const key = `${selectedNamHoc}_${subject.id}`;
        const record = scoreRecords[key];
        const hk1 = record?.["HK1"];
        const hk2 = record?.["HK2"];
        const nx1 = hk1?.nhanXet || "DAT";
        const nx2 = hk2?.nhanXet || "DAT";
        if (hk1?.nhanXet && hk2?.nhanXet) {
            commentResults.push(nx2 === "DAT" && nx1 === "DAT" ? "DAT" : "CHUA_DAT");
        }
      });

      const dtbCaNam = avgCount > 0 ? Number((totalAvg / avgCount).toFixed(1)) : null;

      let hbObj = hocBaList.find(hb => hb.namHoc === selectedNamHoc || hb.namHoc?.tenNamHoc === selectedNamHoc || hb.namHoc?.id === activeYearObj?.id || hb.namHoc === activeYearObj?.id);
      
      if (!hbObj && hocBaList.length === 1 && hocBaList[0].namHoc === null) {
          hbObj = hocBaList[0];
      }
      
      const hocLucDisplay = getHocLucLabel(hbObj?.hocLuc || classifyHocLuc(dtbCaNam, yearAverages, commentResults)?.value);
      
      const hk2Obj = hanhKiemList.find(hk => hk.hocKy === 2);
      const hk1Obj = hanhKiemList.find(hk => hk.hocKy === 1);
      const dynamicHanhKiem = hk2Obj?.xepLoai || hk1Obj?.xepLoai;
      const hanhKiemDisplay = getHanhKiemLabel(dynamicHanhKiem || hbObj?.hanhKiem);

      return {
        label: "Điểm trung bình cả năm:",
        dtb: dtbCaNam !== null ? (hbObj?.diemTBCaNam ?? dtbCaNam) : null,
        hocLuc: hocLucDisplay,
        hanhKiem: hanhKiemDisplay
      };
    }

    scoredSubjects.forEach(subject => {
      const key = `${selectedNamHoc}_${subject.id}`;
      const record = scoreRecords[key];
      const policy = getPolicyBySubject(subject);
      const hk = { ...createEmptySemester(policy.txCount), ...(record?.[selectedSemester] || {}) };
      const avg = calcSemesterAverage(hk);
      if (avg !== null) {
        totalAvg += avg;
        avgCount += 1;
        yearAverages.push(avg);
      }
    });

    commentSubjects.forEach(subject => {
      const key = `${selectedNamHoc}_${subject.id}`;
      const record = scoreRecords[key];
      const hk = record?.[selectedSemester];
      const result = hk?.nhanXet || "DAT";
      if (hk?.nhanXet) {
         commentResults.push(result);
      }
    });

    const dtbHk = avgCount > 0 ? Number((totalAvg / avgCount).toFixed(1)) : null;
    
    let classification = { label: "--", color: "text-slate-600" };
    if (dtbHk !== null) {
        const cls = classifyHocLuc(dtbHk, yearAverages, commentResults);
        classification = getHocLucLabel(cls?.value);
    }

    const targetHocKy = selectedSemester === "HK1" ? 1 : 2;

    const hkObj = hanhKiemList.find(h => {
      return String(h.hocKy) === String(targetHocKy);
    });
    
    const hanhKiemDisplay = getHanhKiemLabel(hkObj?.xepLoai || hkObj?.hanhKiem);

    return {
      label: "Điểm trung bình học kỳ:",
      dtb: dtbHk,
      hocLuc: classification,
      hanhKiem: hanhKiemDisplay
    };
  }, [scoreRecords, selectedNamHoc, selectedSemester, scoredSubjects, commentSubjects, hanhKiemList, hocBaList, namHocListObj, student?.id]);



  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-12">
      <div className="bg-white border-b border-slate-200 pt-8 pb-6 px-6 md:px-12">
        <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight mb-1">Bảng điểm</h2>
        <p className="text-sm font-medium text-slate-500">Tra cứu kết quả học tập chi tiết.</p>
      </div>

      <div className="p-6 md:p-12 w-full flex flex-col gap-6">
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Năm học</span>
              <select 
                value={selectedNamHoc} 
                onChange={(e) => setSelectedNamHoc(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-4 py-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {namHocList.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Học kỳ</span>
              <select 
                value={selectedSemester} 
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-4 py-2 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="HK1">Học kỳ 1</option>
                <option value="HK2">Học kỳ 2</option>
                <option value="CA_NAM">Cả năm</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={selectedSemester === "CA_NAM" || isExporting}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {isExporting ? "Đang xử lý..." : "Xuất PDF"}
          </button>
        </div>

        {error && <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600 font-medium shadow-sm">{error}</div>}

        {!error && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  {selectedSemester === "CA_NAM" ? (
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 border-r border-slate-200 w-1/3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle">Môn học</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">ĐTB HK1</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border-r border-slate-200">ĐTB HK2</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">ĐTB Cả Năm</th>
                    </tr>
                  ) : (
                    <>
                      <tr className="border-b border-slate-200">
                        <th rowSpan={2} className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-20 border-r border-slate-200 w-1/4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle">Môn học</th>
                        <th colSpan={4} className="px-5 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider text-center border-b border-slate-200 border-r border-slate-200">Thường xuyên</th>
                        <th rowSpan={2} className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24 align-middle border-r border-slate-200">Giữa kỳ</th>
                        <th rowSpan={2} className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24 align-middle border-r border-slate-200">Cuối kỳ</th>
                        <th rowSpan={2} className="px-5 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center w-24 align-middle">TB môn</th>
                      </tr>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase text-center border-r border-slate-200 w-16">Lần 1</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase text-center border-r border-slate-200 w-16">Lần 2</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase text-center border-r border-slate-200 w-16">Lần 3</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase text-center w-16 border-r border-slate-200">Lần 4</th>
                      </tr>
                    </>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {scoredSubjects.map((subject, idx) => {
                    const key = `${selectedNamHoc}_${subject.id}`;
                    const record = scoreRecords[key];
                    const policy = getPolicyBySubject(subject);
                    const isEven = idx % 2 === 0;

                    if (selectedSemester === "CA_NAM") {
                      const hk1 = { ...createEmptySemester(policy.txCount), ...(record?.["HK1"] || {}) };
                      const hk2 = { ...createEmptySemester(policy.txCount), ...(record?.["HK2"] || {}) };
                      const hk1Avg = calcSemesterAverage(hk1);
                      const hk2Avg = calcSemesterAverage(hk2);
                      const yearAvg = calcYearAverage(hk1Avg, hk2Avg);
                      
                      return (
                        <tr key={subject.id} className={`hover:bg-blue-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className={`px-5 py-3.5 text-sm font-semibold text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] ${isEven ? 'bg-white' : 'bg-slate-50'}`}>{subject.tenMon}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk1Avg !== null ? hk1Avg.toFixed(1) : ""}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk2Avg !== null ? hk2Avg.toFixed(1) : ""}</td>
                          <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-center">{yearAvg !== null ? yearAvg.toFixed(1) : ""}</td>
                        </tr>
                      );
                    }

                    const hk = { ...createEmptySemester(policy.txCount), ...(record?.[selectedSemester] || {}) };
                    const avg = calcSemesterAverage(hk);

                    return (
                      <tr key={subject.id} className={`hover:bg-blue-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className={`px-5 py-3.5 text-sm font-semibold text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] ${isEven ? 'bg-white' : 'bg-slate-50'}`}>{subject.tenMon}</td>
                        <td className="px-3 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.tx[0] || ""}</td>
                        <td className="px-3 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.tx[1] || ""}</td>
                        <td className="px-3 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.tx[2] || ""}</td>
                        <td className="px-3 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.tx[3] || ""}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.gk || ""}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-600 text-center border-r border-slate-200">{hk.ck || ""}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-center">{avg !== null ? avg.toFixed(1) : ""}</td>
                      </tr>
                    );
                  })}

                  {commentSubjects.map((subject, idx) => {
                    const key = `${selectedNamHoc}_${subject.id}`;
                    const record = scoreRecords[key];
                    const isEven = (scoredSubjects.length + idx) % 2 === 0;
                    
                    if (selectedSemester === "CA_NAM") {
                      const hk1 = record?.["HK1"];
                      const hk2 = record?.["HK2"];
                      let nx1 = "";
                      let nx2 = "";
                      let nxCaNam = "";
                      if (hk1?.nhanXet === "DAT") nx1 = "Đạt";
                      else if (hk1?.nhanXet === "CHUA_DAT") nx1 = "Chưa đạt";
                      if (hk2?.nhanXet === "DAT") nx2 = "Đạt";
                      else if (hk2?.nhanXet === "CHUA_DAT") nx2 = "Chưa đạt";
                      
                      if (hk1?.nhanXet && hk2?.nhanXet) {
                          nxCaNam = (hk1.nhanXet === "DAT" && hk2.nhanXet === "DAT") ? "Đạt" : "Chưa đạt";
                      }

                      return (
                        <tr key={subject.id} className={`hover:bg-blue-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className={`px-5 py-3.5 text-sm font-semibold text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] ${isEven ? 'bg-white' : 'bg-slate-50'}`}>{subject.tenMon}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-800 text-center border-r border-slate-200">{nx1}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-slate-800 text-center border-r border-slate-200">{nx2}</td>
                          <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-center">{nxCaNam}</td>
                        </tr>
                      );
                    }

                    const hk = record?.[selectedSemester] || {};
                    let displayNx = "";
                    if (hk.nhanXet === "DAT") displayNx = "Đạt";
                    else if (hk.nhanXet === "CHUA_DAT") displayNx = "Chưa đạt";

                    return (
                      <tr key={subject.id} className={`hover:bg-blue-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <td className={`px-5 py-3.5 text-sm font-semibold text-slate-700 sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] ${isEven ? 'bg-white' : 'bg-slate-50'}`}>{subject.tenMon}</td>
                        <td className="px-5 py-3.5 text-sm font-medium text-slate-400 text-center italic border-r border-slate-200" colSpan={6}>Đánh giá bằng nhận xét</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-center">{displayNx}</td>
                      </tr>
                    );
                  })}

                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm font-medium text-slate-500">
                        Chưa có danh sách môn học.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-8">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">{semesterSummary?.label || "Điểm trung bình học kỳ:"}</span>
                <span className="text-lg font-bold text-slate-800">{semesterSummary?.dtb !== null ? semesterSummary?.dtb?.toFixed(1) : "--"}</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Học lực:</span>
                <span className={`text-lg font-bold ${semesterSummary?.hocLuc?.color || "text-slate-800"}`}>{semesterSummary?.hocLuc?.label || "--"}</span>
              </div>
              <div className="hidden md:block w-px h-5 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">Hạnh kiểm:</span>
                <span className={`text-lg font-bold ${semesterSummary?.hanhKiem?.color}`}>{semesterSummary?.hanhKiem?.label}</span>
              </div>
            </div>

          </div>
        )}
      </div>
      <div className="fixed bottom-0 right-0 p-2 text-[10px] text-slate-300 opacity-50 font-mono pointer-events-none whitespace-pre">
        DEBUG HK: {hanhKiemList?.length} - Y: {selectedNamHoc} - S: {selectedSemester}
        HB: {hocBaList?.length}
        {JSON.stringify(hocBaList.map(h => ({ namHoc: h.namHoc, hanhKiem: h.hanhKiem })))}
      </div>

      <PdfPreviewModal 
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfUrl={pdfUrl}
        title="Xem trước Bảng điểm PDF"
      />
    </div>
  );
}

