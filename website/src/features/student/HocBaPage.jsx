import { useEffect, useMemo, useState } from "react";
import { getHocBa } from "../../api/hocbaApi.js";
import { getCurrentHocSinh } from "../../api/hocsinhApi.js";
import { getNamHoc } from "../../api/namhocApi.js";
import { getActiveAcademicYear, getVisibleAcademicYears } from "../../utils/helpers.js";
import { getDiem } from "../../api/diemApi.js";
import { getHanhKiem } from "../../api/hanhkiemApi.js";

const getHocLucLabel = (value) => {
  switch (value) {
    case "TOT":
    case "GIOI": return { label: "Giỏi", color: "text-emerald-600" };
    case "KHA": return { label: "Khá", color: "text-blue-600" };
    case "DAT":
    case "TRUNG_BINH": return { label: "Trung bình", color: "text-amber-500" };
    case "CHUA_DAT":
    case "YEU":
    case "KEM": return { label: "Yếu", color: "text-red-500" };
    default: return { label: value || "--", color: "text-slate-400" };
  }
};

const getHanhKiemLabel = (value) => {
  switch (value) {
    case "TOT": return { label: "Tốt", color: "text-emerald-600" };
    case "KHA": return { label: "Khá", color: "text-blue-600" };
    case "TRUNG_BINH": return { label: "Trung bình", color: "text-amber-500" };
    case "YEU": return { label: "Yếu", color: "text-red-500" };
    default: return { label: value || "--", color: "text-slate-400" };
  }
};

const calculateHocLuc = (dtb) => {
  if (dtb === null || dtb === undefined) return null;
  if (dtb >= 8.0) return "GIOI";
  if (dtb >= 6.5) return "KHA";
  if (dtb >= 5.0) return "TRUNG_BINH";
  return "YEU";
};

export default function HocBaPage() {
  const [hocBaList, setHocBaList] = useState([]);
  const [diemList, setDiemList] = useState([]);
  const [hanhKiemList, setHanhKiemList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [namHocList, setNamHocList] = useState([]);
  const [namHocListObj, setNamHocListObj] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const [studentRes, namHocRes] = await Promise.all([
          getCurrentHocSinh(),
          getNamHoc()
        ]);
        if (!active) return;

        const currentStudent = studentRes?.data?.data || null;
        setStudent(currentStudent);

        if (!currentStudent) {
          setLoading(false);
          return;
        }

        const hocBaRes = await getHocBa({ hocSinhId: currentStudent.id }).catch(() => null);
        const diemRes = await getDiem({ hocSinhId: currentStudent.id }).catch(() => null);
        const hkRes = await getHanhKiem({ hocSinhId: currentStudent.id }).catch(() => null);
        
        if (!active) return;
        setHocBaList(hocBaRes?.data?.data || []);
        setDiemList(diemRes?.data?.data || []);
        setHanhKiemList(hkRes?.data?.data || []);

        const rawYears = namHocRes?.data?.data || [];
        const visibleYears = getVisibleAcademicYears(rawYears);
        const years = visibleYears
          .map((item) => item?.tenNamHoc || "")
          .filter(Boolean);
        
        setNamHocListObj(visibleYears);
        setNamHocList(years);
        if (years.length > 0) {
          const activeYear = getActiveAcademicYear(visibleYears)?.tenNamHoc;
          setSelectedNamHoc(activeYear || years[0]);
        }
      } catch {
        if (!active) return;
        setError("Không thể tải học bạ.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, []);

  const filteredHocBa = useMemo(() => {
    if (!selectedNamHoc) return hocBaList;
    return hocBaList.filter((hb) => hb?.namHoc === selectedNamHoc || hb?.namHoc?.tenNamHoc === selectedNamHoc);
  }, [hocBaList, selectedNamHoc]);

  const latestHocBa = filteredHocBa.length > 0 ? filteredHocBa[0] : null;

  // Hàm tính điểm TB Học kỳ
  const calculateSemesterDtb = (hkNum) => {
    if (!diemList.length || !selectedNamHoc) return null;

    const semesterScores = diemList.filter(d => 
      (d.namHoc === selectedNamHoc || d.namHoc?.tenNamHoc === selectedNamHoc) && 
      d.hocKy === hkNum
    );

    if (semesterScores.length === 0) return null;

    const map = {};
    for (const s of semesterScores) {
      const mid = s.monHocId || s.monHoc?.id;
      if (!mid) continue;
      
      const val = s.giaTriDiem ?? s.giaTri;
      if (val == null || val === "") continue;

      if (!map[mid]) map[mid] = { monHocId: mid, tx: [], gk: [], ck: [] };
      if (s.loaiDiem === "TX" || s.loaiDiem === "15p" || s.loaiDiem === "15'")
        map[mid].tx.push(Number(val));
      else if (s.loaiDiem === "GK" || s.loaiDiem === "1t")
        map[mid].gk.push(Number(val));
      else if (s.loaiDiem === "CK" || s.loaiDiem === "thi")
        map[mid].ck.push(Number(val));
    }

    const averages = Object.values(map).map((item) => {
      const avgTx = item.tx.length ? item.tx.reduce((a, b) => a + b, 0) / item.tx.length : null;
      const avgGk = item.gk.length ? item.gk.reduce((a, b) => a + b, 0) / item.gk.length : null;
      const avgCk = item.ck.length ? item.ck.reduce((a, b) => a + b, 0) / item.ck.length : null;
      let ws = 0, wt = 0;
      if (avgTx != null) { ws += avgTx * 1; wt += 1; }
      if (avgGk != null) { ws += avgGk * 2; wt += 2; }
      if (avgCk != null) { ws += avgCk * 3; wt += 3; }
      return wt > 0 ? ws / wt : null;
    }).filter(a => a !== null);

    return averages.length ? averages.reduce((a, b) => a + b, 0) / averages.length : null;
  };

  const currentPhase = useMemo(() => {
    const selectedObj = namHocListObj.find(n => n.tenNamHoc === selectedNamHoc);
    if (!selectedObj || !selectedObj.ngayKetThucHk1 || !selectedObj.ngayKetThucHk2) return "ALL";
    const now = new Date();
    const endHk1 = new Date(selectedObj.ngayKetThucHk1);
    const endHk2 = new Date(selectedObj.ngayKetThucHk2);
    if (now <= endHk1) return "HK1";
    if (now <= endHk2) return "HK2";
    return "ALL";
  }, [selectedNamHoc, namHocListObj]);

  const dtbHK1 = useMemo(() => calculateSemesterDtb(1), [diemList, selectedNamHoc]);
  const dtbHK2 = useMemo(() => calculateSemesterDtb(2), [diemList, selectedNamHoc]);

  const dtbCaNam = useMemo(() => {
    if (dtbHK1 === null && dtbHK2 === null) return null;
    if (dtbHK2 === null) return dtbHK1;
    if (dtbHK1 === null) return dtbHK2;
    return (dtbHK1 + dtbHK2 * 2) / 3;
  }, [dtbHK1, dtbHK2]);

  const hk1HanhKiemObj = useMemo(() => {
    return hanhKiemList.find(h => (h.namHoc === selectedNamHoc || h.namHoc?.tenNamHoc === selectedNamHoc) && h.hocKy === 1);
  }, [hanhKiemList, selectedNamHoc]);

  const hk2HanhKiemObj = useMemo(() => {
    return hanhKiemList.find(h => (h.namHoc === selectedNamHoc || h.namHoc?.tenNamHoc === selectedNamHoc) && h.hocKy === 2);
  }, [hanhKiemList, selectedNamHoc]);

  const displayDtbCaNam = latestHocBa?.diemTBCaNam ?? (dtbCaNam !== null ? dtbCaNam.toFixed(1) : "--");
  const displayHocLucCaNam = getHocLucLabel(latestHocBa?.hocLuc || calculateHocLuc(dtbCaNam));
  const displayHanhKiemCaNam = getHanhKiemLabel(latestHocBa?.hanhKiem || hk2HanhKiemObj?.xepLoai || hk1HanhKiemObj?.xepLoai);

  const displayHocLucHK1 = getHocLucLabel(calculateHocLuc(dtbHK1));
  const displayHanhKiemHK1 = getHanhKiemLabel(hk1HanhKiemObj?.xepLoai);
  
  const displayHocLucHK2 = getHocLucLabel(calculateHocLuc(dtbHK2));
  const displayHanhKiemHK2 = getHanhKiemLabel(hk2HanhKiemObj?.xepLoai);

  const displayNhanXet = latestHocBa?.ghiChu || hk2HanhKiemObj?.nhanXet || hk1HanhKiemObj?.nhanXet;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-6 px-6 md:px-12">
        <div className="w-full">
          <h2 className="text-2xl font-extrabold text-blue-900 tracking-tight mb-1">Học bạ</h2>
          <p className="text-sm font-medium text-slate-500">Tra cứu kết quả học tập theo từng năm học.</p>
        </div>
      </div>

      <div className="p-6 md:p-12 w-full flex flex-col gap-6">
        {/* Bộ lọc */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Năm học</span>
            <select 
              value={selectedNamHoc} 
              onChange={(e) => setSelectedNamHoc(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {namHocList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600 font-medium">{error}</div>}

        {!error && !loading && !latestHocBa && dtbHK1 === null && dtbHK2 === null && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
            Chưa có dữ liệu học tập cho năm học này.
          </div>
        )}

        {!error && (latestHocBa || dtbHK1 !== null || dtbHK2 !== null) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-800">Tổng kết kết quả học tập</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/5">Kỳ học</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/5">Điểm TB</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/5">Học lực</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/5">Hạnh kiểm</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/5">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  { (currentPhase === "HK1" || currentPhase === "HK2" || currentPhase === "ALL") && (
                    <tr className="hover:bg-slate-50/50 transition-colors bg-white">
                      <td className="px-6 py-5 text-sm font-bold text-slate-700">Học kỳ I</td>
                      <td className="px-6 py-5 text-xl font-bold text-slate-800">{dtbHK1 !== null ? dtbHK1.toFixed(1) : "--"}</td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHocLucHK1.color}>{displayHocLucHK1.label}</span></td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHanhKiemHK1.color}>{displayHanhKiemHK1.label}</span></td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHocLucHK1.color}>{displayHocLucHK1.label}</span></td>
                    </tr>
                  )}
                  { (currentPhase === "HK2" || currentPhase === "ALL") && (
                    <tr className="hover:bg-slate-50/50 transition-colors bg-white">
                      <td className="px-6 py-5 text-sm font-bold text-slate-700">Học kỳ II</td>
                      <td className="px-6 py-5 text-xl font-bold text-slate-800">{dtbHK2 !== null ? dtbHK2.toFixed(1) : "--"}</td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHocLucHK2.color}>{displayHocLucHK2.label}</span></td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHanhKiemHK2.color}>{displayHanhKiemHK2.label}</span></td>
                      <td className="px-6 py-5 text-base font-bold"><span className={displayHocLucHK2.color}>{displayHocLucHK2.label}</span></td>
                    </tr>
                  )}
                  { currentPhase === "ALL" && (
                    <tr className="bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-6 text-base font-bold text-blue-900">Cả năm</td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-2xl font-extrabold text-blue-900 tracking-tight">{displayDtbCaNam}</span>
                          {displayDtbCaNam !== "--" && (
                            <div className="w-24 bg-blue-100 rounded-full h-1.5 mt-2 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(Number(displayDtbCaNam) / 10) * 100}%` }}></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-lg font-bold"><span className={displayHocLucCaNam.color}>{displayHocLucCaNam.label}</span></td>
                      <td className="px-6 py-6 text-lg font-bold"><span className={displayHanhKiemCaNam.color}>{displayHanhKiemCaNam.label}</span></td>
                      <td className="px-6 py-6 text-lg font-bold"><span className={displayHocLucCaNam.color}>{displayHocLucCaNam.label}</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nhận xét giáo viên */}
        {!error && (latestHocBa || hk1HanhKiemObj || hk2HanhKiemObj) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Nhận xét của giáo viên chủ nhiệm</h3>
            <div className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[60px]">
              {displayNhanXet ? displayNhanXet : "Chưa có nhận xét."}
            </div>
          </div>
        )}

        {/* Lịch sử học bạ */}
        {!error && hocBaList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">Lịch sử học bạ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Năm học</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Điểm TB</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Học lực</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Hạnh kiểm</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Xếp loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hocBaList.map((hb) => {
                    const hocLuc = getHocLucLabel(hb.hocLuc);
                    const hanhKiem = getHanhKiemLabel(hb.hanhKiem);
                    const namHocText = hb.namHoc?.tenNamHoc || hb.namHoc || "--";
                    return (
                      <tr key={hb.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{namHocText}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{hb.diemTBCaNam ?? "--"}</td>
                        <td className="px-6 py-4 text-sm font-semibold"><span className={hocLuc.color}>{hocLuc.label}</span></td>
                        <td className="px-6 py-4 text-sm font-semibold"><span className={hanhKiem.color}>{hanhKiem.label}</span></td>
                        <td className="px-6 py-4 text-sm font-semibold"><span className={hocLuc.color}>{hocLuc.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

