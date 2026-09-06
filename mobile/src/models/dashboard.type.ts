export interface StudentInfo {
  id: number;
  maHocSinh: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh: string | boolean;
  diaChi: string;
  soDienThoai?: string;
  sdt?: string;
  email?: string;
  danToc?: string;
  tonGiao?: string;
  maBhyt?: string;
  dienChinhSach?: boolean;
  namNhapHoc?: number;
  trangThai?: number;
  anhDaiDien: string | null;
  lop: {
    id: number;
    tenLop: string;
    khoi: number;
    namHoc?: string;
    gvcn?: {
      id: number;
      hoTen: string;
      email?: string;
      sdt?: string;
    } | null;
    giaoVienChuNhiem?: {
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
  daDoc?: boolean;
}

export interface TimetableEntry {
  id: number;
  thu: number;
  tietBatDau: number;
  soTiet: number;
  monHoc: {
    id: number;
    tenMon: string;
    tenMonHoc?: string;
  } | null;
  phongHoc: string;
  giaoVien: {
    id: number;
    hoTen: string;
  } | null;
  ghiChu?: string | null;
}

export interface ConductRecord {
  id: number;
  xepLoai: string;
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
  baiKiemTraCount?: number;
  examWeek?: boolean;
}
