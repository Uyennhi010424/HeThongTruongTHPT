export interface StudentInfo {
  id: number;
  maHocSinh: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: boolean;
  diaChi: string;
  soDienThoai: string;
  anhDaiDien: string | null;
  lop: {
    id: number;
    tenLop: string;
    khoi: number;
    giaoVienChuNhiem: {
      id: number;
      hoTen: string;
    } | null;
  } | null;
}

export interface Notice {
  id: number;
  tieuDe: string;
  noiDung: string;
  ngayGui: string;
  loaiThongBao: string;
  daDoc?: boolean; // Mobile only or returned from unread mapping
}

export interface TimetableEntry {
  id: number;
  thu: number;
  tietBatDau: number;
  soTiet: number;
  monHoc: {
    id: number;
    tenMonHoc: string;
  } | null;
  phongHoc: string;
  giaoVien: {
    id: number;
    hoTen: string;
  } | null;
}

export interface ConductRecord {
  id: number;
  xepLoai: string; // TOT, KHA, TRUNG_BINH, YEU
  nhanXet: string;
  ngayDanhGia: string;
}

export interface AttendanceStats {
  tongSoBuoi?: number;
  soBuoiVang?: number;
  soBuoiVangCoPhep?: number;
  soBuoiVangKhongPhep?: number;
  soLanTre?: number;
}

export interface DashboardData {
  student: StudentInfo;
  notices: Notice[];
  timetable: TimetableEntry[];
  exams: any[];
  subjects: any[];
  scores: any[];
  conducts: ConductRecord[];
  attendanceStats: AttendanceStats;
  subjectScores: any[];
  gpa: number | null;
}
